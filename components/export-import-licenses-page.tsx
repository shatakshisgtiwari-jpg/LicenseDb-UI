"use client";

import { Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type Format = "json" | "csv";
type License = { spdxId: string; shortName: string; fullName: string; text: string; risk: number | null; url: string; notes: string; source: string; copyleft: boolean; osiApproved: boolean; textUpdatable: boolean; active: boolean };
type LicenseResponse = { data: License[]; pagination: { totalPages: number; page: number } };

async function getAllLicenses() {
  const licenses: License[] = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const response = await fetch(`/api/licenses?page=${page}&limit=100`, { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load licenses");
    const result = await response.json() as LicenseResponse;
    licenses.push(...result.data);
    totalPages = result.pagination.totalPages;
    page += 1;
  }
  return licenses;
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(licenses: License[]) {
  const fields = ["spdx_id", "shortname", "fullname", "text", "risk", "url", "notes", "source", "copyleft", "OSIapproved", "text_updatable", "active"] as const;
  return [fields.join(","), ...licenses.map((license) => fields.map((field) => csvEscape({ spdx_id: license.spdxId, shortname: license.shortName, fullname: license.fullName, text: license.text, risk: license.risk, url: license.url, notes: license.notes, source: license.source, copyleft: license.copyleft, OSIapproved: license.osiApproved, text_updatable: license.textUpdatable, active: license.active }[field])).join(","))].join("\r\n");
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

function normalizeImport(value: Record<string, unknown>) {
  const spdxId = String(value.spdx_id ?? value.spdxId ?? "").trim();
  const shortName = String(value.shortname ?? value.shortName ?? "").trim();
  const fullName = String(value.fullname ?? value.fullName ?? "").trim();
  const text = String(value.text ?? "").trim();
  if (!spdxId || !shortName || !fullName || !text) return null;
  const risk = Number(value.risk);
  return { spdx_id: spdxId, shortname: shortName, fullname: fullName, text, risk: Number.isFinite(risk) ? risk : 0, url: String(value.url ?? "").trim(), notes: String(value.notes ?? "").trim(), source: String(value.source ?? "").trim(), copyleft: booleanValue(value.copyleft), OSIapproved: booleanValue(value.OSIapproved ?? value.osiApproved), text_updatable: booleanValue(value.text_updatable ?? value.textUpdatable), active: booleanValue(value.active, true) };
}

export function ExportImportLicensesPage() {
  const t = useTranslations("ExportImportLicenses");
  const [exportFormat, setExportFormat] = useState<Format>("json");
  const [importFormat, setImportFormat] = useState<Format>("json");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const importInput = useRef<HTMLInputElement>(null);

  async function exportLicenses() {
    setBusy(true); setStatus(null);
    try {
      const licenses = await getAllLicenses();
      const content = exportFormat === "json" ? JSON.stringify({ data: licenses }, null, 2) : toCsv(licenses);
      const blob = new Blob([content], { type: exportFormat === "json" ? "application/json" : "text/csv" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = `licenses.${exportFormat}`; anchor.click(); URL.revokeObjectURL(url);
      setStatus(t("exported", { count: licenses.length }));
    } catch { setStatus(t("exportError")); } finally { setBusy(false); }
  }

  async function importLicenses(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true); setStatus(null);
    try {
      const content = await file.text();
      const raw = importFormat === "json" ? (() => { const value: unknown = JSON.parse(content); return Array.isArray(value) ? value : typeof value === "object" && value !== null && Array.isArray((value as { data?: unknown }).data) ? (value as { data: unknown[] }).data : []; })() : parseCsv(content);
      if (!Array.isArray(raw)) throw new Error("Invalid import");
      const licenses = raw.filter((value): value is Record<string, unknown> => typeof value === "object" && value !== null).map(normalizeImport).filter((value): value is NonNullable<typeof value> => value !== null);
      if (!licenses.length) throw new Error("No valid licenses");
      let imported = 0;
      for (const license of licenses) { const response = await fetch("/api/licenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(license) }); if (response.ok) imported += 1; }
      setStatus(imported === licenses.length ? t("imported", { count: imported }) : t("partiallyImported", { imported, total: licenses.length }));
    } catch { setStatus(t("importError")); } finally { setBusy(false); }
  }

  return <div className="min-h-svh bg-white text-[#242026]"><header className="flex h-12 items-center border-b border-[#e2dfe3] px-4"><h1 className="text-base font-semibold">{t("title")}</h1></header><main className="grid max-w-5xl gap-5 p-4 md:grid-cols-2 md:gap-0"><section className="grid content-start gap-3 md:pr-5"><h2 className="text-xs font-semibold">{t("exportTitle")}</h2><p className="text-[10px] leading-relaxed">{t("exportDescription")}</p><fieldset className="grid gap-2 text-[10px]"><legend className="mb-1">{t("chooseFormat")}</legend><div className="flex gap-4">{(["json", "csv"] as const).map((format) => <label key={format} className="flex items-center gap-1.5"><input type="radio" name="export-format" checked={exportFormat === format} onChange={() => setExportFormat(format)} className="size-3 accent-[#7b1a89]" />{format.toUpperCase()}</label>)}</div></fieldset><Button type="button" size="sm" onClick={exportLicenses} disabled={busy} className="w-fit rounded-sm bg-white px-2 text-[10px] text-[#7b1a89] ring-1 ring-[#bd82c3] hover:bg-[#fbf2fc]"><Download /> {t("exportAction")}</Button></section><section className="grid content-start gap-3 border-[#e2dfe3] md:border-l md:pl-5"><h2 className="text-xs font-semibold">{t("importTitle")}</h2><p className="text-[10px] leading-relaxed">{t("importDescription")}</p><fieldset className="grid gap-2 text-[10px]"><legend className="mb-1">{t("chooseFormat")}</legend><div className="flex gap-4">{(["json", "csv"] as const).map((format) => <label key={format} className="flex items-center gap-1.5"><input type="radio" name="import-format" checked={importFormat === format} onChange={() => setImportFormat(format)} className="size-3 accent-[#7b1a89]" />{format.toUpperCase()}</label>)}</div></fieldset><input ref={importInput} type="file" accept={importFormat === "json" ? ".json,application/json" : ".csv,text/csv"} onChange={importLicenses} className="hidden" /><Button type="button" size="sm" onClick={() => importInput.current?.click()} disabled={busy} className="w-fit rounded-sm bg-white px-2 text-[10px] text-[#7b1a89] ring-1 ring-[#bd82c3] hover:bg-[#fbf2fc]"><Upload /> {t("importAction")}</Button></section>{status ? <p role="status" className="text-xs text-[#514a55] md:col-span-2">{status}</p> : null}</main></div>;
}