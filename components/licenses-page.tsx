"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { useTranslations } from "next-intl";
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
  sortBy: "spdx_id" | "shortname" | "fullname";
  osiApproved: "" | "true" | "false";
  copyleft: "" | "true" | "false";
};

async function getLicenses(query: LicenseQuery) {
  const parameters = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
    search: query.search,
    sortBy: query.sortBy,
  });
  if (query.osiApproved) parameters.set("osiApproved", query.osiApproved);
  if (query.copyleft) parameters.set("copyleft", query.copyleft);
  const response = await fetch(`/api/licenses?${parameters}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load licenses");
  return response.json() as Promise<LicensesResponse>;
}

export function LicensesPage() {
  const t = useTranslations("LicensesPage");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [sortBy, setSortBy] = useState<LicenseQuery["sortBy"]>("shortname");
  const [osiApproved, setOsiApproved] = useState<LicenseQuery["osiApproved"]>("");
  const [copyleft, setCopyleft] = useState<LicenseQuery["copyleft"]>("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const query = { page, limit, search: deferredSearch, sortBy, osiApproved, copyleft };
  const licensesQuery = useQuery({
    queryKey: ["licenses", query],
    queryFn: () => getLicenses(query),
  });
  const licenses = licensesQuery.data?.data ?? [];
  const pagination = licensesQuery.data?.pagination;

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
        <section className="relative mb-4 flex items-center gap-3">
          <label>
            <span className="sr-only">{t("sortBy")}</span>
            <select value={sortBy} onChange={(event) => { setSortBy(event.target.value as LicenseQuery["sortBy"]); setPage(1); }} className="h-8 min-w-28 rounded border border-[#d9d4db] bg-white px-2 text-xs text-[#5e5661] outline-none focus:border-[#7b1a89] focus:ring-2 focus:ring-[#7b1a89]/15"><option value="shortname">{t("sortBy")}</option><option value="spdx_id">{t("spdxExpression")}</option><option value="fullname">{t("fullName")}</option></select>
          </label>
          <Button type="button" variant="outline" size="sm" onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen} className="border-[#c69ccc] text-[#6d1678]"><SlidersHorizontal aria-hidden="true" /> {t("filters")}</Button>
          {filtersOpen ? (
            <div className="absolute top-10 left-0 z-10 flex flex-wrap gap-3 rounded-md border border-[#e2dde3] bg-white p-3 shadow-lg">
              <label className="grid gap-1 text-xs text-[#5e5661]"><span>{t("osiApproved")}</span><select value={osiApproved} onChange={(event) => { setOsiApproved(event.target.value as LicenseQuery["osiApproved"]); setPage(1); }} className="h-8 rounded border border-[#d9d4db] bg-white px-2"><option value="">{t("all")}</option><option value="true">{t("yes")}</option><option value="false">{t("no")}</option></select></label>
              <label className="grid gap-1 text-xs text-[#5e5661]"><span>{t("copyleft")}</span><select value={copyleft} onChange={(event) => { setCopyleft(event.target.value as LicenseQuery["copyleft"]); setPage(1); }} className="h-8 rounded border border-[#d9d4db] bg-white px-2"><option value="">{t("all")}</option><option value="true">{t("yes")}</option><option value="false">{t("no")}</option></select></label>
            </div>
          ) : null}
        </section>
        <section className="overflow-hidden rounded-md border border-[#e2dde3] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="bg-[#f0eef1] text-[#5e5661]">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">{t("spdxExpression")}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t("shortName")}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t("fullName")}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t("text")}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t("risk")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeaf0]">
                {licensesQuery.isError ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[#9c3b47]">{t("unavailable")}</td></tr>
                ) : licensesQuery.isLoading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[#756b78]">{t("loading")}</td></tr>
                ) : licenses.length ? licenses.map((license) => (
                  <tr key={license.id || license.spdxId} className="text-[#3c3540]">
                    <td className="px-4 py-3 font-medium">{license.spdxId || "-"}</td>
                    <td className="px-4 py-3">{license.shortName || "-"}</td>
                    <td className="px-4 py-3">{license.fullName || "-"}</td>
                    <td className="max-w-80 truncate px-4 py-3" title={license.text}>{license.text || "-"}</td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-medium ${license.risk === 5 ? "bg-[#ef3340] text-white" : license.risk === 4 ? "bg-[#f0b429] text-[#3f2d00]" : license.risk === 3 ? "bg-[#dce98b] text-[#34420b]" : license.risk === 2 ? "bg-[#8fcf8a] text-[#183f1b]" : "bg-[#f0eef1] text-[#5e5661]"}`}>{license.risk ?? "-"}</span></td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[#756b78]">{t("noLicenses")}</td></tr>
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
    </div>
  );
}