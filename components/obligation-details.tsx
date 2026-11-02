"use client";

import { useQuery } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

type Obligation = {
  id: string;
  topic: string;
  type: string;
  text: string;
  classification: string;
  category: string;
  comment: string;
  active: boolean;
  textUpdatable: boolean;
  licenseIds: string[];
};

async function getObligation(id: string) {
  const response = await fetch(`/api/obligations/${id}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load obligation");
  return (await response.json() as { data: Obligation }).data;
}

export function ObligationDetails({ id }: { id: string }) {
  const t = useTranslations("ObligationDetails");
  const query = useQuery({ queryKey: ["obligation", id], queryFn: () => getObligation(id) });
  const obligation = query.data;

  if (query.isLoading) return <main className="min-h-svh bg-[#f7f7f8] p-8 text-sm text-[#756b78]">{t("loading")}</main>;
  if (query.isError || !obligation) return <main className="min-h-svh bg-[#f7f7f8] p-8 text-sm text-[#9c3b47]">{t("unavailable")}</main>;

  const status = [[t("textUpdatable"), obligation.textUpdatable], [t("active"), obligation.active]].filter(([, enabled]) => enabled);
  return (
    <div className="flex h-svh min-h-0 flex-col overflow-hidden bg-white text-[#26212a]">
      <header className="shrink-0 border-b border-[#e2dfe3] px-4 py-3">
        <h1 className="text-base font-semibold text-[#1f1a20]">{obligation.topic || t("title")}</h1>
        <p className="mt-1 text-[9px] text-[#6f6871]"><Link href="/obligations" className="text-[#7b1a89] hover:underline">{t("list")}</Link><span className="px-1 text-[#938b94]">/</span>{obligation.topic || t("title")}</p>
      </header>
      <main className="grid min-h-0 flex-1 md:grid-cols-[minmax(19rem,0.92fr)_minmax(0,1fr)]">
        <section className="min-h-0 overflow-y-auto px-4 py-3">
          <dl className="grid gap-y-3 text-[10px]">
            <div><dt className="text-[9px] text-[#5c5660]">{t("topic")}</dt><dd className="mt-1">{obligation.topic || "-"}</dd></div>
            <div className="grid grid-cols-2 gap-3"><div><dt className="text-[9px] text-[#5c5660]">{t("classification")}</dt><dd className="mt-1"><span className="rounded-sm bg-[#eeeeef] px-1.5 py-0.5">{obligation.classification || "-"}</span></dd></div><div><dt className="text-[9px] text-[#5c5660]">{t("category")}</dt><dd className="mt-1">{obligation.category || "-"}</dd></div></div>
            <div><dt className="text-[9px] text-[#5c5660]">{t("type")}</dt><dd className="mt-1">{obligation.type || "-"}</dd></div>
            <div><dt className="text-[9px] text-[#5c5660]">{t("associatedLicenses")}</dt><dd className="mt-1 break-all">{obligation.licenseIds.length ? obligation.licenseIds.join(", ") : t("notAvailable")}</dd></div>
            <div><dt className="text-[9px] text-[#5c5660]">{t("status")}</dt><dd className="mt-1 flex flex-wrap gap-1">{status.length ? status.map(([label]) => <span key={String(label)} className="rounded-sm bg-[#eeeeef] px-1.5 py-0.5 text-[9px]">{label}</span>) : t("notAvailable")}</dd></div>
            <div><dt className="text-[9px] text-[#5c5660]">{t("comments")}</dt><dd className="mt-1 whitespace-pre-wrap">{obligation.comment || t("notAvailable")}</dd></div>
            <div><dt className="text-[9px] text-[#5c5660]">{t("obligationId")}</dt><dd className="mt-1 break-all">{obligation.id}</dd></div>
          </dl>
        </section>
        <section className="flex min-h-0 flex-col border-t border-[#e2dfe3] p-3 md:border-t-0 md:border-l">
          <label className="mb-1 text-[9px] text-[#5c5660]" htmlFor="obligation-text">{t("fullText")}</label>
          <textarea id="obligation-text" readOnly value={obligation.text} className="min-h-0 flex-1 resize-none rounded-sm border border-[#a8a0aa] bg-white p-2 text-[10px] leading-4 text-[#4c454e] outline-none" />
        </section>
      </main>
      <footer className="flex shrink-0 justify-end gap-3 border-t border-[#e2dfe3] px-4 py-3">
        <Button render={<Link href="/obligations" />} variant="outline" size="sm" className="rounded-sm border-[#b454bd] text-[#7b1a89] hover:bg-[#fcf6fd]">{t("backToList")}</Button>
        <Button render={<Link href={`/obligations/${id}/edit`} />} size="sm" className="rounded-sm bg-[#7b1a89] text-white hover:bg-[#65146f]"><Pencil /> {t("edit")}</Button>
      </footer>
    </div>
  );
}