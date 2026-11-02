import { Suspense } from "react";
import { LicenseRouteShell } from "@/components/license-route-shell";
import { ObligationsPage } from "@/components/obligations-page";

export default async function ObligationsRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <Suspense fallback={<main className="min-h-svh bg-[#f7f7f8]" aria-busy="true" />}><LicenseRouteShell locale={locale}><ObligationsPage /></LicenseRouteShell></Suspense>;
}