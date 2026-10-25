import { Suspense } from "react";
import { CompareLicensesPage } from "@/components/compare-licenses-page";
import { LicenseRouteShell } from "@/components/license-route-shell";

export default function CompareLicensesRoute({ params }: { params: Promise<{ locale: string }> }) {
  return <Suspense fallback={<main className="min-h-svh bg-[#f7f7f8]" aria-busy="true" />}><CompareLicensesContent params={params} /></Suspense>;
}

async function CompareLicensesContent({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LicenseRouteShell locale={locale}><CompareLicensesPage /></LicenseRouteShell>;
}