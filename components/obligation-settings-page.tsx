"use client";

import { CheckCircle2, CircleX, Plus, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type SettingKind = "type" | "category" | "classification";
type Setting = { value: string; color: string };
type Settings = Record<SettingKind, Setting[]>;

async function getSettings() {
  const response = await fetch("/api/obligations/settings", { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load obligation settings");
  return response.json() as Promise<Settings>;
}

async function settingRequest(method: "POST" | "DELETE", body: { kind: SettingKind; value: string; color?: string }) {
  const url = method === "DELETE" ? `/api/obligations/settings?${new URLSearchParams({ kind: body.kind, value: body.value })}` : "/api/obligations/settings";
  const response = await fetch(url, method === "POST" ? { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : { method });
  if (!response.ok) throw new Error("Unable to save obligation setting");
}

function display(value: string) {
  return value.toLowerCase().replace(/(^|[_ -])(\w)/g, (_, prefix: string, character: string) => `${prefix}${character.toUpperCase()}`);
}

function SettingsSection({ kind, items, onAdd, onRemove, pending }: { kind: SettingKind; items: Setting[]; onAdd: (value: string, color?: string) => void; onRemove: (value: string) => void; pending: boolean }) {
  const t = useTranslations("ObligationSettings");
  const [value, setValue] = useState("");
  const [color, setColor] = useState("#00FF00");
  const hasColor = kind === "classification";
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!value.trim()) return;
    onAdd(value, hasColor ? color : undefined);
    setValue("");
  }
  const heading = kind === "type" ? t("typeTitle") : kind === "category" ? t("categoryTitle") : t("classificationTitle");
  const listLabel = kind === "type" ? t("typeList") : kind === "category" ? t("categoryList") : t("classificationList");
  const placeholder = kind === "type" ? t("typePlaceholder") : kind === "category" ? t("categoryPlaceholder") : t("classificationPlaceholder");
  return <section className="grid gap-3 border-b border-[#e2dfe3] pb-5 last:border-0"><h2 className="text-xs font-semibold">{heading}</h2><form onSubmit={submit} className="flex flex-wrap items-center gap-3"><input value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} disabled={pending} className="h-6 w-60 rounded-sm border border-[#aaa5ac] px-2 text-[9px] outline-none focus:border-[#7b1a89]" />{hasColor ? <label className="flex h-6 items-center gap-2"><span className="sr-only">{t("color")}</span><input type="color" value={color} onChange={(event) => setColor(event.target.value)} disabled={pending} className="h-6 w-12 cursor-pointer border border-[#aaa5ac] bg-white p-0.5" /></label> : null}<Button type="submit" size="xs" disabled={pending} className="rounded-sm bg-[#7b1a89] px-2 text-[9px] hover:bg-[#671473]"><Plus />{t("add")}</Button></form><div className="grid gap-2"><p className="text-[9px] font-semibold">{listLabel}</p><ul className="flex flex-wrap gap-2">{items.map((item) => <li key={item.value} className="flex h-6 items-center gap-1 rounded-sm border border-[#b8b4b8] bg-white px-1.5 text-[9px]"><span className={hasColor ? "size-3 rounded-full border border-black/10" : "hidden"} style={hasColor ? { backgroundColor: item.color || "#d8d5d9" } : undefined} />{display(item.value)}{hasColor && item.color ? ` - ${item.color.toUpperCase()}` : null}<Button type="button" variant="ghost" size="icon-xs" aria-label={t("remove", { value: item.value })} disabled={pending} onClick={() => onRemove(item.value)} className="-mr-1 size-4 rounded-none p-0 text-[#7b1a89] hover:bg-transparent hover:text-[#5d1069]"><X className="size-2.5" /></Button></li>)}</ul></div></section>;
}

export function ObligationSettingsPage() {
  const t = useTranslations("ObligationSettings");
  const client = useQueryClient();
  const [created, setCreated] = useState<{ kind: SettingKind; value: string } | null>(null);
  const [failed, setFailed] = useState<{ kind: SettingKind; value: string } | null>(null);
  const settingsQuery = useQuery({ queryKey: ["obligation-settings"], queryFn: getSettings });
  const mutation = useMutation({ mutationFn: ({ method, ...body }: { method: "POST" | "DELETE"; kind: SettingKind; value: string; color?: string }) => settingRequest(method, body), onMutate: () => { setCreated(null); setFailed(null); }, onSuccess: (_data, variables) => { client.invalidateQueries({ queryKey: ["obligation-settings"] }); if (variables.method === "POST") setCreated({ kind: variables.kind, value: variables.value }); }, onError: (_error, variables) => { if (variables.method === "POST") setFailed({ kind: variables.kind, value: variables.value }); } });
  function add(kind: SettingKind, value: string, color?: string) { mutation.mutate({ method: "POST", kind, value, color }); }
  function remove(kind: SettingKind, value: string) { mutation.mutate({ method: "DELETE", kind, value }); }
  if (settingsQuery.isLoading) return <main className="min-h-svh bg-white p-4 text-xs text-[#756b78]">{t("loading")}</main>;
  if (settingsQuery.isError || !settingsQuery.data) return <main className="min-h-svh bg-white p-4 text-xs text-[#9c3b47]">{t("unavailable")}</main>;
  return <div className="min-h-svh bg-white text-[#242026]"><header className="flex h-12 items-center border-b border-[#e2dfe3] px-4"><h1 className="text-base font-semibold">{t("title")}</h1></header><main className="grid max-w-4xl gap-5 p-4"><SettingsSection kind="type" items={settingsQuery.data.type} onAdd={(value) => add("type", value)} onRemove={(value) => remove("type", value)} pending={mutation.isPending} /><SettingsSection kind="category" items={settingsQuery.data.category} onAdd={(value) => add("category", value)} onRemove={(value) => remove("category", value)} pending={mutation.isPending} /><SettingsSection kind="classification" items={settingsQuery.data.classification} onAdd={(value, color) => add("classification", value, color)} onRemove={(value) => remove("classification", value)} pending={mutation.isPending} /></main>{created ? <aside role="status" className="fixed top-13 right-4 z-50 flex w-46 items-start gap-2 rounded-sm border border-[#cfe4d2] bg-[#edfaee] px-3 py-2 text-[#276536] shadow-sm"><CheckCircle2 aria-hidden="true" className="mt-0.5 size-3 shrink-0" /><div className="min-w-0 text-[8px]"><p className="font-semibold">{t("createdTitle", { kind: t(`${created.kind}Name`) })}</p><p className="mt-0.5 leading-tight">{t("createdDescription", { value: created.value, kind: t(`${created.kind}NamePlural`) })}</p></div><Button type="button" variant="ghost" size="icon-xs" aria-label={t("closeNotice")} onClick={() => setCreated(null)} className="-mr-1 -mt-1 size-4 rounded-none p-0 text-[#4c7253] hover:bg-transparent hover:text-[#25452b]"><X className="size-2.5" /></Button></aside> : null}{failed ? <aside role="alert" className="fixed top-13 right-4 z-50 flex w-46 items-start gap-2 rounded-sm border border-[#f0c6ca] bg-[#ffeaec] px-3 py-2 text-[#a4232d] shadow-sm"><CircleX aria-hidden="true" className="mt-0.5 size-3 shrink-0" /><div className="min-w-0 text-[8px]"><p className="font-semibold">{t("createErrorTitle", { kind: t(`${failed.kind}Name`) })}</p><p className="mt-0.5 leading-tight">{t("createErrorDescription", { value: failed.value, kind: t(`${failed.kind}NamePlural`) })}</p></div><Button type="button" variant="ghost" size="icon-xs" aria-label={t("closeNotice")} onClick={() => setFailed(null)} className="-mr-1 -mt-1 size-4 rounded-none p-0 text-[#a4232d] hover:bg-transparent hover:text-[#7c1420]"><X className="size-2.5" /></Button></aside> : null}</div>;
}