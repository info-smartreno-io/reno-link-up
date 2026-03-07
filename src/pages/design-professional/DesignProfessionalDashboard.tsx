import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, User, Images, Briefcase, MessageSquare, AlertCircle } from "lucide-react";
import { useDesignProfessionalProfile } from "@/hooks/useDesignProfessionalProfile";
import { useQuery } from "@tanstack/react-query";

export default function DesignProfessionalDashboard() {
  const navigate = useNavigate();
  const { profile, isLoading: profileLoading } = useDesignProfessionalProfile();

  const { data: portfolioCount } = useQuery({
    queryKey: ["dp-portfolio-count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      const { count } = await supabase
        .from("design_professional_portfolio_items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      return count || 0;
    },
  });

  const { data: matchCount } = useQuery({
    queryKey: ["dp-match-count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      const { count } = await supabase
        .from("design_professional_matches")
        .select("*", { count: "exact", head: true })
        .eq("design_professional_user_id", user.id)
        .eq("status", "suggested");
      return count || 0;
    },
  });

  const completion = profile?.profile_completion_percent || 0;

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back{profile?.headline ? `, ${profile.headline.split(" ")[0]}` : ""}</h1>
        <p className="text-muted-foreground">Your Design Professional Portal overview</p>
      </div>

      {/* Profile Completion */}
      {completion < 80 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              <span className="font-medium">Complete your profile to get matched with projects</span>
            </div>
            <Progress value={completion} className="h-2 mb-2" />
            <p className="text-sm text-muted-foreground">{completion}% complete</p>
            <Button size="sm" className="mt-2" onClick={() => navigate("/design-professional/profile")}>
              Complete Profile
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/design-professional/profile")}>
          <CardContent className="p-4 text-center">
            <User className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{completion}%</p>
            <p className="text-xs text-muted-foreground">Profile Complete</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/design-professional/portfolio")}>
          <CardContent className="p-4 text-center">
            <Images className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{portfolioCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">Portfolio Items</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/design-professional/opportunities")}>
          <CardContent className="p-4 text-center">
            <Briefcase className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{matchCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">Open Opportunities</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/design-professional/messages")}>
          <CardContent className="p-4 text-center">
            <MessageSquare className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">Unread Messages</p>
          </CardContent>
        </Card>
      </div>

      {/* Status */}
      {profile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Application Status</span>
              <Badge variant={profile.application_status === "approved" ? "default" : "secondary"}>
                {profile.application_status || "Pending"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Accepting New Projects</span>
              <Badge variant={profile.accepting_new_projects ? "default" : "outline"}>
                {profile.accepting_new_projects ? "Yes" : "No"}
              </Badge>
            </div>
            {profile.specialties && profile.specialties.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground">Specialties</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.specialties.map((s: string) => (
                    <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!profile && (
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Set Up Your Profile</h3>
            <p className="text-muted-foreground mb-4">
              Create your design professional profile to start receiving project matches.
            </p>
            <Button onClick={() => navigate("/design-professional/profile")}>
              Get Started
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
