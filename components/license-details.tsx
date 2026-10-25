"use client";

import { useQuery } from "@tanstack/react-query";
import { GitCompareArrows, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

type License = { id: string; spdxId: string; shortName: string; fullName: string; text: string; url: string; notes: string; source: string; risk: number | null; copyleft: boolean; osiApproved: boolean; textUpdatable: boolean; active: boolean };

async function getLicense(id: string) {
  const response = await fetch(`/api/licenses/${id}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load license");
  return (await response.json() as { data: License }).data;
}

export function LicenseDetails({ id }: { id: string }) {
  const t = useTranslations("LicenseDetails");
  const query = useQuery({ queryKey: ["license", id], queryFn: () => getLicense(id) });
  const license = query.data;
  if (query.isLoading) return <main className="min-h-svh bg-[#f7f7f8] p-8 text-sm text-[#756b78]">{t("loading")}</main>;
  if (query.isError || !license) return <main className="min-h-svh bg-[#f7f7f8] p-8 text-sm text-[#9c3b47]">{t("unavailable")}</main>;

  const status = [[t("active"), license.active], [t("copyleft"), license.copyleft], [t("osiApproved"), license.osiApproved]].filter(([, enabled]) => enabled);
  return <div className="flex h-svh min-h-0 flex-col overflow-hidden bg-white text-[#26212a]"><header className="flex h-12 shrink-0 items-center border-b border-[#e2dfe3] px-4"><div><h1 className="text-base font-semibold text-[#1f1a20]">{license.shortName || t("title")}</h1><p className="mt-0.5 text-[8px] text-[#6f6871]">{t("licenseId", { id: license.id })}</p></div></header><main className="grid min-h-0 flex-1 md:grid-cols-[minmax(17rem,0.92fr)_minmax(0,1fr)]"><section className="min-h-0 overflow-y-auto px-4 py-3"><dl className="grid gap-y-3 text-[9px]"><div className="grid grid-cols-2 gap-3"><div><dt className="text-[8px] text-[#5c5660]">{t("shortName")}</dt><dd>{license.shortName || "-"}</dd></div><div><dt className="text-[8px] text-[#5c5660]">{t("spdxId")}</dt><dd>{license.spdxId || "-"}</dd></div></div><div><dt className="text-[8px] text-[#5c5660]">{t("fullName")}</dt><dd>{license.fullName || "-"}</dd></div><div><dt className="text-[8px] text-[#5c5660]">{t("url")}</dt><dd>{license.url || "-"}</dd></div><div><dt className="text-[8px] text-[#5c5660]">{t("notes")}</dt><dd>{license.notes || "-"}</dd></div><div><dt className="text-[8px] text-[#5c5660]">{t("licenseStatus")}</dt><dd className="mt-1 flex flex-wrap gap-1">{status.length ? status.map(([label]) => <span key={String(label)} className="rounded-sm bg-[#eeeeef] px-1 py-0.5 text-[8px]">{label}</span>) : "-"}</dd></div><div><dt className="text-[8px] text-[#5c5660]">{t("risk")}</dt><dd>{license.risk ?? "-"}</dd></div><div><dt className="text-[8px] text-[#5c5660]">{t("obligation")}</dt><dd>{t("notAvailable")}</dd></div><div><dt className="text-[8px] text-[#5c5660]">{t("acknowledgementText")}</dt><dd>{license.source || t("notAvailable")}</dd></div><div><dt className="text-[8px] text-[#5c5660]">{t("otherLicenseName")}</dt><dd>{t("notAvailable")}</dd></div></dl></section><section className="flex min-h-0 flex-col border-t border-[#e2dfe3] p-3 md:border-t-0 md:border-l"><h2 className="mb-1 text-[8px] text-[#5c5660]">{t("text")}</h2><pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap border border-[#c8c3c9] p-2 text-[8px] leading-tight text-[#2f2a31]">{license.text}</pre></section></main><footer className="flex shrink-0 justify-end gap-3 border-t border-[#e2dfe3] bg-white px-4 py-2"><Button render={<Link href={`/licenses/compare?first=${id}`} />} variant="outline" size="sm" className="rounded-sm border-[#bd82c3] text-[10px] text-[#7b1a89] hover:bg-[#fbf2fc] hover:text-[#671473]"><GitCompareArrows /> {t("compare")}</Button><Button render={<Link href={`/licenses/${id}/edit`} />} size="sm" className="rounded-sm bg-[#7b1a89] text-[10px] hover:bg-[#671473]"><Pencil /> {t("edit")}</Button></footer></div>;
}