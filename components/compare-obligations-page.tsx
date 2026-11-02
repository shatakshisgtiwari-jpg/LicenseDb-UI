"use client";

import { FileCheck2, Search, X } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type Obligation = { id: string; topic: string; type: string; text: string; classification: string; category: string; comment: string; active: boolean; textUpdatable: boolean; licenseIds: string[] };

async function getObligations() {
  const response = await fetch("/api/obligations?limit=100", { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load obligations");
  return (await response.json() as { data: Obligation[] }).data;
}

async function getObligation(id: string) {
  const response = await fetch(`/api/obligations/${id}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load obligation");
  return (await response.json() as { data: Obligation }).data;
}

function ObligationSelector({ obligation, onSelect }: { obligation: Obligation | null; onSelect: () => void }) {
  const t = useTranslations("CompareObligations");
  return <section className="flex min-h-32 flex-1 flex-col items-center justify-center border border-dashed border-[#e2dfe3] bg-[#fafafa] px-4 py-4 text-center"><FileCheck2 aria-hidden="true" className="mb-2 size-6 text-[#6e696f]" />{obligation ? <p className="mb-2 max-w-full truncate text-xs font-medium text-[#302b31]">{obligation.topic}</p> : <p className="mb-2 text-[10px] text-[#302b31]">{t("selectObligation")}</p>}<Button type="button" size="sm" onClick={onSelect} className="rounded-sm bg-[#7b1a89] px-3 text-[10px] hover:bg-[#671473]">{obligation ? t("changeObligation") : t("addToCompare")}</Button></section>;
}

function ObligationPicker({ obligations, onClose, onChoose }: { obligations: Obligation[]; onClose: () => void; onChoose: (obligation: Obligation) => void }) {
  const t = useTranslations("CompareObligations");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const filtered = obligations.filter((obligation) => `${obligation.topic} ${obligation.type} ${obligation.text} ${obligation.id}`.toLowerCase().includes(search.trim().toLowerCase()));
  const selected = obligations.find((obligation) => obligation.id === selectedId) ?? null;
  return <div role="dialog" aria-modal="true" aria-labelledby="obligation-picker-title" className="fixed inset-0 z-50 grid place-items-center bg-[#1d1520]/75 p-4"><form onSubmit={(event) => { event.preventDefault(); if (selected) onChoose(selected); }} className="w-full max-w-[22.25rem] rounded-sm border border-[#ddd7de] bg-white p-4 shadow-xl"><header className="flex items-center justify-between"><h2 id="obligation-picker-title" className="text-[11px] font-semibold text-[#252126]">{t("searchTitle")}</h2><Button type="button" variant="ghost" size="icon-xs" onClick={onClose} aria-label={t("closePicker")} className="-mr-1 text-[#7b1a89]"><X /></Button></header><label className="relative mt-2 block"><span className="sr-only">{t("search")}</span><Search aria-hidden="true" className="absolute top-1/2 left-2 size-3 -translate-y-1/2 text-[#78727a]" /><input autoFocus type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("searchPlaceholder")} className="h-6 w-full rounded-sm border border-[#bcb7bd] bg-white pr-2 pl-6 text-[9px] outline-none focus:border-[#7b1a89]" /></label><fieldset className="mt-2 h-44 overflow-y-auto border border-[#e4e1e5] px-2 py-1.5"><legend className="sr-only">{t("searchTitle")}</legend>{filtered.length ? filtered.map((obligation) => { const inputId = `compare-obligation-${obligation.id}`; return <label key={obligation.id} htmlFor={inputId} className="flex cursor-pointer items-center gap-1.5 py-1 text-[9px] text-[#302b31] hover:text-[#7b1a89]"><input id={inputId} type="checkbox" checked={selectedId === obligation.id} onChange={() => setSelectedId((current) => current === obligation.id ? null : obligation.id)} className="size-3 rounded-sm border-[#aaa5ac] accent-[#7b1a89]" /><span className="truncate">{obligation.topic || obligation.type}</span></label>; }) : <p className="py-4 text-center text-[9px] text-[#716a74]">{obligations.length ? t("noSearchResults") : t("noObligations")}</p>}</fieldset><footer className="mt-3 flex justify-end gap-2"><Button type="button" variant="outline" size="sm" onClick={onClose} className="h-6 rounded-sm border-[#bc83c2] px-2 text-[9px] text-[#7b1a89]">{t("cancel")}</Button><Button type="submit" size="sm" disabled={!selected} className="h-6 rounded-sm bg-[#7b1a89] px-2 text-[9px] hover:bg-[#671473]">{t("addToCompare")}</Button></footer></form></div>;
}

function Field({ label, value }: { label: string; value: string | boolean | undefined }) {
  return <div className="grid gap-1"><dt className="text-[8px] leading-none text-[#5e5861]">{label}</dt><dd className="min-h-3 text-[9px] leading-tight text-[#29242b]">{typeof value === "boolean" ? String(value) : value || "-"}</dd></div>;
}

function ObligationSheet({ obligation, divider }: { obligation: Obligation; divider: boolean }) {
  const t = useTranslations("CompareObligations");
  const status = [[t("textUpdatable"), obligation.textUpdatable], [t("active"), obligation.active]].filter(([, enabled]) => enabled);
  const classificationClass = obligation.classification.toUpperCase() === "GREEN" ? "bg-[#dff2d9] text-[#23672e]" : obligation.classification.toUpperCase() === "YELLOW" ? "bg-[#fff0b8] text-[#6d5200]" : obligation.classification.toUpperCase() === "ORANGE" ? "bg-[#ffe1c1] text-[#9a4700]" : obligation.classification.toUpperCase() === "RED" ? "bg-[#f9d9dc] text-[#a4232d]" : "bg-[#eeeeef] text-[#373139]";
  return <article className={`min-w-0 px-4 py-1 ${divider ? "border-l border-[#e2dfe3]" : ""}`}><dl className="grid gap-y-3"><Field label={t("topic")} value={obligation.topic} /><div className="grid grid-cols-2 gap-3"><div className="grid gap-1"><dt className="text-[8px] leading-none text-[#5e5861]">{t("classification")}</dt><dd><span className={`rounded-sm px-1 py-0.5 text-[8px] ${classificationClass}`}>{obligation.classification || "-"}</span></dd></div><Field label={t("category")} value={obligation.category} /></div><Field label={t("type")} value={obligation.type} /><Field label={t("associatedLicenses")} value={obligation.licenseIds.join(", ") || t("notAvailable")} /><div className="grid gap-1"><dt className="text-[8px] leading-none text-[#5e5861]">{t("status")}</dt><dd className="flex min-h-3 flex-wrap gap-1">{status.length ? status.map(([label]) => <span key={String(label)} className="rounded-sm bg-[#eeeeef] px-1 py-0.5 text-[8px]">{label}</span>) : t("notAvailable")}</dd></div><Field label={t("comments")} value={obligation.comment || t("notAvailable")} /><Field label={t("scpId")} value={t("notAvailable")} /></dl></article>;
}

export function CompareObligationsPage() {
  const t = useTranslations("CompareObligations");
  const searchParams = useSearchParams();
  const [openSlot, setOpenSlot] = useState<1 | 2 | null>(null);
  const [first, setFirst] = useState<Obligation | null>(null);
  const [second, setSecond] = useState<Obligation | null>(null);
  const obligationsQuery = useQuery({ queryKey: ["obligations", "compare"], queryFn: getObligations });
  const queryFirst = obligationsQuery.data?.find((obligation) => obligation.id === searchParams.get("first")) ?? null;
  const selectedFirst = first ?? queryFirst;
  const firstDetail = useQuery({ queryKey: ["obligation", selectedFirst?.id, "compare"], queryFn: () => getObligation(selectedFirst!.id), enabled: Boolean(selectedFirst?.id) });
  const secondDetail = useQuery({ queryKey: ["obligation", second?.id, "compare"], queryFn: () => getObligation(second!.id), enabled: Boolean(second?.id) });
  const firstObligation = firstDetail.data ?? selectedFirst;
  const secondObligation = secondDetail.data ?? second;
  const hasSelection = Boolean(firstObligation || secondObligation);
  function choose(obligation: Obligation) { if (openSlot === 1) setFirst(obligation); if (openSlot === 2) setSecond(obligation); setOpenSlot(null); }

  return <div className="min-h-svh bg-white text-[#242026]"><header className="flex h-12 items-center border-b border-[#e2dfe3] px-4"><h1 className="text-base font-semibold">{t("title")}</h1></header><main className="p-4"><section className={`grid max-w-3xl md:grid-cols-2 ${hasSelection ? "" : "gap-5"}`}>{firstObligation ? <ObligationSheet obligation={firstObligation} divider={false} /> : <div className={secondObligation ? "pr-3" : ""}><ObligationSelector obligation={null} onSelect={() => setOpenSlot(1)} /></div>}{secondObligation ? <ObligationSheet obligation={secondObligation} divider /> : <div className={firstObligation ? "border-l border-[#e2dfe3] pl-3" : ""}><ObligationSelector obligation={null} onSelect={() => setOpenSlot(2)} /></div>}</section>{obligationsQuery.isError ? <p className="mt-3 text-xs text-[#9c3b47]">{t("unavailable")}</p> : null}</main>{openSlot ? <ObligationPicker obligations={obligationsQuery.data ?? []} onClose={() => setOpenSlot(null)} onChoose={choose} /> : null}</div>;
}