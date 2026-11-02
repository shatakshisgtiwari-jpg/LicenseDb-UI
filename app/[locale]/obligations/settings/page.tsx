import { Suspense } from "react";
import { ObligationSettingsPage } from "@/components/obligation-settings-page";
import { LicenseRouteShell } from "@/components/license-route-shell";

export default function ObligationSettingsRoute({ params }: { params: Promise<{ locale: string }> }) {
  return <Suspense fallback={<main className="min-h-svh bg-[#f7f7f8]" aria-busy="true" />}><ObligationSettingsContent params={params} /></Suspense>;
}

async function ObligationSettingsContent({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LicenseRouteShell locale={locale}><ObligationSettingsPage /></LicenseRouteShell>;
}