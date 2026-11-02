"use client";

import {
  ChevronDown,
  FileCheck2,
  LayoutDashboard,
  ScrollText,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

type NavigationItem = {
  key: "dashboard" | "users" | "license" | "obligation" | "manageClients";
  href?: "/" | "/licenses";
  icon: LucideIcon;
};

const navigationItems: readonly NavigationItem[] = [
  { key: "dashboard", href: "/", icon: LayoutDashboard },
  { key: "users", icon: UserRound },
  { key: "license", href: "/licenses", icon: ScrollText },
  { key: "obligation", icon: FileCheck2 },
  { key: "manageClients", icon: UsersRound },
];

export function MainNavigation() {
  const t = useTranslations("Sidebar");
  const pathname = usePathname();
  const obligationActive = pathname.startsWith("/obligations");
  const [obligationOpen, setObligationOpen] = useState(obligationActive);

  useEffect(() => {
    if (obligationActive) setObligationOpen(true);
  }, [obligationActive]);

  return (
    <nav aria-label="Main navigation">
      <SidebarMenu className="gap-1">
        {navigationItems.map(({ key, href, icon: Icon }) => {
          const isObligation = key === "obligation";
          const active = href === pathname || (isObligation && obligationActive);
          const className = active
            ? "h-10 text-[#f1e6f3] data-active:bg-[#35163a] data-active:text-white"
            : "h-10 text-[#e8d8ec] hover:bg-[#35183b] hover:text-white";

          return (
            <SidebarMenuItem key={key}>
              {href ? (
                <SidebarMenuButton
                  render={<Link href={href} aria-current={active ? "page" : undefined} />}
                  isActive={active}
                  tooltip={t(key)}
                  className={className}
                >
                  <Icon />
                  <span>{t(key)}</span>
                </SidebarMenuButton>
              ) : isObligation ? (
                <SidebarMenuButton type="button" tooltip={t(key)} isActive={obligationActive} onClick={() => setObligationOpen((open) => !open)} aria-expanded={obligationOpen} className={className}>
                  <Icon />
                  <span>{t(key)}</span>
                  <ChevronDown className={`ml-auto size-4 transition-transform group-data-[collapsible=icon]:hidden ${obligationOpen ? "rotate-180" : ""}`} />
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton type="button" tooltip={t(key)} className={className}>
                  <Icon />
                  <span>{t(key)}</span>
                </SidebarMenuButton>
              )}
              {isObligation && obligationOpen ? (
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton render={<Link href="/obligations" aria-current={pathname === "/obligations" ? "page" : undefined} />} isActive={pathname === "/obligations"}>
                      <span>{t("obligationList")}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton render={<Link href="/obligations/new" aria-current={pathname === "/obligations/new" ? "page" : undefined} />} isActive={pathname === "/obligations/new"}>
                      <span>{t("addObligation")}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton render={<Link href="/obligations/settings" aria-current={pathname === "/obligations/settings" ? "page" : undefined} />} isActive={pathname === "/obligations/settings"}>
                      <span>{t("obligationSettings")}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton render={<Link href="/obligations/compare" aria-current={pathname === "/obligations/compare" ? "page" : undefined} />} isActive={pathname === "/obligations/compare"}>
                      <span>{t("compareObligations")}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton render={<Link href="/obligations/export-import" aria-current={pathname === "/obligations/export-import" ? "page" : undefined} />} isActive={pathname === "/obligations/export-import"}>
                      <span>{t("exportImportObligations")}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              ) : null}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </nav>
  );
}