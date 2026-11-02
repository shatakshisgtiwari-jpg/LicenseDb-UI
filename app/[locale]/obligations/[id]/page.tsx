import { Suspense } from "react";
import { ObligationDetails } from "@/components/obligation-details";
import { LicenseRouteShell } from "@/components/license-route-shell";

export default function ObligationDetailsRoute({ params }: { params: Promise<{ locale: string; id: string }> }) {
  return <Suspense fallback={<main className="min-h-svh bg-[#f7f7f8]" aria-busy="true" />}><ObligationDetailsContent params={params} /></Suspense>;
}

async function ObligationDetailsContent({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  return <LicenseRouteShell locale={locale}><ObligationDetails id={id} /></LicenseRouteShell>;
}