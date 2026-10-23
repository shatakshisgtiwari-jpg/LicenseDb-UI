import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { LicensesPage } from "@/components/licenses-page";
import { getAuthConfiguration } from "@/lib/auth-configuration";
import { getAuthOptions, isAuthConfigured } from "@/lib/auth";

export default async function LicensesRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <Suspense fallback={<main className="min-h-svh bg-[#f7f7f8]" aria-busy="true" />}>
      <AuthenticatedLicenses locale={locale} />
    </Suspense>
  );
}

async function AuthenticatedLicenses({ locale }: { locale: string }) {
  await connection();
  const authConfigured = isAuthConfigured();
  const session = authConfigured ? await getServerSession(getAuthOptions()) : null;

  if (!session?.user?.id) redirect(`/${locale}/login`);

  const { mode, providerName } = getAuthConfiguration();
  return (
    <AppSidebar authConfigured={authConfigured} authMode={mode} providerName={providerName}>
      <LicensesPage />
    </AppSidebar>
  );
}