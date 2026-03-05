import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export function FooterAdminLogin() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<string>("");
  const navigate = useNavigate();

  function goToLogin() {
    const q = role ? `?role=${encodeURIComponent(role)}` : "";
    navigate(`/login${q}`);
    setOpen(false);
  }

  function goToAdminAuth() {
    navigate('/admin/auth');
  }

  return (
    <footer className="w-full border-t bg-muted/30 py-8 mt-12">
      <div className="container mx-auto flex flex-col items-center justify-center space-y-4">
        <div className="flex gap-3">
          <Button
            variant="default"
            className="rounded-full shadow-sm hover:shadow-md transition-all"
            onClick={() => setOpen(true)}
          >
            SmartReno Team Login
          </Button>
          <Button
            variant="outline"
            className="rounded-full shadow-sm hover:shadow-md transition-all"
            onClick={goToAdminAuth}
          >
            Admin Login
          </Button>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>SmartReno Team Login</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <Select onValueChange={setRole} value={role}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="estimator">Estimator</SelectItem>
                  <SelectItem value="project_coordinator">Project Coordinator</SelectItem>
                  <SelectItem value="client_success_manager">Client Success Manager</SelectItem>
                  <SelectItem value="call_center_rep">Call Center Rep</SelectItem>
                </SelectContent>
              </Select>

              <Input type="email" placeholder="Email address" />
              <Input type="password" placeholder="Password" />

              <Button className="w-full mt-2" onClick={goToLogin} disabled={!role}>
                Continue to Login {role ? `(${role.replace(/_/g, " ")})` : ""}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </footer>
  );
}
