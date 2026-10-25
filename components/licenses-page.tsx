"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ChevronDown, ChevronLeft, ChevronRight, Eye, Pencil, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

type License = {
  id: string;
  spdxId: string;
  shortName: string;
  fullName: string;
  text: string;
  risk: number | null;
};

type LicensesResponse = {
  data: License[];
  pagination: { resourceCount: number; totalPages: number; page: number; limit: number };
};

type LicenseQuery = {
  page: number;
  limit: number;
  search: string;
  sortBy: "shortname" | "risk";
  sortOrder: "asc" | "desc";
  risk: string;
};

type SortOption = "nameAsc" | "nameDesc" | "risk";
type RiskLevel = 0 | 2 | 3 | 4 | 5;

async function getLicenses(query: LicenseQuery) {
  const parameters = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
    search: query.search,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });
  if (query.risk) parameters.set("risk", query.risk);
  const response = await fetch(`/api/licenses?${parameters}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load licenses");
  return response.json() as Promise<LicensesResponse>;
}

async function deleteLicense(id: string) {
  const response = await fetch(`/api/licenses/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Unable to delete license");
}

export function LicensesPage() {
  const t = useTranslations("LicensesPage");
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [sortOption, setSortOption] = useState<SortOption | null>(null);
  const [riskLevels, setRiskLevels] = useState<RiskLevel[]>([]);
  const [sortOpen, setSortOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [licenseToDelete, setLicenseToDelete] = useState<License | null>(null);
  const query = {
    page,
    limit,
    search: deferredSearch,
    sortBy: sortOption === "risk" ? "risk" : "shortname" as const,
    sortOrder: sortOption === "nameDesc" ? "desc" as const : "asc" as const,
    risk: riskLevels.join(","),
  };
  const licensesQuery = useQuery({
    queryKey: ["licenses", query],
    queryFn: () => getLicenses(query),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteLicense,
    onSuccess: async () => {
      setLicenseToDelete(null);
      await queryClient.invalidateQueries({ queryKey: ["licenses"] });
    },
  });
  const licenses = licensesQuery.data?.data ?? [];
  const pagination = licensesQuery.data?.pagination;
  const sortLabels: Record<SortOption, string> = { nameAsc: t("sortNameAsc"), nameDesc: t("sortNameDesc"), risk: t("sortRisk") };
  const riskOptions: { value: RiskLevel; label: string; className: string }[] = [
    { value: 5, label: t("riskRed"), className: "bg-[#df2d20] text-white" },
    { value: 2, label: t("riskGreen"), className: "bg-[#2f8a3f] text-white" },
    { value: 0, label: t("riskWhite"), className: "border border-[#ddd8df] bg-white text-[#3b333d]" },
    { value: 4, label: t("riskOrange"), className: "bg-[#f47b13] text-white" },
    { value: 3, label: t("riskYellow"), className: "bg-[#ffd331] text-[#352a00]" },
  ];

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
        <section className="relative mb-4 flex items-start gap-3">
          <div className="relative">
            <Button type="button" variant="outline" size="sm" onClick={() => { setSortOpen((open) => !open); setFiltersOpen(false); }} aria-expanded={sortOpen} aria-haspopup="menu" className="h-8 min-w-32 justify-between rounded-sm border-[#b454bd] bg-white px-2 text-[11px] font-medium text-[#5b1763] hover:bg-[#fcf6fd]"><span>{sortOption ? `${t("sortBy")}: ${sortLabels[sortOption]}` : t("sortBy")}</span><ChevronDown aria-hidden="true" className={`size-3 transition-transform ${sortOpen ? "rotate-180" : ""}`} /></Button>
            {sortOpen ? (
              <div role="menu" aria-label={t("sortBy")} className="absolute top-9 left-0 z-20 w-32 overflow-hidden rounded-sm border border-[#e3dbe5] bg-white py-1 text-[10px] shadow-md">
                {([
                  ["nameAsc", t("sortNameAsc")],
                  ["nameDesc", t("sortNameDesc")],
                  ["risk", t("sortRisk")],
                ] as const).map(([value, label]) => <button key={value} type="button" role="menuitemradio" aria-checked={sortOption === value} onClick={() => { setSortOption(value); setPage(1); setSortOpen(false); }} className={`block w-full px-2 py-1.5 text-left transition-colors hover:bg-[#f5dcf7] ${sortOption === value ? "bg-[#f2d5f5] text-[#63136d]" : "text-[#39323b]"}`}>{label}</button>)}
              </div>
            ) : null}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => { setFiltersOpen((open) => !open); setSortOpen(false); }} aria-expanded={filtersOpen} aria-haspopup="dialog" className="h-8 rounded-sm border-[#b454bd] bg-[#fbebfc] px-2 text-[11px] font-medium text-[#6d1678] hover:bg-[#f5dcf7]"><SlidersHorizontal aria-hidden="true" className="size-3" /> {t("filters")}</Button>
          {riskLevels.map((level) => { const option = riskOptions.find(({ value }) => value === level)!; return <button key={level} type="button" onClick={() => { setRiskLevels((current) => current.filter((value) => value !== level)); setPage(1); }} className="inline-flex h-5 items-center gap-1 rounded-sm bg-[#f2eff2] px-1.5 text-[10px] text-[#514b53] hover:bg-[#e9e3ea]">{option.label}<X aria-hidden="true" className="size-2.5 text-[#7b1a89]" /></button>; })}
          {riskLevels.length ? <button type="button" onClick={() => { setRiskLevels([]); setPage(1); }} className="h-5 text-[10px] font-medium text-[#7b1a89] hover:underline">{t("clearFilters")}</button> : null}
          {filtersOpen ? (
            <div role="dialog" aria-label={t("filters")} className="absolute top-9 left-35 z-20 w-48 rounded-sm border border-[#e3dbe5] bg-white p-3 shadow-md">
              <p className="mb-2 text-[11px] font-semibold text-[#332d35]"><ChevronDown aria-hidden="true" className="mr-1 inline size-3 -rotate-90 text-[#7b1a89]" />{t("riskLevel")}</p>
              <div className="grid gap-1.5">{riskOptions.map((option) => <label key={option.value} className="flex cursor-pointer items-center gap-2 text-[10px] text-[#403941]"><input type="checkbox" checked={riskLevels.includes(option.value)} onChange={() => { setRiskLevels((current) => current.includes(option.value) ? current.filter((value) => value !== option.value) : [...current, option.value]); setPage(1); }} className="size-3 rounded-sm border-[#a8a0aa] accent-[#8e168e]" /><span className={`rounded-sm px-2 py-1 text-[10px] font-medium ${option.className}`}>{option.label}</span></label>)}</div>
            </div>
          ) : null}
        </section>
        <section className="overflow-hidden rounded-md border border-[#e2dde3] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-xs">
              <thead className="bg-[#f0eef1] text-[#5e5661]">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">{t("spdxExpression")}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t("shortName")}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t("fullName")}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t("text")}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t("risk")}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeaf0]">
                {licensesQuery.isError ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-[#9c3b47]">{t("unavailable")}</td></tr>
                ) : licensesQuery.isLoading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-[#756b78]">{t("loading")}</td></tr>
                ) : licenses.length ? licenses.map((license) => (
                  <tr key={license.id || license.spdxId} className="text-[#3c3540]">
                    <td className="px-4 py-3 font-medium"><Link href={`/licenses/${license.id}`} className="text-[#3c3540] hover:text-[#7b1a89] hover:underline">{license.spdxId || "-"}</Link></td>
                    <td className="px-4 py-3"><Link href={`/licenses/${license.id}`} className="text-[#3c3540] hover:text-[#7b1a89] hover:underline">{license.shortName || "-"}</Link></td>
                    <td className="px-4 py-3">{license.fullName || "-"}</td>
                    <td className="max-w-80 truncate px-4 py-3" title={license.text}>{license.text || "-"}</td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-medium ${license.risk === 5 ? "bg-[#ef3340] text-white" : license.risk === 4 ? "bg-[#f0b429] text-[#3f2d00]" : license.risk === 3 ? "bg-[#dce98b] text-[#34420b]" : license.risk === 2 ? "bg-[#8fcf8a] text-[#183f1b]" : "bg-[#f0eef1] text-[#5e5661]"}`}>{license.risk ?? "-"}</span></td>
                    <td className="px-4 py-3"><div className="flex items-center gap-1 text-[#7b1a89]"><Button render={<Link href={`/licenses/${license.id}`} />} variant="ghost" size="icon-sm" aria-label={t("viewLicense")} title={t("viewLicense")}><Eye /></Button><Button render={<Link href={`/licenses/${license.id}/edit`} />} variant="ghost" size="icon-sm" aria-label={t("editLicense")} title={t("editLicense")}><Pencil /></Button><Button type="button" variant="ghost" size="icon-sm" onClick={() => setLicenseToDelete(license)} aria-label={t("deleteLicense")} title={t("deleteLicense")} className="hover:bg-[#fbe8eb] hover:text-[#b42332]"><Trash2 /></Button></div></td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-[#756b78]">{t("noLicenses")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eeeaf0] px-4 py-3 text-xs text-[#756b78]">
            <span>{t("showing", { from: licenses.length ? (page - 1) * limit + 1 : 0, to: (page - 1) * limit + licenses.length, total: pagination?.resourceCount ?? 0 })}</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon-sm" type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} aria-label={t("previousPage")}><ChevronLeft /></Button>
              <span>{page} / {pagination?.totalPages ?? 1}</span>
              <Button variant="ghost" size="icon-sm" type="button" disabled={page >= (pagination?.totalPages ?? 1)} onClick={() => setPage((current) => current + 1)} aria-label={t("nextPage")}><ChevronRight /></Button>
              <label className="ml-2 flex items-center gap-2"><span>{t("rowsPerPage")}</span><select value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }} className="h-7 rounded border border-[#d9d4db] bg-white px-1"><option value="15">15</option><option value="30">30</option></select></label>
            </div>
          </footer>
        </section>
      </div>
      {licenseToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="delete-license-title" className="w-full max-w-md rounded-sm bg-white p-5 shadow-xl">
            <header className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2"><span className="flex size-6 items-center justify-center bg-[#fff1dc] text-[#ed8b00]"><AlertTriangle aria-hidden="true" className="size-4" /></span><h2 id="delete-license-title" className="text-sm font-semibold text-[#322b33]">{t("deleteTitle")}</h2></div>
              <Button type="button" variant="ghost" size="icon-xs" onClick={() => { if (!deleteMutation.isPending) setLicenseToDelete(null); }} aria-label={t("closeDeleteDialog")} className="text-[#7b1a89]"><X /></Button>
            </header>
            <p className="mt-4 text-xs leading-5 text-[#3f3840]">{t("deleteConfirm", { name: licenseToDelete.shortName || licenseToDelete.fullName })}</p>
            <p className="text-xs leading-5 text-[#3f3840]">{t("deleteWarning")}</p>
            {deleteMutation.isError ? <p role="alert" className="mt-3 text-xs text-[#b42332]">{t("deleteError")}</p> : null}
            <footer className="mt-4 flex justify-end gap-2"><Button type="button" variant="outline" size="sm" onClick={() => setLicenseToDelete(null)} disabled={deleteMutation.isPending} className="rounded-sm border-[#b454bd] text-[#7b1a89] hover:bg-[#fcf6fd]">{t("cancel")}</Button><Button type="button" variant="destructive" size="sm" onClick={() => deleteMutation.mutate(licenseToDelete.id)} disabled={deleteMutation.isPending} className="rounded-sm bg-[#d7242c] text-white hover:bg-[#b91d25]">{deleteMutation.isPending ? t("deleting") : t("delete")}</Button></footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}