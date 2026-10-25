import { Suspense } from "react";
import { ExportImportLicensesPage } from "@/components/export-import-licenses-page";
import { LicenseRouteShell } from "@/components/license-route-shell";

export default function ExportImportLicensesRoute({ params }: { params: Promise<{ locale: string }> }) {
  return <Suspense fallback={<main className="min-h-svh bg-[#f7f7f8]" aria-busy="true" />}><ExportImportLicensesContent params={params} /></Suspense>;
}

async function ExportImportLicensesContent({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LicenseRouteShell locale={locale}><ExportImportLicensesPage /></LicenseRouteShell>;
}