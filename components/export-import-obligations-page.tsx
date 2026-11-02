"use client";

import { Download, Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type Format = "json" | "csv";
type Obligation = { topic: string; type: string; text: string; classification: string; category: string; comment: string; active: boolean; textUpdatable: boolean; licenseIds: string[] };
type ObligationResponse = { data: Obligation[]; pagination: { totalPages: number; page: number } };

async function getAllObligations() {
  const obligations: Obligation[] = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const response = await fetch(`/api/obligations?page=${page}&limit=100`, { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load obligations");
    const result = await response.json() as ObligationResponse;
    obligations.push(...result.data);
    totalPages = result.pagination.totalPages;
    page += 1;
  }
  return obligations;
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(obligations: Obligation[]) {
  const fields = ["topic", "type", "text", "classification", "category", "comment", "active", "text_updatable", "license_ids"] as const;
  return [fields.join(","), ...obligations.map((obligation) => fields.map((field) => csvEscape({ topic: obligation.topic, type: obligation.type, text: obligation.text, classification: obligation.classification, category: obligation.category, comment: obligation.comment, active: obligation.active, text_updatable: obligation.textUpdatable, license_ids: obligation.licenseIds.join(";") }[field])).join(","))].join("\r\n");
}

function parseCsv(text: string) {
  const rows: string[][] = [[]];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted && character === '"' && text[index + 1] === '"') { field += character; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (!quoted && character === ",") { rows.at(-1)?.push(field); field = ""; }
    else if (!quoted && (character === "\n" || character === "\r")) { if (character === "\r" && text[index + 1] === "\n") index += 1; rows.at(-1)?.push(field); field = ""; rows.push([]); }
    else field += character;
  }
  rows.at(-1)?.push(field);
  const [headers, ...dataRows] = rows.filter((row) => row.some((value) => value.trim()));
  if (!headers) return [];
  return dataRows.map((row) => Object.fromEntries(headers.map((header, index) => [header.trim(), row[index] ?? ""])));
}

function booleanValue(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.trim().toLowerCase() === "true";
  return fallback;
}

function licenseIds(value: unknown) {
  if (Array.isArray(value)) return value.filter((id): id is string => typeof id === "string" && id.trim().length > 0);
  if (typeof value === "string") return value.split(";").map((id) => id.trim()).filter(Boolean);
  return [];
}

function normalizeImport(value: Record<string, unknown>) {
  const topic = String(value.topic ?? "").trim();
  const type = String(value.type ?? "").trim();
  const text = String(value.text ?? "").trim();
  const classification = String(value.classification ?? "").trim();
  const category = String(value.category ?? "").trim();
  if (!topic || !type || !text || !classification || !category) return null;
  return { topic, type, text, classification, category, comment: String(value.comment ?? "").trim(), active: booleanValue(value.active, true), text_updatable: booleanValue(value.text_updatable ?? value.textUpdatable), license_ids: licenseIds(value.license_ids ?? value.licenseIds) };
}

export function ExportImportObligationsPage() {
  const t = useTranslations("ExportImportObligations");
  const [exportFormat, setExportFormat] = useState<Format>("json");
  const [importFormat, setImportFormat] = useState<Format>("json");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const importInput = useRef<HTMLInputElement>(null);

  async function exportObligations() {
    setBusy(true); setStatus(null);
    try {
      const obligations = await getAllObligations();
      const content = exportFormat === "json" ? JSON.stringify({ data: obligations }, null, 2) : toCsv(obligations);
      const blob = new Blob([content], { type: exportFormat === "json" ? "application/json" : "text/csv" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = `obligations.${exportFormat}`; anchor.click(); URL.revokeObjectURL(url);
      setStatus(t("exported", { count: obligations.length }));
    } catch { setStatus(t("exportError")); } finally { setBusy(false); }
  }

  async function importObligations(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true); setStatus(null);
    try {
      const content = await file.text();
      const raw = importFormat === "json" ? (() => { const value: unknown = JSON.parse(content); return Array.isArray(value) ? value : typeof value === "object" && value !== null && Array.isArray((value as { data?: unknown }).data) ? (value as { data: unknown[] }).data : []; })() : parseCsv(content);
      if (!Array.isArray(raw)) throw new Error("Invalid import");
      const obligations = raw.filter((value): value is Record<string, unknown> => typeof value === "object" && value !== null).map(normalizeImport).filter((value): value is NonNullable<typeof value> => value !== null);
      if (!obligations.length) throw new Error("No valid obligations");
      let imported = 0;
      for (const obligation of obligations) { const response = await fetch("/api/obligations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(obligation) }); if (response.ok) imported += 1; }
      setStatus(imported === obligations.length ? t("imported", { count: imported }) : t("partiallyImported", { imported, total: obligations.length }));
    } catch { setStatus(t("importError")); } finally { setBusy(false); }
  }

  return <div className="min-h-svh bg-white text-[#242026]"><header className="flex h-12 items-center border-b border-[#e2dfe3] px-4"><h1 className="text-base font-semibold">{t("title")}</h1></header><main className="grid max-w-5xl gap-5 p-4 md:grid-cols-2 md:gap-0"><section className="grid content-start gap-3 md:pr-5"><h2 className="text-xs font-semibold">{t("exportTitle")}</h2><p className="text-[10px] leading-relaxed">{t("exportDescription")}</p><fieldset className="grid gap-2 text-[10px]"><legend className="mb-1">{t("chooseFormat")}</legend><div className="flex gap-4">{(["json", "csv"] as const).map((format) => <label key={format} className="flex items-center gap-1.5"><input type="radio" name="export-format" checked={exportFormat === format} onChange={() => setExportFormat(format)} className="size-3 accent-[#7b1a89]" />{format.toUpperCase()}</label>)}</div></fieldset><Button type="button" size="sm" onClick={exportObligations} disabled={busy} className="w-fit rounded-sm bg-white px-2 text-[10px] text-[#7b1a89] ring-1 ring-[#bd82c3] hover:bg-[#fbf2fc]"><Download /> {t("exportAction")}</Button></section><section className="grid content-start gap-3 border-[#e2dfe3] md:border-l md:pl-5"><h2 className="text-xs font-semibold">{t("importTitle")}</h2><p className="text-[10px] leading-relaxed">{t("importDescription")}</p><fieldset className="grid gap-2 text-[10px]"><legend className="mb-1">{t("chooseFormat")}</legend><div className="flex gap-4">{(["json", "csv"] as const).map((format) => <label key={format} className="flex items-center gap-1.5"><input type="radio" name="import-format" checked={importFormat === format} onChange={() => setImportFormat(format)} className="size-3 accent-[#7b1a89]" />{format.toUpperCase()}</label>)}</div></fieldset><input ref={importInput} type="file" accept={importFormat === "json" ? ".json,application/json" : ".csv,text/csv"} onChange={importObligations} className="hidden" /><Button type="button" size="sm" onClick={() => importInput.current?.click()} disabled={busy} className="w-fit rounded-sm bg-white px-2 text-[10px] text-[#7b1a89] ring-1 ring-[#bd82c3] hover:bg-[#fbf2fc]"><Upload /> {t("importAction")}</Button></section>{status ? <p className="col-span-full mt-1 text-[10px] text-[#4d4650]" role="status">{status}</p> : null}</main></div>;
}