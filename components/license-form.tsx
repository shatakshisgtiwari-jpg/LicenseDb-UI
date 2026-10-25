"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, LoaderCircle, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDeferredValue, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

type License = {
  id: string;
  spdxId: string;
  shortName: string;
  fullName: string;
  text: string;
  url: string;
  notes: string;
  source: string;
  risk: number | null;
  copyleft: boolean;
  osiApproved: boolean;
  textUpdatable: boolean;
  active: boolean;
};

async function getLicense(id: string) {
  const response = await fetch(`/api/licenses/${id}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load license");
  return (await response.json() as { data: License }).data;
}

async function getLicenseCandidates() {
  const response = await fetch("/api/licenses?limit=100", { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load licenses");
  return (await response.json() as { data: License[] }).data;
}

function scoreLicenseText(text: string, candidateText: string) {
  const words = (value: string) => new Set(value.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []);
  const inputWords = words(text);
  const candidateWords = words(candidateText);
  if (inputWords.size < 8 || candidateWords.size < 8) return 0;

  const sharedWords = [...inputWords].filter((word) => candidateWords.has(word)).length;
  return Math.round((sharedWords / Math.min(inputWords.size, candidateWords.size)) * 100);
}

function SimilarLicenses({ matches }: { matches: { license: License; score: number }[] }) {
  const t = useTranslations("LicenseForm");
  return (
    <aside className="grid gap-1.5 text-[9px] text-[#2e4233] md:col-start-3 md:row-start-7">
      <span className="font-semibold text-[#332d35]">{t("similarLicenses")}</span>
      {matches.map(({ license, score }) => <div key={license.id} className={`grid gap-1 rounded-sm border px-2 py-1.5 ${score >= 85 ? "border-[#75aa80] bg-[#f7fbf8]" : "border-[#e1b24d] bg-[#fffdf7]"}`}><div className="flex items-center justify-between gap-2"><div className="min-w-0"><p className="truncate font-medium">{license.shortName || license.fullName}</p><p className="truncate text-[#55705b]">{license.spdxId}</p></div><span className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-[7px] font-semibold ${score >= 85 ? "border-[#4f985f] text-[#236b34]" : "border-[#e1a631] text-[#795008]"}`}>{score}%</span></div><span className={`w-fit rounded-sm px-1 py-0.5 text-[7px] font-semibold ${score >= 85 ? "bg-[#87c894] text-[#164d23]" : "bg-[#f4d47d] text-[#684805]"}`}>{score >= 85 ? t("strongMatch") : t("partialMatch")}</span></div>)}
    </aside>
  );
}

function LicenseFields({ license, disabled }: { license?: License; disabled: boolean }) {
  const t = useTranslations("LicenseForm");
  const [licenseText, setLicenseText] = useState(license?.text ?? "");
  const deferredLicenseText = useDeferredValue(licenseText);
  const similarityQuery = useQuery({ queryKey: ["license-candidates"], queryFn: getLicenseCandidates, enabled: deferredLicenseText.trim().length >= 80 });
  const similarLicenses = similarityQuery.data
    ?.map((candidate) => ({ license: candidate, score: scoreLicenseText(deferredLicenseText, candidate.text) }))
    .filter(({ license: candidate, score }) => candidate.id !== license?.id && score >= 70)
    .sort((first, second) => second.score - first.score)
    .slice(0, 2);
  const inputClassName = "h-6 w-full rounded-sm border border-[#b8b4b8] bg-white px-2 text-[10px] font-normal text-[#312a34] outline-none placeholder:text-[#908a90] focus:border-[#7b1a89] focus:ring-1 focus:ring-[#7b1a89]/25 disabled:bg-[#f0eef1]";
  const labelClassName = "grid gap-1 text-[10px] font-medium leading-none text-[#312a34]";
  const required = <span aria-hidden="true" className="ml-0.5 text-[#d3293c]">*</span>;

  return (
    <div className="grid gap-x-3 gap-y-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(16rem,1.48fr)]">
      <label className={labelClassName}>{t("shortName")}{required}<input required name="shortname" placeholder={t("shortNamePlaceholder")} defaultValue={license?.shortName} disabled={disabled} className={inputClassName} /></label>
      <label className={labelClassName}>{t("spdxId")}{required}<input required name="spdx_id" placeholder={t("spdxIdPlaceholder")} defaultValue={license?.spdxId} disabled={disabled} className={inputClassName} /></label>
      <label className={`${labelClassName} md:row-span-5`}>{t("text")}{required}<textarea required name="text" placeholder={t("textPlaceholder")} value={licenseText} onChange={(event) => setLicenseText(event.target.value)} disabled={disabled} className="h-56 w-full resize-none rounded-sm border border-[#a9a5aa] bg-white p-2 text-[10px] font-normal text-[#312a34] outline-none placeholder:text-[#908a90] focus:border-[#7b1a89] focus:ring-1 focus:ring-[#7b1a89]/25 disabled:bg-[#f0eef1]" /></label>
      <label className={`${labelClassName} md:col-span-2`}>{t("fullName")}{required}<input required name="fullname" placeholder={t("fullNamePlaceholder")} defaultValue={license?.fullName} disabled={disabled} className={inputClassName} /></label>
      <label className={`${labelClassName} md:col-span-2`}>{t("url")}<input name="url" type="url" placeholder={t("urlPlaceholder")} defaultValue={license?.url} disabled={disabled} className={inputClassName} /></label>
      <label className={`${labelClassName} md:col-span-2`}>{t("notes")}<input name="notes" placeholder={t("notesPlaceholder")} defaultValue={license?.notes} disabled={disabled} className={inputClassName} /></label>
      <fieldset className="grid gap-2 text-[10px] text-[#312a34] md:col-span-2">
        <legend className="mb-1 font-medium">{t("licenseStatus")}</legend>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-1">
          <label className="flex items-center gap-1.5"><input type="checkbox" name="active" defaultChecked={license?.active ?? true} disabled={disabled} className="size-3 accent-[#7b1a89]" />{t("active")}</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" name="copyleft" defaultChecked={license?.copyleft} disabled={disabled} className="size-3 accent-[#7b1a89]" />{t("copyleft")}</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" name="OSIapproved" defaultChecked={license?.osiApproved} disabled={disabled} className="size-3 accent-[#7b1a89]" />{t("osiApproved")}</label>
        </div>
      </fieldset>
      <label className={`${labelClassName} md:col-span-2`}>{t("risk")}{required}<select required name="risk" defaultValue={license?.risk ?? ""} disabled={disabled} className={`${inputClassName} appearance-auto`}><option value="" disabled>{t("select")}</option><option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select></label>
      <label className={`${labelClassName} md:col-span-2`}>{t("obligations")}<select name="obligations" disabled={disabled} defaultValue="" className={`${inputClassName} appearance-auto`}><option value="">{t("select")}</option></select></label>
      {similarLicenses?.length ? <SimilarLicenses matches={similarLicenses} /> : null}
      {deferredLicenseText.trim().length >= 80 && similarityQuery.isSuccess && !similarLicenses?.length ? <aside role="status" className="flex items-center gap-1.5 border border-[#efd3a4] bg-[#fff8ec] px-2 py-1.5 text-[8px] text-[#b25d00] md:col-start-3 md:row-start-7"><AlertTriangle aria-hidden="true" className="size-3 shrink-0" />{t("noSimilarLicenses")}</aside> : null}
      <label className={`${labelClassName} md:col-span-2`}>{t("acknowledgementText")}<textarea name="acknowledgement" placeholder={t("acknowledgementPlaceholder")} disabled={disabled} className="h-8 w-full resize-none rounded-sm border border-[#b8b4b8] bg-white px-2 py-1 text-[10px] font-normal text-[#312a34] outline-none placeholder:text-[#908a90] focus:border-[#7b1a89] focus:ring-1 focus:ring-[#7b1a89]/25 disabled:bg-[#f0eef1]" /></label>
    </div>
  );
}

function licensePayload(form: HTMLFormElement) {
  const values = new FormData(form);
  return {
    spdx_id: String(values.get("spdx_id") ?? "").trim(),
    shortname: String(values.get("shortname") ?? "").trim(),
    fullname: String(values.get("fullname") ?? "").trim(),
    text: String(values.get("text") ?? "").trim(),
    risk: Number(values.get("risk")),
    url: String(values.get("url") ?? "").trim(),
    source: String(values.get("source") ?? "").trim(),
    notes: String(values.get("notes") ?? "").trim(),
    OSIapproved: values.has("OSIapproved"),
    copyleft: values.has("copyleft"),
    text_updatable: values.has("text_updatable"),
    active: values.has("active"),
    obligations: String(values.get("obligations") ?? "").trim(),
    acknowledgement: String(values.get("acknowledgement") ?? "").trim(),
  };
}

export function LicenseForm({ id }: { id?: string }) {
  const t = useTranslations("LicenseForm");
  const router = useRouter();
  const licenseQuery = useQuery({ queryKey: ["license", id], queryFn: () => getLicense(id!), enabled: Boolean(id) });
  const mutation = useMutation({
    mutationFn: async (form: HTMLFormElement) => {
      const response = await fetch(id ? `/api/licenses/${id}` : "/api/licenses", {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(licensePayload(form)),
      });
      if (!response.ok) throw new Error("Unable to save license");
    },
    onSuccess: () => router.push("/licenses"),
  });

  if (licenseQuery.isLoading) return <main className="min-h-svh bg-[#f7f7f8] p-8 text-sm text-[#756b78]">{t("loading")}</main>;
  if (licenseQuery.isError) return <main className="min-h-svh bg-[#f7f7f8] p-8 text-sm text-[#9c3b47]">{t("unavailable")}</main>;

  return (
    <div className="flex h-svh min-h-0 flex-col overflow-hidden bg-white text-[#26212a]">
      <header className="flex h-12 shrink-0 items-center border-b border-[#e1dde1] px-4"><div><h1 className="text-base font-semibold text-[#171217]">{id ? licenseQuery.data?.shortName || t("editTitle") : t("addTitle")}</h1>{id ? <p className="mt-0.5 text-[8px] text-[#776f79]"><Link href="/licenses" className="text-[#7b1a89] hover:underline">{t("licenseList")}</Link> / {licenseQuery.data?.shortName}</p> : null}</div></header>
      <form onSubmit={(event) => { event.preventDefault(); mutation.mutate(event.currentTarget); }} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 md:overflow-hidden"><LicenseFields key={licenseQuery.data?.id ?? "new"} license={licenseQuery.data} disabled={mutation.isPending} /></div>
        <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-[#e1dde1] bg-white px-4 py-2">
          {mutation.isError ? <p role="alert" className="mr-auto text-xs text-[#9c3b47]">{t("saveError")}</p> : null}
          <Button type="button" variant="outline" size="sm" disabled={mutation.isPending} onClick={() => router.push("/licenses")} className="min-w-21 rounded-sm border-[#b97abb] text-[10px] text-[#7b1a89] hover:bg-[#fbf4fb] hover:text-[#671473]">{t("cancel")}</Button>
          <Button type="submit" size="sm" disabled={mutation.isPending} className="min-w-21 rounded-sm bg-[#7b1a89] text-[10px] hover:bg-[#671473]">{mutation.isPending ? <LoaderCircle className="animate-spin" /> : <Save />} {id ? t("update") : t("save")}</Button>
        </footer>
      </form>
    </div>
  );
}