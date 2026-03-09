import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, ExternalLink, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TEST_PORTALS = [
  { label: "Test Estimator", path: "/estimator/dashboard", email: "test-estimator@smartreno.io", active: true },
  { label: "Test Contractor", path: "/contractor/dashboard", email: "test-contractor@smartreno.io", active: true },
  { label: "Test Homeowner", path: "/homeowner/dashboard", email: "test-homeowner@smartreno.io", active: true },
  { label: "Test Design Pro", path: "/design-professional/dashboard", email: "test-designpro@smartreno.io", active: true },
];

export function TestPortalSwitcher() {
  const { toast } = useToast();

  const copyCredentials = (email: string) => {
    navigator.clipboard.writeText(`${email} / Smart2025!!`);
    toast({ title: "Copied", description: "Credentials copied to clipboard" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8" title="QA Test Portal Switcher">
          <FlaskConical className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <span>Test Portal Switcher</span>
          <Badge variant="outline" className="text-[10px] border-destructive text-destructive">QA</Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {TEST_PORTALS.map((portal) => (
          <DropdownMenuItem
            key={portal.label}
            disabled={!portal.active}
            className="flex items-center justify-between gap-2 cursor-pointer"
            onClick={() => {
              if (portal.active) {
                window.open(portal.path, "_blank", "noopener,noreferrer");
              }
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{portal.label}</span>
              {!portal.active && (
                <Badge variant="secondary" className="text-[10px]">pending</Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                copyCredentials(portal.email);
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => window.open("/admin/test-accounts", "_self")}
        >
          Manage Test Accounts →
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
