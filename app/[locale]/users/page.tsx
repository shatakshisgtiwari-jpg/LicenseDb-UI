import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { UsersPage } from "@/components/users-page";
import { getAuthConfiguration } from "@/lib/auth-configuration";
import { getAuthOptions, isAuthConfigured } from "@/lib/auth";

export default async function UsersRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <Suspense fallback={<main className="min-h-svh bg-[#f7f7f8]" aria-busy="true" />}>
      <AuthenticatedUsers locale={locale} />
    </Suspense>
  );
}

async function AuthenticatedUsers({ locale }: { locale: string }) {
  await connection();
  const authConfigured = isAuthConfigured();
  const session = authConfigured ? await getServerSession(getAuthOptions()) : null;

  if (!session?.user?.id) redirect(`/${locale}/login`);

  const { mode, providerName } = getAuthConfiguration();
  return (
    <AppSidebar authConfigured={authConfigured} authMode={mode} providerName={providerName}>
      <UsersPage />
    </AppSidebar>
  );
}