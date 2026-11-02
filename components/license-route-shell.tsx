import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { getAuthConfiguration } from "@/lib/auth-configuration";
import { getAuthOptions, isAuthConfigured } from "@/lib/auth";

export async function LicenseRouteShell({ locale, children }: { locale: string; children: ReactNode }) {
  await connection();
  const authConfigured = isAuthConfigured();
  const session = authConfigured ? await getServerSession(getAuthOptions()) : null;
  if (!session?.user?.id) redirect(`/${locale}/login`);

  const { mode, providerName } = getAuthConfiguration();
  return <AppSidebar authConfigured={authConfigured} authMode={mode} providerName={providerName}>{children}</AppSidebar>;
}