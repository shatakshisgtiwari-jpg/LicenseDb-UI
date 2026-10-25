import { Suspense } from "react";
import { LicenseDetails } from "@/components/license-details";
import { LicenseRouteShell } from "@/components/license-route-shell";

export default function LicenseDetailsRoute({ params }: { params: Promise<{ locale: string; id: string }> }) {
  return <Suspense fallback={<main className="min-h-svh bg-[#f7f7f8]" aria-busy="true" />}><LicenseDetailsContent params={params} /></Suspense>;
}

async function LicenseDetailsContent({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  return <LicenseRouteShell locale={locale}><LicenseDetails id={id} /></LicenseRouteShell>;
}