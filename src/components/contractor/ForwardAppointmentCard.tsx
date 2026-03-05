import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserCog, Users } from "lucide-react";

type TeamMember = {
  id: string;
  name: string;
  role: "foreman" | "subcontractor";
  companyName?: string;
};

interface ForwardAppointmentCardProps {
  appointment: any;
  projectId: string;
  onForward?: () => void;
}

export function ForwardAppointmentCard({
  appointment,
  projectId,
  onForward,
}: ForwardAppointmentCardProps) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [pmNote, setPmNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchTeamMembers();
  }, [projectId]);

  const fetchTeamMembers = async () => {
    try {
      // Fetch contractor users with foreman role
      const { data: foremen } = await supabase
        .from("contractor_users")
        .select(`
          user_id,
          profiles!inner(full_name)
        `)
        .eq("role", "foreman")
        .eq("is_active", true);

      // Fetch vendors/subcontractors
      const { data: vendors } = await supabase
        .from("vendor_performance" as any)
        .select(`
          vendor_id,
          vendors!inner(company_name, contact_name)
        `);

      const members: TeamMember[] = [];

      foremen?.forEach((f: any) => {
        members.push({
          id: f.user_id,
          name: f.profiles?.full_name || "Unknown",
          role: "foreman",
        });
      });

      vendors?.forEach((v: any) => {
        members.push({
          id: v.vendor_id,
          name: v.vendors?.contact_name || "Unknown",
          role: "subcontractor",
          companyName: v.vendors?.company_name,
        });
      });

      setTeamMembers(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  const handleForward = async () => {
    if (!selectedId) {
      toast({
        variant: "destructive",
        title: "Select a team member",
        description: "Please select a foreman or subcontractor first.",
      });
      return;
    }

    const selected = teamMembers.find((m) => m.id === selectedId);
    if (!selected) return;

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { error } = await supabase.functions.invoke('appointments-forward', {
        body: {
          appointment_id: appointment.id,
          forwarded_to_user_id: selected.id,
          forwarded_to_role: selected.role,
          pm_note: pmNote || null,
        },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : undefined,
      });

      if (error) throw error;

      toast({
        title: "Request forwarded",
        description: `Time request sent to ${selected.name} for confirmation.`,
      });

      onForward?.();
    } catch (error: any) {
      console.error("Error forwarding appointment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to forward request",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-card">
      <div className="flex items-start gap-3">
        <UserCog className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div className="flex-1 space-y-3">
          <div className="text-sm font-medium text-foreground">
            Forward to foreman or subcontractor for confirmation
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-member">Select Team Member</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger id="team-member">
                <SelectValue placeholder="Select foreman or subcontractor" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>
                        {member.name}
                        {member.companyName && ` – ${member.companyName}`}
                        {" "}
                        <span className="text-muted-foreground">({member.role})</span>
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pm-note">Note (optional)</Label>
            <Textarea
              id="pm-note"
              placeholder="Add instructions or context..."
              value={pmNote}
              onChange={(e) => setPmNote(e.target.value)}
              rows={2}
            />
          </div>

          <Button onClick={handleForward} disabled={loading || !selectedId} className="w-full">
            {loading ? "Sending..." : "Send for Confirmation"}
          </Button>
        </div>
      </div>
    </div>
  );
}
