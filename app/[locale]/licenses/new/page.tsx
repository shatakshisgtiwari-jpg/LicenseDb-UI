import { Suspense } from "react";
import { LicenseForm } from "@/components/license-form";
import { LicenseRouteShell } from "@/components/license-route-shell";

export default function NewLicenseRoute({ params }: { params: Promise<{ locale: string }> }) {
  return <Suspense fallback={<main className="min-h-svh bg-[#f7f7f8]" aria-busy="true" />}><NewLicenseContent params={params} /></Suspense>;
}

async function NewLicenseContent({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LicenseRouteShell locale={locale}><LicenseForm /></LicenseRouteShell>;
}