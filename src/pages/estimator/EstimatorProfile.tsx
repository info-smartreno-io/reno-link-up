import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/BackButton";
import { MapPin, Briefcase, X, Loader2, Save } from "lucide-react";

interface EstimatorProfile {
  id: string;
  user_id: string;
  current_assignments: number;
  max_assignments: number;
  service_zip_codes: string[];
  specializations: string[];
  is_active: boolean;
}

const AVAILABLE_SPECIALIZATIONS = [
  "Kitchen Remodel",
  "Bathroom Renovation",
  "Full Home Renovation",
  "Basement Finishing",
  "Home Addition",
  "Master Suite Addition",
  "Condo Renovation",
];

export default function EstimatorProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<EstimatorProfile | null>(null);
  const [newZipCode, setNewZipCode] = useState("");
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  const [serviceZipCodes, setServiceZipCodes] = useState<string[]>([]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("estimators")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        // If profile doesn't exist, create one
        if (error.code === "PGRST116") {
          const { data: newProfile, error: createError } = await supabase
            .from("estimators")
            .insert({
              user_id: user.id,
              current_assignments: 0,
              max_assignments: 10,
              service_zip_codes: [],
              specializations: [],
              is_active: true,
            })
            .select()
            .single();

          if (createError) throw createError;
          setProfile(newProfile);
          setServiceZipCodes([]);
          setSelectedSpecializations([]);
        } else {
          throw error;
        }
      } else {
        setProfile(data);
        setServiceZipCodes(data.service_zip_codes || []);
        setSelectedSpecializations(data.specializations || []);
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddZipCode = () => {
    const zip = newZipCode.trim();
    if (!zip) return;

    if (!/^\d{5}$/.test(zip)) {
      toast({
        title: "Invalid ZIP Code",
        description: "Please enter a valid 5-digit ZIP code.",
        variant: "destructive",
      });
      return;
    }

    if (serviceZipCodes.includes(zip)) {
      toast({
        title: "Duplicate ZIP Code",
        description: "This ZIP code is already in your service areas.",
        variant: "destructive",
      });
      return;
    }

    setServiceZipCodes([...serviceZipCodes, zip]);
    setNewZipCode("");
  };

  const handleRemoveZipCode = (zip: string) => {
    setServiceZipCodes(serviceZipCodes.filter(z => z !== zip));
  };

  const handleToggleSpecialization = (spec: string) => {
    if (selectedSpecializations.includes(spec)) {
      setSelectedSpecializations(selectedSpecializations.filter(s => s !== spec));
    } else {
      setSelectedSpecializations([...selectedSpecializations, spec]);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("estimators")
        .update({
          service_zip_codes: serviceZipCodes,
          specializations: selectedSpecializations,
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your profile has been updated.",
      });

      fetchProfile();
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="border-b bg-background">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <BackButton />
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Estimator Profile</h1>
          <p className="text-muted-foreground">Manage your service areas and specializations</p>
        </div>

        {profile && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Workload</CardTitle>
                <CardDescription>Your active assignments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-primary">
                    {profile.current_assignments}
                  </div>
                  <div className="text-muted-foreground">
                    / {profile.max_assignments} max assignments
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Service Areas (ZIP Codes)
                </CardTitle>
                <CardDescription>
                  Add ZIP codes where you can accept leads. Leave empty to service all areas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter ZIP code (e.g., 07024)"
                    value={newZipCode}
                    onChange={(e) => setNewZipCode(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddZipCode()}
                    maxLength={5}
                  />
                  <Button onClick={handleAddZipCode}>Add</Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {serviceZipCodes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No ZIP codes added - you'll receive leads from all areas
                    </p>
                  ) : (
                    serviceZipCodes.map((zip) => (
                      <Badge key={zip} variant="secondary" className="gap-2 px-3 py-1">
                        {zip}
                        <button
                          onClick={() => handleRemoveZipCode(zip)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Specializations
                </CardTitle>
                <CardDescription>
                  Select project types you specialize in. Leave empty to accept all project types.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {AVAILABLE_SPECIALIZATIONS.map((spec) => (
                    <label
                      key={spec}
                      className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSpecializations.includes(spec)}
                        onChange={() => handleToggleSpecialization(spec)}
                        className="h-4 w-4"
                      />
                      <span>{spec}</span>
                    </label>
                  ))}
                </div>
                {selectedSpecializations.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-3">
                    No specializations selected - you'll receive all project types
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2"
                size="lg"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
