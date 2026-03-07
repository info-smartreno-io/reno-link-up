import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { SiteNavbar } from "@/components/SiteNavbar";
import { FooterAdminLogin } from "@/components/FooterAdminLogin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckCircle2, CalendarIcon, User, Clock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const TIME_SLOTS = [
  { value: "9-11", label: "9:00 AM – 11:00 AM" },
  { value: "11-1", label: "11:00 AM – 1:00 PM" },
  { value: "2-4", label: "2:00 PM – 4:00 PM" },
  { value: "4-6", label: "4:00 PM – 6:00 PM" },
];

const AVAILABLE_DAYS = [1, 3, 5]; // Mon, Wed, Fri

export default function IntakeConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { projectId, projectType } = (location.state as any) || {};

  const [phase, setPhase] = useState<"confirmation" | "profile" | "schedule" | "done">("confirmation");
  const [user, setUser] = useState<any>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);

  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    homeowner_status: "",
    has_renovated_before: "",
    preferred_communication: "",
    project_timeline: "",
  });

  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
          if (data) {
            setProfile((prev) => ({
              ...prev,
              full_name: data.full_name || "",
              phone: data.phone || "",
              homeowner_status: (data as any).homeowner_status || "",
            }));
          }
        });
      }
    });
  }, []);

  const handleProfileSave = async () => {
    if (!user) {
      toast.error("Please log in first");
      navigate("/signup");
      return;
    }
    setProfileSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          homeowner_status: profile.homeowner_status,
          has_renovated_before: profile.has_renovated_before === "yes",
          preferred_communication: profile.preferred_communication,
          project_timeline: profile.project_timeline,
          profile_completed: true,
        } as any)
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profile completed!");
      setPhase("schedule");
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSchedule = async () => {
    if (!user || !selectedDate || !selectedTime) return;
    setScheduleSaving(true);
    try {
      const { error } = await supabase
        .from("site_visit_appointments")
        .insert({
          homeowner_id: user.id,
          project_id: projectId || null,
          appointment_date: format(selectedDate, "yyyy-MM-dd"),
          appointment_time: selectedTime,
          status: "scheduled",
        } as any);

      if (error) throw error;
      toast.success("Site visit scheduled!");
      setPhase("done");
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule appointment");
    } finally {
      setScheduleSaving(false);
    }
  };

  const isAvailableDay = (date: Date) => {
    const day = date.getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return AVAILABLE_DAYS.includes(day) && date >= today;
  };

  return (
    <main className="min-h-screen bg-background">
      <Helmet>
        <title>Project Submitted – SmartReno</title>
        <meta name="description" content="Your renovation project has been submitted to SmartReno." />
      </Helmet>
      <SiteNavbar />

      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          {/* Confirmation */}
          {phase === "confirmation" && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10">
                <CheckCircle2 className="h-8 w-8 text-accent" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Your project has been submitted!
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                {projectType && <span className="font-medium text-foreground">{projectType}</span>}
                {" "}— We're reviewing your details. Here's what happens next:
              </p>

              <Card className="text-left">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Complete your profile</p>
                      <p className="text-xs text-muted-foreground">Help us understand you better</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Schedule a site visit</p>
                      <p className="text-xs text-muted-foreground">A SmartReno construction agent will visit your property</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-muted-foreground">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Receive contractor bids</p>
                      <p className="text-xs text-muted-foreground">We'll match you with vetted local contractors</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button size="lg" onClick={() => user ? setPhase("profile") : navigate("/signup")}>
                {user ? "Continue to Complete Profile" : "Create Account to Continue"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Profile Completion */}
          {phase === "profile" && (
            <Card>
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Complete Your Profile</h2>
                    <p className="text-sm text-muted-foreground">Required before scheduling a site visit</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Phone Number *</Label>
                    <Input
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="(201) 555-0123"
                      type="tel"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Are you the homeowner?</Label>
                    <RadioGroup value={profile.homeowner_status} onValueChange={(v) => setProfile({ ...profile, homeowner_status: v })}>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value="owner" />
                        <span className="text-sm">Yes, I'm the owner</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value="buyer" />
                        <span className="text-sm">I'm buying this property</span>
                      </label>
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label>Have you renovated before?</Label>
                    <RadioGroup value={profile.has_renovated_before} onValueChange={(v) => setProfile({ ...profile, has_renovated_before: v })}>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value="yes" />
                        <span className="text-sm">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value="no" />
                        <span className="text-sm">No, this is my first renovation</span>
                      </label>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>Preferred communication method</Label>
                    <Select value={profile.preferred_communication} onValueChange={(v) => setProfile({ ...profile, preferred_communication: v })}>
                      <SelectTrigger><SelectValue placeholder="Select preference" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phone">Phone Call</SelectItem>
                        <SelectItem value="text">Text Message</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>When would you like to start?</Label>
                    <Select value={profile.project_timeline} onValueChange={(v) => setProfile({ ...profile, project_timeline: v })}>
                      <SelectTrigger><SelectValue placeholder="Select timeline" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asap">As soon as possible</SelectItem>
                        <SelectItem value="1-3_months">1–3 months</SelectItem>
                        <SelectItem value="3-6_months">3–6 months</SelectItem>
                        <SelectItem value="planning">Just planning / exploring</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setPhase("confirmation")}>Back</Button>
                  <Button
                    className="flex-1"
                    onClick={handleProfileSave}
                    disabled={profileSaving || !profile.full_name || !profile.phone}
                  >
                    {profileSaving ? "Saving..." : "Save & Continue to Scheduling"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Schedule Site Visit */}
          {phase === "schedule" && (
            <Card>
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Schedule a Site Visit</h2>
                    <p className="text-sm text-muted-foreground">A SmartReno construction agent will visit your property</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select a date</Label>
                    <div className="flex justify-center">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => !isAvailableDay(date)}
                        className={cn("p-3 pointer-events-auto rounded-lg border")}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">Available Monday, Wednesday, Friday</p>
                  </div>

                  {selectedDate && (
                    <div className="space-y-2">
                      <Label>Select a time slot</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {TIME_SLOTS.map((slot) => (
                          <button
                            key={slot.value}
                            onClick={() => setSelectedTime(slot.value)}
                            className={cn(
                              "flex items-center gap-2 border rounded-lg p-3 text-sm transition-colors text-left",
                              selectedTime === slot.value
                                ? "border-primary bg-primary/5 text-foreground"
                                : "border-border hover:border-muted-foreground/30 text-foreground"
                            )}
                          >
                            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setPhase("profile")}>Back</Button>
                  <Button
                    className="flex-1"
                    onClick={handleSchedule}
                    disabled={scheduleSaving || !selectedDate || !selectedTime}
                  >
                    {scheduleSaving ? "Scheduling..." : "Confirm Appointment"}
                    <CheckCircle2 className="h-4 w-4 ml-2" />
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={() => navigate("/homeowner/dashboard")}
                >
                  Skip — I'll schedule later
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Done */}
          {phase === "done" && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10">
                <CheckCircle2 className="h-8 w-8 text-accent" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">You're all set!</h1>
              <p className="text-muted-foreground">
                Your site visit is scheduled for{" "}
                <span className="font-medium text-foreground">
                  {selectedDate && format(selectedDate, "EEEE, MMMM d")}
                </span>
                {" "}at{" "}
                <span className="font-medium text-foreground">
                  {TIME_SLOTS.find(s => s.value === selectedTime)?.label}
                </span>
              </p>
              <Button size="lg" onClick={() => navigate("/homeowner/dashboard")}>
                Go to Dashboard <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </section>
      <FooterAdminLogin />
    </main>
  );
}
