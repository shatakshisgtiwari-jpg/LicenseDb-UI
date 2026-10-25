import { Suspense } from "react";
import { LicenseForm } from "@/components/license-form";
import { LicenseRouteShell } from "@/components/license-route-shell";

export default function EditLicenseRoute({ params }: { params: Promise<{ locale: string; id: string }> }) {
  return <Suspense fallback={<main className="min-h-svh bg-[#f7f7f8]" aria-busy="true" />}><EditLicenseContent params={params} /></Suspense>;
}

async function EditLicenseContent({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  return <LicenseRouteShell locale={locale}><LicenseForm id={id} /></LicenseRouteShell>;
}