import { Suspense } from "react";
import { ObligationForm } from "@/components/obligation-form";
import { LicenseRouteShell } from "@/components/license-route-shell";

export default function EditObligationRoute({ params }: { params: Promise<{ locale: string; id: string }> }) {
  return <Suspense fallback={<main className="min-h-svh bg-[#f7f7f8]" aria-busy="true" />}><EditObligationContent params={params} /></Suspense>;
}

async function EditObligationContent({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  return <LicenseRouteShell locale={locale}><ObligationForm id={id} /></LicenseRouteShell>;
}