import { Suspense } from "react";
import { CompareObligationsPage } from "@/components/compare-obligations-page";
import { LicenseRouteShell } from "@/components/license-route-shell";

export default function CompareObligationsRoute({ params }: { params: Promise<{ locale: string }> }) {
  return <Suspense fallback={<main className="min-h-svh bg-[#f7f7f8]" aria-busy="true" />}><CompareObligationsContent params={params} /></Suspense>;
}

async function CompareObligationsContent({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LicenseRouteShell locale={locale}><CompareObligationsPage /></LicenseRouteShell>;
}