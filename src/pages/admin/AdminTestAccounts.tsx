import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink, Eye, EyeOff, ShieldAlert, Loader2, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TestAccount {
  id: string;
  displayName: string;
  role: string;
  email: string;
  password: string;
  portalPath: string;
  portalLabel: string;
  status: "active" | "inactive";
  notes?: string;
}

const TEST_ACCOUNTS: TestAccount[] = [
  {
    id: "1",
    displayName: "Test Estimator",
    role: "estimator",
    email: "test-estimator@smartreno.io",
    password: "Smart2025!!",
    portalPath: "/estimator/dashboard",
    portalLabel: "Estimator Portal",
    status: "active",
    notes: "Primary QA estimator account",
  },
  {
    id: "2",
    displayName: "Test Contractor",
    role: "contractor",
    email: "test-contractor@smartreno.io",
    password: "Smart2025!!",
    portalPath: "/contractor/dashboard",
    portalLabel: "Contractor Portal",
    status: "inactive",
    notes: "Pending setup",
  },
  {
    id: "3",
    displayName: "Test Homeowner",
    role: "homeowner",
    email: "test-homeowner@smartreno.io",
    password: "Smart2025!!",
    portalPath: "/homeowner/dashboard",
    portalLabel: "Homeowner Portal",
    status: "inactive",
    notes: "Pending setup",
  },
  {
    id: "4",
    displayName: "Test Design Professional",
    role: "design_professional",
    email: "test-designpro@smartreno.io",
    password: "Smart2025!!",
    portalPath: "/design-professional/dashboard",
    portalLabel: "Design Professional Portal",
    status: "inactive",
    notes: "Pending setup",
  },
];

const ROLE_COLORS: Record<string, string> = {
  estimator: "bg-blue-100 text-blue-800 border-blue-200",
  contractor: "bg-amber-100 text-amber-800 border-amber-200",
  homeowner: "bg-green-100 text-green-800 border-green-200",
  design_professional: "bg-purple-100 text-purple-800 border-purple-200",
  admin: "bg-red-100 text-red-800 border-red-200",
};

export default function AdminTestAccounts() {
  const { toast } = useToast();
  const [revealedPasswords, setRevealedPasswords] = useState<Set<string>>(new Set());

  const togglePassword = (id: string) => {
    setRevealedPasswords(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard` });
  };

  const openPortal = (account: TestAccount) => {
    window.open(account.portalPath, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Test Accounts</h1>
          <p className="text-muted-foreground">Internal QA accounts for portal testing</p>
        </div>
        <Badge variant="outline" className="gap-1.5 border-destructive text-destructive">
          <ShieldAlert className="h-3.5 w-3.5" />
          INTERNAL QA TOOL
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seeded Test Accounts</CardTitle>
          <CardDescription>
            Use these accounts to test portal experiences. Click "Open Portal" to navigate directly, 
            or copy credentials to log in manually.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Password</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TEST_ACCOUNTS.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.displayName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={ROLE_COLORS[account.role] || ""}>
                      {account.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-mono">{account.email}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(account.email, "Email")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-mono">
                        {revealedPasswords.has(account.id) ? account.password : "••••••••••"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => togglePassword(account.id)}
                      >
                        {revealedPasswords.has(account.id) ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(account.password, "Password")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={account.status === "active" ? "default" : "secondary"}>
                      {account.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {account.notes}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => openPortal(account)}
                      disabled={account.status !== "active"}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Portal
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
