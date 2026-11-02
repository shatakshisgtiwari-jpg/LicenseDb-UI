import { Suspense } from "react";
import { ObligationForm } from "@/components/obligation-form";
import { LicenseRouteShell } from "@/components/license-route-shell";

export default function NewObligationRoute({ params }: { params: Promise<{ locale: string }> }) {
  return <Suspense fallback={<main className="min-h-svh bg-[#f7f7f8]" aria-busy="true" />}><NewObligationContent params={params} /></Suspense>;
}

async function NewObligationContent({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LicenseRouteShell locale={locale}><ObligationForm /></LicenseRouteShell>;
}