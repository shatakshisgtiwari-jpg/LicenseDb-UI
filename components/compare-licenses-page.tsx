"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, Search, X } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type License = {
  id: string;
  spdxId: string;
  shortName: string;
  fullName: string;
  text: string;
  risk: number | null;
    url?: string;
    notes?: string;
    source?: string;
    copyleft?: boolean;
    osiApproved?: boolean;
    textUpdatable?: boolean;
    active?: boolean;
};

async function getLicenses() {
  const response = await fetch("/api/licenses?limit=100", { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load licenses");
  return (await response.json() as { data: License[] }).data;
}

async function getLicenseDetail(id: string) {
  const response = await fetch(`/api/licenses/${id}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load license");
  return (await response.json() as { data: License }).data;
}

function LicenseSelector({ license, onSelect }: { license: License | null; onSelect: () => void }) {
  const t = useTranslations("CompareLicenses");
  return (
    <section className="flex min-h-24 flex-1 flex-col items-center justify-center border border-dashed border-[#e2dfe3] bg-[#fafafa] px-4 py-3 text-center">
      <FileText aria-hidden="true" className="mb-2 size-6 text-[#6e696f]" />
      {license ? <p className="mb-2 max-w-full truncate text-xs font-medium text-[#302b31]">{license.shortName || license.fullName || license.spdxId}</p> : <p className="mb-2 text-[10px] text-[#302b31]">{t("selectLicense")}</p>}
      <Button type="button" size="sm" onClick={onSelect} className="rounded-sm bg-[#7b1a89] px-3 text-[10px] hover:bg-[#671473]">{license ? t("changeLicense") : t("addToCompare")}</Button>
    </section>
  );
}

function LicensePicker({ licenses, onClose, onChoose }: { licenses: License[]; onClose: () => void; onChoose: (license: License) => void }) {
  const t = useTranslations("CompareLicenses");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const filteredLicenses = licenses.filter((license) => `${license.shortName} ${license.fullName} ${license.spdxId} ${license.id}`.toLowerCase().includes(search.trim().toLowerCase()));
  const selectedLicense = licenses.find((license) => license.id === selectedId) ?? null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="license-picker-title" className="fixed inset-0 z-50 grid place-items-center bg-[#1d1520]/75 p-4">
      <form onSubmit={(event) => { event.preventDefault(); if (selectedLicense) onChoose(selectedLicense); }} className="w-full max-w-[19.75rem] rounded-sm border border-[#ddd7de] bg-white p-3.5 shadow-xl">
        <header className="flex items-center justify-between"><h2 id="license-picker-title" className="text-[10px] font-semibold text-[#252126]">{t("searchTitle")}</h2><Button type="button" variant="ghost" size="icon-xs" onClick={onClose} aria-label={t("closePicker")} className="-mr-1 text-[#7b1a89] hover:bg-[#f8eff9] hover:text-[#671473]"><X /></Button></header>
        <label className="relative mt-2 block"><span className="sr-only">{t("search")}</span><Search aria-hidden="true" className="absolute top-1/2 left-2 size-3 -translate-y-1/2 text-[#78727a]" /><input autoFocus type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("searchPlaceholder")} className="h-5 w-full rounded-sm border border-[#bcb7bd] bg-white pr-2 pl-6 text-[8px] outline-none placeholder:text-[#8a858b] focus:border-[#7b1a89] focus:ring-1 focus:ring-[#7b1a89]/25" /></label>
        <fieldset className="mt-2 h-56 overflow-y-auto border border-[#e4e1e5] px-2 py-1.5">
          <legend className="sr-only">{t("searchTitle")}</legend>
          {filteredLicenses.length ? filteredLicenses.map((license) => {
            const id = `compare-license-${license.id}`;
            return <label key={license.id || license.spdxId} htmlFor={id} className="flex cursor-pointer items-center gap-1.5 py-1 text-[8px] text-[#302b31] hover:text-[#7b1a89]"><input id={id} type="checkbox" checked={selectedId === license.id} onChange={() => setSelectedId((current) => current === license.id ? null : license.id)} className="size-3 rounded-sm border-[#aaa5ac] accent-[#7b1a89]" /><span className="truncate">{license.shortName || license.fullName || license.spdxId}</span></label>;
          }) : <p className="py-4 text-center text-[9px] text-[#716a74]">{licenses.length ? t("noSearchResults") : t("noLicenses")}</p>}
        </fieldset>
        <footer className="mt-3 flex justify-end gap-2"><Button type="button" variant="outline" size="sm" onClick={onClose} className="h-5 rounded-sm border-[#bc83c2] px-2 text-[8px] text-[#7b1a89] hover:bg-[#faf1fb] hover:text-[#671473]">{t("cancel")}</Button><Button type="submit" size="sm" disabled={!selectedLicense} className="h-5 rounded-sm bg-[#7b1a89] px-2 text-[8px] hover:bg-[#671473]">{t("addToCompare")}</Button></footer>
      </form>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string | number | null | undefined }) {
  return <div className="grid gap-1"><dt className="text-[8px] leading-none text-[#5e5861]">{label}</dt><dd className="min-h-3 text-[9px] leading-tight text-[#29242b]">{value === null || value === undefined || value === "" ? "-" : value}</dd></div>;
}

function LicenseDetailSheet({ license, divider }: { license: License; divider: boolean }) {
  const t = useTranslations("CompareLicenses");
  const status = [[t("active"), license.active], [t("copyleft"), license.copyleft], [t("osiApproved"), license.osiApproved]].filter(([, enabled]) => enabled);
  const types = license.textUpdatable ? [t("textUpdatable")] : [];

  return (
    <article className={`min-w-0 px-4 py-1 ${divider ? "border-l border-[#e2dfe3]" : ""}`}>
      <h2 className="mb-3 text-sm font-semibold text-[#29242b]">{license.shortName || license.fullName || license.spdxId}</h2>
      <dl className="grid gap-y-3">
        <div className="grid grid-cols-2 gap-3"><DetailField label={t("shortName")} value={license.shortName} /><DetailField label={t("spdxExpression")} value={license.spdxId} /></div>
        <DetailField label={t("fullName")} value={license.fullName} />
        <DetailField label={t("url")} value={license.url} />
        <div className="grid gap-1"><dt className="text-[8px] leading-none text-[#5e5861]">{t("licenseStatus")}</dt><dd className="flex min-h-3 flex-wrap gap-1">{status.length ? status.map(([label]) => <span key={String(label)} className="rounded-sm bg-[#eeeeef] px-1 py-0.5 text-[8px] leading-none text-[#373139]">{label}</span>) : <span className="text-[9px]">-</span>}</dd></div>
        <DetailField label={t("risk")} value={license.risk} />
        <DetailField label={t("obligations")} value={license.notes || t("notAvailable")} />
        <div className="grid gap-1"><dt className="text-[8px] leading-none text-[#5e5861]">{t("licenseTypes")}</dt><dd className="flex min-h-3 flex-wrap gap-1">{types.length ? types.map((type) => <span key={type} className="rounded-sm bg-[#eeeeef] px-1 py-0.5 text-[8px] leading-none text-[#373139]">{type}</span>) : <span className="text-[9px]">{t("notAvailable")}</span>}</dd></div>
      </dl>
    </article>
  );
}

export function CompareLicensesPage() {
  const t = useTranslations("CompareLicenses");
  const searchParams = useSearchParams();
  const [openSlot, setOpenSlot] = useState<1 | 2 | null>(null);
  const [firstLicense, setFirstLicense] = useState<License | null>(null);
  const [secondLicense, setSecondLicense] = useState<License | null>(null);
  const licensesQuery = useQuery({ queryKey: ["licenses", "compare"], queryFn: getLicenses });
  const queryFirstLicense = licensesQuery.data?.find((license) => license.id === searchParams.get("first")) ?? null;
  const selectedFirstLicense = firstLicense ?? queryFirstLicense;
  const firstDetailQuery = useQuery({ queryKey: ["license", selectedFirstLicense?.id, "compare"], queryFn: () => getLicenseDetail(selectedFirstLicense!.id), enabled: Boolean(selectedFirstLicense?.id) });
  const secondDetailQuery = useQuery({ queryKey: ["license", secondLicense?.id, "compare"], queryFn: () => getLicenseDetail(secondLicense!.id), enabled: Boolean(secondLicense?.id) });
  const firstDetail = firstDetailQuery.data ?? selectedFirstLicense;
  const secondDetail = secondDetailQuery.data ?? secondLicense;
  const hasSelectedLicense = Boolean(firstDetail || secondDetail);

  function chooseLicense(license: License) {
    if (openSlot === 1) setFirstLicense(license);
    if (openSlot === 2) setSecondLicense(license);
    setOpenSlot(null);
  }

  return (
    <div className="min-h-svh bg-white text-[#242026]">
      <header className="flex h-12 items-center border-b border-[#e2dfe3] px-4"><h1 className="text-base font-semibold">{t("title")}</h1></header>
      <main className="p-4">
        <section className={`grid max-w-3xl md:grid-cols-2 ${hasSelectedLicense ? "" : "gap-5"}`}>
          {firstDetail ? <LicenseDetailSheet license={firstDetail} divider={false} /> : <div className={secondDetail ? "pr-3" : ""}><LicenseSelector license={null} onSelect={() => setOpenSlot(1)} /></div>}
          {secondDetail ? <LicenseDetailSheet license={secondDetail} divider /> : <div className={firstDetail ? "border-l border-[#e2dfe3] pl-3" : ""}><LicenseSelector license={null} onSelect={() => setOpenSlot(2)} /></div>}
        </section>
        {licensesQuery.isError ? <p className="mt-3 text-xs text-[#9c3b47]">{t("unavailable")}</p> : null}
      </main>
      {openSlot ? <LicensePicker licenses={licensesQuery.data ?? []} onClose={() => setOpenSlot(null)} onChoose={chooseLicense} /> : null}
    </div>
  );
}