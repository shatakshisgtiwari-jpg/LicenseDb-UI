"use client";

import { AlertTriangle, ChevronDown, ChevronLeft, ChevronRight, Pencil, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type Obligation = {
  id: string;
  topic: string;
  type: string;
  text: string;
  classification: string;
  category: string;
};

type ObligationsResponse = {
  data: Obligation[];
  pagination: { resourceCount: number; totalPages: number; page: number; limit: number };
};

async function getObligations(query: { page: number; limit: number; search: string; orderBy: "asc" | "desc" }) {
  const parameters = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
    search: query.search,
    orderBy: query.orderBy,
  });
  const response = await fetch(`/api/obligations?${parameters}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load obligations");
  return response.json() as Promise<ObligationsResponse>;
}

async function deleteObligation(id: string) {
  const response = await fetch(`/api/obligations/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Unable to delete obligation");
}

function classificationClass(classification: string) {
  switch (classification.toUpperCase()) {
    case "GREEN": return "bg-[#dff2d9] text-[#23672e]";
    case "YELLOW": return "bg-[#fff0b8] text-[#6d5200]";
    case "ORANGE": return "bg-[#ffe1c1] text-[#9a4700]";
    case "RED": return "bg-[#f9d9dc] text-[#a4232d]";
    default: return "bg-[#eeeaf0] text-[#5e5661]";
  }
}

export function ObligationsPage() {
  const t = useTranslations("ObligationsPage");
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [orderBy, setOrderBy] = useState<"asc" | "desc">("asc");
  const [sortOpen, setSortOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [types, setTypes] = useState<string[]>([]);
  const [classifications, setClassifications] = useState<string[]>([]);
  const [obligationToDelete, setObligationToDelete] = useState<Obligation | null>(null);
  const obligationsQuery = useQuery({
    queryKey: ["obligations", page, limit, deferredSearch, orderBy],
    queryFn: () => getObligations({ page, limit, search: deferredSearch, orderBy }),
  });
  const obligations = obligationsQuery.data?.data ?? [];
  const availableTypes = [...new Set(obligations.map((obligation) => obligation.type).filter(Boolean))];
  const availableClassifications = [...new Set(obligations.map((obligation) => obligation.classification).filter(Boolean))];
  const filteredObligations = obligations.filter((obligation) =>
    (!types.length || types.includes(obligation.type)) &&
    (!classifications.length || classifications.includes(obligation.classification)),
  );
  const pagination = obligationsQuery.data?.pagination;
  const deleteMutation = useMutation({
    mutationFn: deleteObligation,
    onSuccess: async () => {
      setObligationToDelete(null);
      await queryClient.invalidateQueries({ queryKey: ["obligations"] });
    },
  });

  return (
    <div className="min-h-svh bg-[#f7f7f8] text-[#26212a]">
      <header className="flex min-h-16 items-center justify-between gap-4 border-b border-[#e5e1e6] bg-white px-5 py-3 sm:px-8">
        <h1 className="text-xl font-semibold text-[#221b25]">{t("title")}</h1>
        <label className="relative block w-full max-w-56">
          <span className="sr-only">{t("search")}</span>
          <Search aria-hidden="true" className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[#847b86]" />
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} type="search" placeholder={t("search")} className="h-8 w-full rounded border border-[#d9d4db] bg-white pr-3 pl-8 text-xs text-[#27212b] outline-none placeholder:text-[#a29aa4] focus:border-[#7b1a89] focus:ring-2 focus:ring-[#7b1a89]/15" />
        </label>
      </header>

      <div className="mx-auto w-full max-w-7xl p-5 sm:p-8">
        <section className="relative mb-4 flex flex-wrap items-start gap-3">
          <div className="relative">
            <Button type="button" variant="outline" size="sm" onClick={() => { setSortOpen((open) => !open); setFiltersOpen(false); }} aria-expanded={sortOpen} aria-haspopup="menu" className="h-8 min-w-32 justify-between rounded-sm border-[#b454bd] bg-white px-2 text-[11px] font-medium text-[#5b1763] hover:bg-[#fcf6fd]"><span>{t("sortBy")}</span><ChevronDown aria-hidden="true" className={`size-3 transition-transform ${sortOpen ? "rotate-180" : ""}`} /></Button>
            {sortOpen ? <div role="menu" aria-label={t("sortBy")} className="absolute top-9 left-0 z-20 w-32 overflow-hidden rounded-sm border border-[#e3dbe5] bg-white py-1 text-[10px] shadow-md">
              <button type="button" role="menuitemradio" aria-checked={orderBy === "asc"} onClick={() => { setOrderBy("asc"); setPage(1); setSortOpen(false); }} className={`block w-full px-2 py-1.5 text-left hover:bg-[#f5dcf7] ${orderBy === "asc" ? "bg-[#f2d5f5] text-[#63136d]" : "text-[#39323b]"}`}>{t("sortAscending")}</button>
              <button type="button" role="menuitemradio" aria-checked={orderBy === "desc"} onClick={() => { setOrderBy("desc"); setPage(1); setSortOpen(false); }} className={`block w-full px-2 py-1.5 text-left hover:bg-[#f5dcf7] ${orderBy === "desc" ? "bg-[#f2d5f5] text-[#63136d]" : "text-[#39323b]"}`}>{t("sortDescending")}</button>
            </div> : null}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => { setFiltersOpen((open) => !open); setSortOpen(false); }} aria-expanded={filtersOpen} aria-haspopup="dialog" className="h-8 rounded-sm border-[#b454bd] bg-[#fbebfc] px-2 text-[11px] font-medium text-[#6d1678] hover:bg-[#f5dcf7]"><SlidersHorizontal aria-hidden="true" className="size-3" /> {t("filters")}</Button>
          {[...types, ...classifications].map((filter) => <button key={filter} type="button" onClick={() => { setTypes((current) => current.filter((value) => value !== filter)); setClassifications((current) => current.filter((value) => value !== filter)); }} className="inline-flex h-5 items-center gap-1 rounded-sm bg-[#f2eff2] px-1.5 text-[10px] text-[#514b53] hover:bg-[#e9e3ea]">{filter}<X aria-hidden="true" className="size-2.5 text-[#7b1a89]" /></button>)}
          {(types.length || classifications.length) ? <button type="button" onClick={() => { setTypes([]); setClassifications([]); }} className="h-5 text-[10px] font-medium text-[#7b1a89] hover:underline">{t("clearFilters")}</button> : null}
          {filtersOpen ? <div role="dialog" aria-label={t("filters")} className="absolute top-9 left-35 z-20 grid w-56 gap-4 rounded-sm border border-[#e3dbe5] bg-white p-3 shadow-md">
            <FilterGroup label={t("type")} options={availableTypes} selected={types} onChange={setTypes} />
            <FilterGroup label={t("classification")} options={availableClassifications} selected={classifications} onChange={setClassifications} />
          </div> : null}
        </section>
        <section className="overflow-hidden rounded-md border border-[#e2dde3] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-xs">
              <thead className="bg-[#f0eef1] text-[#5e5661]"><tr><th scope="col" className="px-4 py-3 font-medium">{t("obligation")}</th><th scope="col" className="px-4 py-3 font-medium">{t("type")}</th><th scope="col" className="px-4 py-3 font-medium">{t("fullText")}</th><th scope="col" className="px-4 py-3 font-medium">{t("classification")}</th><th scope="col" className="px-4 py-3 font-medium">{t("actions")}</th></tr></thead>
              <tbody className="divide-y divide-[#eeeaf0]">
                {obligationsQuery.isError ? <tr><td colSpan={5} className="px-4 py-8 text-center text-[#9c3b47]">{t("unavailable")}</td></tr> : obligationsQuery.isLoading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-[#756b78]">{t("loading")}</td></tr> : filteredObligations.length ? filteredObligations.map((obligation) => <tr key={obligation.id} className="text-[#3c3540]"><td className="px-4 py-3 font-medium"><Link href={`/obligations/${obligation.id}`} className="text-[#6c1975] hover:underline">{obligation.topic || "-"}</Link></td><td className="px-4 py-3">{obligation.type || "-"}</td><td className="max-w-112 truncate px-4 py-3" title={obligation.text}>{obligation.text || "-"}</td><td className="px-4 py-3"><span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-medium ${classificationClass(obligation.classification)}`}>{obligation.classification || "-"}</span></td><td className="px-4 py-3"><div className="flex items-center gap-1 text-[#7b1a89]"><Button render={<Link href={`/obligations/${obligation.id}/edit`} />} variant="ghost" size="icon-sm" aria-label={t("editObligation")} title={t("editObligation")}><Pencil /></Button><Button type="button" variant="ghost" size="icon-sm" onClick={() => setObligationToDelete(obligation)} aria-label={t("deleteObligation")} title={t("deleteObligation")} className="hover:bg-[#fbe8eb] hover:text-[#b42332]"><Trash2 /></Button></div></td></tr>) : <tr><td colSpan={5} className="px-4 py-8 text-center text-[#756b78]">{t("noObligations")}</td></tr>}
              </tbody>
            </table>
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eeeaf0] px-4 py-3 text-xs text-[#756b78]">
            <span>{t("showing", { from: obligations.length ? (page - 1) * limit + 1 : 0, to: (page - 1) * limit + obligations.length, total: pagination?.resourceCount ?? 0 })}</span>
            <div className="flex items-center gap-2"><Button variant="ghost" size="icon-sm" type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} aria-label={t("previousPage")}><ChevronLeft /></Button><span>{page} / {pagination?.totalPages ?? 1}</span><Button variant="ghost" size="icon-sm" type="button" disabled={page >= (pagination?.totalPages ?? 1)} onClick={() => setPage((current) => current + 1)} aria-label={t("nextPage")}><ChevronRight /></Button><label className="ml-2 flex items-center gap-2"><span>{t("rowsPerPage")}</span><select value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }} className="h-7 rounded border border-[#d9d4db] bg-white px-1"><option value="15">15</option><option value="30">30</option></select></label></div>
          </footer>
        </section>
      </div>
      {obligationToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="delete-obligation-title" className="w-full max-w-md rounded-sm bg-white p-5 shadow-xl">
            <header className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2"><span className="flex size-6 items-center justify-center bg-[#fff1dc] text-[#ed8b00]"><AlertTriangle aria-hidden="true" className="size-4" /></span><h2 id="delete-obligation-title" className="text-sm font-semibold text-[#322b33]">{t("deleteTitle")}</h2></div>
              <Button type="button" variant="ghost" size="icon-xs" onClick={() => { if (!deleteMutation.isPending) setObligationToDelete(null); }} aria-label={t("closeDialog")} className="text-[#7b1a89]"><X /></Button>
            </header>
            <p className="mt-4 text-xs leading-5 text-[#3f3840]">{t("deleteConfirm", { name: obligationToDelete.topic })}</p>
            {deleteMutation.isError ? <p role="alert" className="mt-3 text-xs text-[#b42332]">{t("deleteError")}</p> : null}
            <footer className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setObligationToDelete(null)} disabled={deleteMutation.isPending} className="rounded-sm border-[#b454bd] text-[#7b1a89] hover:bg-[#fcf6fd]">{t("cancel")}</Button>
              <Button type="button" variant="destructive" size="sm" onClick={() => deleteMutation.mutate(obligationToDelete.id)} disabled={deleteMutation.isPending} className="rounded-sm bg-[#d7242c] text-white hover:bg-[#b91d25]">{deleteMutation.isPending ? t("deleting") : t("delete")}</Button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function FilterGroup({ label, options, selected, onChange }: { label: string; options: string[]; selected: string[]; onChange: (selected: string[]) => void }) {
  return <div><p className="mb-2 text-[11px] font-semibold text-[#332d35]">{label}</p><div className="grid gap-1.5">{options.length ? options.map((option) => <label key={option} className="flex cursor-pointer items-center gap-2 text-[10px] text-[#403941]"><input type="checkbox" checked={selected.includes(option)} onChange={() => onChange(selected.includes(option) ? selected.filter((value) => value !== option) : [...selected, option])} className="size-3 rounded-sm border-[#a8a0aa] accent-[#8e168e]" />{option}</label>) : <span className="text-[10px] text-[#756b78]">-</span>}</div></div>;
}