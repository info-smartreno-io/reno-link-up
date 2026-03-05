import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, UserPlus, Mail, Search, User, Send } from "lucide-react";

interface AssignHomeownerDialogProps {
  projectId: string;
  projectName: string;
  onAssignmentComplete?: () => void;
}

interface Homeowner {
  id: string;
  email: string;
  full_name: string | null;
}

export default function AssignHomeownerDialog({ 
  projectId, 
  projectName, 
  onAssignmentComplete 
}: AssignHomeownerDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<Homeowner[]>([]);
  const [searching, setSearching] = useState(false);
  const [assignedHomeowners, setAssignedHomeowners] = useState<Homeowner[]>([]);
  const [sendingInvite, setSendingInvite] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchAssignedHomeowners();
    }
  }, [open, projectId]);

  const fetchAssignedHomeowners = async () => {
    try {
      const { data, error } = await supabase
        .from("homeowner_projects")
        .select("homeowner_id")
        .eq("project_id", projectId);

      if (error) throw error;

      const homeownerIds = data?.map((hp: any) => hp.homeowner_id) || [];
      if (homeownerIds.length > 0) {
        const { data: profilesData, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", homeownerIds);

        if (profileError) throw profileError;

        const assignedUsers: Homeowner[] = (profilesData || []).map((profile: any) => ({
          id: profile.id,
          email: profile.email || "",
          full_name: profile.full_name,
        }));
        setAssignedHomeowners(assignedUsers);
      } else {
        setAssignedHomeowners([]);
      }
    } catch (error) {
      console.error("Error fetching assigned homeowners:", error);
    }
  };

  const sendInvitationEmail = async (homeownerId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('send-homeowner-invitation', {
        body: {
          homeowner_id: homeownerId,
          project_id: projectId,
          project_name: projectName,
        }
      });

      if (error) {
        console.error("Invitation email error:", error);
        return false;
      }

      console.log("Invitation sent:", data);
      return true;
    } catch (error) {
      console.error("Error sending invitation:", error);
      return false;
    }
  };

  const handleResendInvitation = async (homeownerId: string) => {
    setSendingInvite(homeownerId);
    const success = await sendInvitationEmail(homeownerId);
    if (success) {
      toast.success("Invitation email sent!");
    } else {
      toast.error("Failed to send invitation email");
    }
    setSendingInvite(null);
  };

  const searchHomeowners = async () => {
    if (!searchEmail.trim()) {
      toast.error("Please enter a name to search");
      return;
    }

    setSearching(true);
    try {
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "homeowner");

      if (roleError) throw roleError;

      const homeownerIds = roleData?.map(r => r.user_id) || [];

      if (homeownerIds.length === 0) {
        setSearchResults([]);
        toast.info("No homeowners found");
        return;
      }

      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", homeownerIds);

      if (profileError) throw profileError;

      const results: Homeowner[] = (profiles || [])
        .filter((p: any) => 
          p.full_name?.toLowerCase().includes(searchEmail.toLowerCase()) ||
          p.email?.toLowerCase().includes(searchEmail.toLowerCase()) ||
          p.id.includes(searchEmail)
        )
        .map((p: any) => ({
          id: p.id,
          email: p.email || "",
          full_name: p.full_name,
        }))
        .slice(0, 5);

      setSearchResults(results);

      if (results.length === 0) {
        toast.info("No homeowners found matching that name");
      }
    } catch (error: any) {
      console.error("Error searching homeowners:", error);
      toast.error(error.message || "Failed to search for homeowners");
    } finally {
      setSearching(false);
    }
  };

  const assignHomeowner = async (homeownerId: string) => {
    setLoading(true);
    try {
      // Check if already assigned
      const { data: existing } = await supabase
        .from("homeowner_projects")
        .select("id")
        .eq("homeowner_id", homeownerId)
        .eq("project_id", projectId)
        .maybeSingle();

      if (existing) {
        toast.info("This homeowner is already assigned to this project");
        return;
      }

      // Insert the assignment
      const { error } = await supabase
        .from("homeowner_projects")
        .insert({
          homeowner_id: homeownerId,
          project_id: projectId,
        });

      if (error) throw error;

      // Send invitation email after successful assignment
      const emailSent = await sendInvitationEmail(homeownerId);
      
      if (emailSent) {
        toast.success("Homeowner assigned and invitation email sent!");
      } else {
        toast.success("Homeowner assigned (invitation email could not be sent)");
      }

      setSearchEmail("");
      setSearchResults([]);
      fetchAssignedHomeowners();
      onAssignmentComplete?.();
    } catch (error: any) {
      console.error("Error assigning homeowner:", error);
      toast.error(error.message || "Failed to assign homeowner");
    } finally {
      setLoading(false);
    }
  };

  const unassignHomeowner = async (homeownerId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("homeowner_projects")
        .delete()
        .eq("homeowner_id", homeownerId)
        .eq("project_id", projectId);

      if (error) throw error;

      toast.success("Homeowner removed from project");
      fetchAssignedHomeowners();
      onAssignmentComplete?.();
    } catch (error: any) {
      console.error("Error unassigning homeowner:", error);
      toast.error(error.message || "Failed to remove homeowner");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Assign Homeowner
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Homeowner to Project</DialogTitle>
          <DialogDescription>
            Link a homeowner to {projectName} so they can view it in their portal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Currently Assigned Homeowners */}
          {assignedHomeowners.length > 0 && (
            <div className="space-y-3">
              <Label>Currently Assigned</Label>
              <div className="space-y-2">
                {assignedHomeowners.map((homeowner) => (
                  <div
                    key={homeowner.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {homeowner.full_name || homeowner.id.substring(0, 8)}
                        </p>
                        {homeowner.email && (
                          <p className="text-xs text-muted-foreground">{homeowner.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResendInvitation(homeowner.id)}
                        disabled={loading || sendingInvite === homeowner.id}
                        title="Resend invitation email"
                      >
                        {sendingInvite === homeowner.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-1" />
                            Invite
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => unassignHomeowner(homeowner.id)}
                        disabled={loading}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search for Homeowners */}
          <div className="space-y-3">
            <Label htmlFor="search-email">Search Homeowner by Name</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-email"
                  type="text"
                  placeholder="Search by name..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchHomeowners()}
                  className="pl-10"
                  disabled={searching}
                />
              </div>
              <Button onClick={searchHomeowners} disabled={searching || !searchEmail.trim()}>
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-3">
              <Label>Search Results</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((homeowner) => (
                  <div
                    key={homeowner.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {homeowner.full_name || "Unknown"}
                        </p>
                        {homeowner.email && (
                          <p className="text-xs text-muted-foreground">{homeowner.email}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => assignHomeowner(homeowner.id)}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Assign"
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
