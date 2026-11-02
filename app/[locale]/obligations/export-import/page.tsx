import { Suspense } from "react";
import { ExportImportObligationsPage } from "@/components/export-import-obligations-page";
import { LicenseRouteShell } from "@/components/license-route-shell";

export default function ExportImportObligationsRoute({ params }: { params: Promise<{ locale: string }> }) {
  return <Suspense fallback={<main className="min-h-svh bg-[#f7f7f8]" aria-busy="true" />}><ExportImportObligationsContent params={params} /></Suspense>;
}

async function ExportImportObligationsContent({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LicenseRouteShell locale={locale}><ExportImportObligationsPage /></LicenseRouteShell>;
}