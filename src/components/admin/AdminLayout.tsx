import { ReactNode } from "react";
import { AdminSideNav } from "@/components/AdminSideNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useLogout } from "@/hooks/useLogout";
import type { NavRole } from "@/config/adminSidebar";

interface AdminLayoutProps {
  children: ReactNode;
  topOffsetPx?: number;
  widthPx?: number;
  collapsedWidthPx?: number;
  role?: NavRole;
}

export function AdminLayout({
  children,
  topOffsetPx = 56,
  widthPx = 240,
  collapsedWidthPx = 56,
  role = "admin",
}: AdminLayoutProps) {
  const { logout } = useLogout("/admin/auth");

  return (
    <>
      <AdminSideNav
        topOffsetPx={topOffsetPx}
        widthPx={widthPx}
        collapsedWidthPx={collapsedWidthPx}
        role={role}
      />
      <main className="md:ml-60 min-h-screen">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <BackButton />
              <Breadcrumbs />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="hidden md:inline-flex"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </Button>
          </div>
          {children}
        </div>
      </main>
    </>
  );
}
