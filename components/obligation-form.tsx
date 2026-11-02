"use client";

import { AlertTriangle, LoaderCircle, Save } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

type Obligation = { id: string; topic: string; type: string; text: string; classification: string; category: string; comment: string; active: boolean; textUpdatable: boolean; licenseIds: string[] };
type Options = { types: string[]; categories: string[]; classifications: string[] };
type SimilarObligation = { id: string; topic: string; text: string; similarity: number };
type LicenseOption = { id: string; shortName: string; fullName: string };

async function getObligation(id: string) {
  const response = await fetch(`/api/obligations/${id}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load obligation");
  return (await response.json() as { data: Obligation }).data;
}

async function getOptions() {
  const response = await fetch("/api/obligations/options", { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load obligation options");
  return response.json() as Promise<Options>;
}

async function getLicenseOptions() {
  const response = await fetch("/api/licenses?limit=100", { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load licenses");
  return (await response.json() as { data: LicenseOption[] }).data;
}

async function getSimilarObligations(text: string) {
  const response = await fetch("/api/obligations/similarity", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
  if (!response.ok) throw new Error("Unable to find similar obligations");
  return (await response.json() as { data: SimilarObligation[] }).data;
}

function payload(form: HTMLFormElement) {
  const values = new FormData(form);
  return {
    topic: String(values.get("topic") ?? "").trim(),
    type: String(values.get("type") ?? "").trim(),
    text: String(values.get("text") ?? "").trim(),
    classification: String(values.get("classification") ?? "").trim(),
    category: String(values.get("category") ?? "").trim(),
    comment: String(values.get("comment") ?? "").trim(),
    active: values.has("active"),
    text_updatable: values.has("text_updatable"),
  };
}

export function ObligationForm({ id }: { id?: string }) {
  const t = useTranslations("ObligationForm");
  const router = useRouter();
  const obligationQuery = useQuery({ queryKey: ["obligation", id], queryFn: () => getObligation(id!), enabled: Boolean(id) });
  const optionsQuery = useQuery({ queryKey: ["obligation-options"], queryFn: getOptions });
  const licenseOptionsQuery = useQuery({ queryKey: ["obligation-license-options"], queryFn: getLicenseOptions, enabled: !id });
  const [text, setText] = useState<string | null>(null);
  const currentText = text ?? obligationQuery.data?.text ?? "";
  const deferredText = useDeferredValue(currentText);
  const similarityQuery = useQuery({
    queryKey: ["obligation-similarity", deferredText],
    queryFn: () => getSimilarObligations(deferredText),
    enabled: deferredText.trim().length >= 40,
  });
  const mutation = useMutation({
    mutationFn: async (form: HTMLFormElement) => {
      const details = payload(form);
      const licenseId = String(new FormData(form).get("license_id") ?? "").trim();
      const response = await fetch(id ? `/api/obligations/${id}` : "/api/obligations", {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? details : { ...details, license_ids: licenseId ? [licenseId] : [] }),
      });
      if (!response.ok) throw new Error("Unable to save obligation");
    },
    onSuccess: () => router.push(id ? `/obligations/${id}` : "/obligations"),
  });

  if ((id && obligationQuery.isLoading) || optionsQuery.isLoading || (!id && licenseOptionsQuery.isLoading)) return <main className="min-h-svh bg-[#f7f7f8] p-8 text-sm text-[#756b78]">{t("loading")}</main>;
  if ((id && (obligationQuery.isError || !obligationQuery.data)) || optionsQuery.isError || !optionsQuery.data || (!id && licenseOptionsQuery.isError)) return <main className="min-h-svh bg-[#f7f7f8] p-8 text-sm text-[#9c3b47]">{t("unavailable")}</main>;

  const obligation = obligationQuery.data;
  const matches = similarityQuery.data?.filter((match) => match.id !== id).slice(0, 5) ?? [];
  const inputClassName = "h-6 w-full rounded-sm border border-[#b8b4b8] bg-white px-2 text-[10px] font-normal text-[#312a34] outline-none focus:border-[#7b1a89] focus:ring-1 focus:ring-[#7b1a89]/25 disabled:bg-[#f0eef1]";
  const labelClassName = "grid gap-1 text-[10px] font-medium leading-none text-[#312a34]";
  const required = <span aria-hidden="true" className="ml-0.5 text-[#d3293c]">*</span>;

  return (
    <div className="flex h-svh min-h-0 flex-col overflow-hidden bg-white text-[#26212a]">
      <header className="flex h-12 shrink-0 items-center border-b border-[#e1dde1] px-4"><div><h1 className="text-base font-semibold text-[#171217]">{id ? obligation?.topic || t("title") : t("addTitle")}</h1>{id ? <p className="mt-0.5 text-[8px] text-[#776f79]"><Link href="/obligations" className="text-[#7b1a89] hover:underline">{t("list")}</Link> / {obligation?.topic}</p> : null}</div></header>
      <form onSubmit={(event) => { event.preventDefault(); mutation.mutate(event.currentTarget); }} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 md:overflow-hidden">
          <div className="grid gap-x-3 gap-y-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(17rem,1.48fr)]">
            <label className={`${labelClassName} md:col-span-2`}>{t("topic")}{required}<input required name="topic" placeholder={t("topicPlaceholder")} defaultValue={obligation?.topic} disabled={mutation.isPending} className={inputClassName} /></label>
            <label className={`${labelClassName} md:row-span-7`}>{t("fullText")}{required}<textarea required name="text" value={currentText} onChange={(event) => setText(event.target.value)} disabled={mutation.isPending} className="h-70 w-full resize-none rounded-sm border border-[#a9a5aa] bg-white p-2 text-[10px] font-normal text-[#312a34] outline-none focus:border-[#7b1a89] focus:ring-1 focus:ring-[#7b1a89]/25" /></label>
            <label className={labelClassName}>{t("classification")}{required}<select required name="classification" defaultValue={obligation?.classification ?? ""} disabled={mutation.isPending} className={`${inputClassName} appearance-auto`}><option value="" disabled>{t("selectClassification")}</option>{optionsQuery.data.classifications.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label className={labelClassName}>{t("category")}{required}<select required name="category" defaultValue={obligation?.category ?? optionsQuery.data.categories.find((value) => value.toLowerCase() === "general") ?? ""} disabled={mutation.isPending} className={`${inputClassName} appearance-auto`}><option value="" disabled>{t("selectCategory")}</option>{optionsQuery.data.categories.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label className={`${labelClassName} md:col-span-2`}>{t("type")}{required}<select required name="type" defaultValue={obligation?.type ?? ""} disabled={mutation.isPending} className={`${inputClassName} appearance-auto`}><option value="" disabled>{t("selectType")}</option>{optionsQuery.data.types.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            {id ? <div className={`${labelClassName} md:col-span-2`}><span>{t("associatedLicenses")}</span><div className="h-6 rounded-sm border border-[#b8b4b8] bg-[#f8f7f8] px-2 py-1 text-[9px] font-normal text-[#655d67]">{obligation?.licenseIds.length ? obligation.licenseIds.join(", ") : t("select")}</div></div> : <label className={`${labelClassName} md:col-span-2`}>{t("associatedLicenses")}<select name="license_id" defaultValue="" disabled={mutation.isPending} className={`${inputClassName} appearance-auto`}><option value="">{t("select")}</option>{licenseOptionsQuery.data?.map((license) => <option key={license.id} value={license.id}>{license.shortName || license.fullName || license.id}</option>)}</select></label>}
            <fieldset className="grid gap-1 text-[10px] text-[#312a34] md:col-span-2"><legend className="font-medium">{t("status")}</legend><div className="flex flex-wrap gap-x-8 gap-y-1"><label className="flex items-center gap-1.5"><input type="checkbox" name="text_updatable" defaultChecked={obligation?.textUpdatable} disabled={mutation.isPending} className="size-3 accent-[#7b1a89]" />{t("textUpdatable")}</label><label className="flex items-center gap-1.5"><input type="checkbox" name="active" defaultChecked={obligation?.active ?? true} disabled={mutation.isPending} className="size-3 accent-[#7b1a89]" />{t("active")}</label></div></fieldset>
            <label className={`${labelClassName} md:col-span-2`}>{t("comments")}<input name="comment" placeholder={t("commentsPlaceholder")} defaultValue={obligation?.comment} disabled={mutation.isPending} className={inputClassName} /></label>
            {matches.length ? <aside className="grid gap-1.5 text-[9px] md:col-start-3 md:row-start-8"><span className="font-semibold text-[#332d35]">{t("similarFound")}</span>{matches.map((match) => { const score = Math.round(match.similarity * 100); const strong = score >= 85; return <div key={match.id} className={`flex items-center justify-between gap-2 rounded-sm border px-2 py-1.5 ${strong ? "border-[#75aa80] bg-[#f7fbf8]" : "border-[#e1b24d] bg-[#fffdf7]"}`}><div className="min-w-0"><p className="truncate font-medium">{match.topic || t("untitled")}</p><p className="truncate text-[#55705b]">{match.text}</p><span className={`mt-1 inline-flex rounded-sm px-1 py-0.5 text-[7px] font-semibold ${strong ? "bg-[#87c894] text-[#164d23]" : "bg-[#f4d47d] text-[#684805]"}`}>{strong ? t("strongMatch") : t("partialMatch")}</span></div><span className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-[7px] font-semibold ${strong ? "border-[#4f985f] text-[#236b34]" : "border-[#e1a631] text-[#795008]"}`}>{score}%</span></div>; })}</aside> : null}
            {deferredText.trim().length >= 40 && similarityQuery.isSuccess && !matches.length ? <aside role="status" className="flex items-center gap-1.5 border border-[#efd3a4] bg-[#fff8ec] px-2 py-1.5 text-[8px] text-[#b25d00] md:col-start-3 md:row-start-8"><AlertTriangle aria-hidden="true" className="size-3 shrink-0" />{t("noSimilar")}</aside> : null}
          </div>
        </div>
        <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-[#e1dde1] bg-white px-4 py-2">{mutation.isError ? <p role="alert" className="mr-auto text-xs text-[#9c3b47]">{t("saveError")}</p> : null}<Button type="button" variant="outline" size="sm" disabled={mutation.isPending} onClick={() => router.push(id ? `/obligations/${id}` : "/obligations")} className="min-w-21 rounded-sm border-[#b97abb] text-[10px] text-[#7b1a89] hover:bg-[#fbf4fb]">{t("cancel")}</Button><Button type="submit" size="sm" disabled={mutation.isPending} className="min-w-29 rounded-sm bg-[#7b1a89] text-[10px] hover:bg-[#671473]">{mutation.isPending ? <LoaderCircle className="animate-spin" /> : <Save />} {id ? t("update") : t("save")}</Button></footer>
      </form>
    </div>
  );
}