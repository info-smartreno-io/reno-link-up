import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, X, Users, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const scheduleSchema = z.object({
  project_name: z.string()
    .trim()
    .min(1, "Project name is required")
    .max(200, "Project name must be less than 200 characters"),
  project_id: z.string().optional(),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  phases: z.array(z.object({
    name: z.string().min(1, "Phase name required"),
    color: z.string(),
  })).optional(),
}).refine((data) => {
  if (data.end_date) {
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    return end >= start;
  }
  return true;
}, {
  message: "End date must be after or equal to start date",
  path: ["end_date"],
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

interface CreateScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (schedule: ScheduleFormData & { shared_with_homeowners: string[] }) => void;
  editSchedule?: any;
}

const DEFAULT_PHASES = [
  { name: "Demolition", color: "bg-red-600" },
  { name: "Foundation", color: "bg-orange-600" },
  { name: "Framing", color: "bg-purple-600" },
  { name: "Rough-In", color: "bg-blue-600" },
  { name: "Insulation", color: "bg-green-600" },
  { name: "Drywall", color: "bg-yellow-600" },
  { name: "Finishing", color: "bg-pink-600" },
  { name: "Flooring", color: "bg-indigo-600" },
  { name: "Cabinets & Countertops", color: "bg-teal-600" },
  { name: "Final Inspection", color: "bg-gray-600" },
];

const COLOR_OPTIONS = [
  { name: "Red", value: "bg-red-600" },
  { name: "Orange", value: "bg-orange-600" },
  { name: "Purple", value: "bg-purple-600" },
  { name: "Blue", value: "bg-blue-600" },
  { name: "Green", value: "bg-green-600" },
  { name: "Yellow", value: "bg-yellow-600" },
  { name: "Pink", value: "bg-pink-600" },
  { name: "Indigo", value: "bg-indigo-600" },
  { name: "Teal", value: "bg-teal-600" },
  { name: "Gray", value: "bg-gray-600" },
];

export default function CreateScheduleDialog({
  open,
  onOpenChange,
  onSave,
  editSchedule,
}: CreateScheduleDialogProps) {
  const [selectedPhases, setSelectedPhases] = useState<typeof DEFAULT_PHASES>(
    editSchedule?.phases || []
  );
  const [selectedHomeowners, setSelectedHomeowners] = useState<string[]>(
    editSchedule?.shared_with_homeowners || []
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: editSchedule || {
      project_name: "",
      project_id: "",
      description: "",
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
      phases: [],
    },
  });

  // Fetch homeowners from profiles
  const { data: homeowners = [] } = useQuery({
    queryKey: ["homeowners"],
    queryFn: async () => {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "homeowner");

      if (!userRoles || userRoles.length === 0) return [];

      const homeownerIds = userRoles.map(ur => ur.user_id);

      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", homeownerIds);

      if (error) throw error;
      return profiles || [];
    },
  });

  const onSubmit = (data: ScheduleFormData) => {
    onSave({
      ...data,
      phases: selectedPhases,
      shared_with_homeowners: selectedHomeowners,
    });
    reset();
    setSelectedPhases([]);
    setSelectedHomeowners([]);
  };

  const handleClose = () => {
    reset();
    setSelectedPhases([]);
    setSelectedHomeowners([]);
    onOpenChange(false);
  };

  const togglePhase = (phase: typeof DEFAULT_PHASES[0]) => {
    setSelectedPhases(prev =>
      prev.find(p => p.name === phase.name)
        ? prev.filter(p => p.name !== phase.name)
        : [...prev, phase]
    );
  };

  const toggleHomeowner = (homeownerId: string) => {
    setSelectedHomeowners(prev =>
      prev.includes(homeownerId)
        ? prev.filter(id => id !== homeownerId)
        : [...prev, homeownerId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editSchedule ? "Edit Project Schedule" : "Create New Project Schedule"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="project_name">Project Name *</Label>
            <Input
              id="project_name"
              {...register("project_name")}
              placeholder="Enter project name"
            />
            {errors.project_name && (
              <p className="text-sm text-destructive">{errors.project_name.message}</p>
            )}
          </div>

          {/* Project ID (optional linking) */}
          <div className="space-y-2">
            <Label htmlFor="project_id">Project ID (Optional)</Label>
            <Input
              id="project_id"
              {...register("project_id")}
              placeholder="Link to existing project"
            />
            <p className="text-xs text-muted-foreground">
              Optional: Link this schedule to an existing project
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Brief description of the project"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                {...register("start_date")}
              />
              {errors.start_date && (
                <p className="text-sm text-destructive">{errors.start_date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Estimated End Date</Label>
              <Input
                id="end_date"
                type="date"
                {...register("end_date")}
              />
              {errors.end_date && (
                <p className="text-sm text-destructive">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          {/* Phase Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Select Project Phases
            </Label>
            <div className="border rounded-md p-4 space-y-2 max-h-60 overflow-y-auto bg-muted/20">
              {DEFAULT_PHASES.map((phase) => (
                <label
                  key={phase.name}
                  className="flex items-center gap-3 p-2 hover:bg-accent/50 rounded cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedPhases.some(p => p.name === phase.name)}
                    onCheckedChange={() => togglePhase(phase)}
                  />
                  <div className={`h-3 w-3 rounded ${phase.color}`} />
                  <span className="text-sm font-medium text-foreground flex-1">
                    {phase.name}
                  </span>
                </label>
              ))}
            </div>
            {selectedPhases.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedPhases.map((phase) => (
                  <Badge key={phase.name} variant="secondary" className="gap-1">
                    <div className={`h-2 w-2 rounded ${phase.color}`} />
                    {phase.name}
                    <button
                      type="button"
                      onClick={() => togglePhase(phase)}
                      className="ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Homeowner Sharing */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Share Schedule with Homeowners
            </Label>
            <p className="text-xs text-muted-foreground">
              Selected homeowners will see this schedule on their portal dashboard
            </p>
            <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto bg-muted/20">
              {homeowners.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No homeowners available
                </p>
              ) : (
                homeowners.map((homeowner: any) => (
                  <label
                    key={homeowner.id}
                    className="flex items-center gap-3 p-2 hover:bg-accent/50 rounded cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={selectedHomeowners.includes(homeowner.id)}
                      onCheckedChange={() => toggleHomeowner(homeowner.id)}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">
                        {homeowner.full_name || "Unknown User"}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
            {selectedHomeowners.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedHomeowners.map((id) => {
                  const homeowner = homeowners.find((h: any) => h.id === id);
                  return homeowner ? (
                    <Badge key={id} variant="secondary">
                      {homeowner.full_name}
                      <button
                        type="button"
                        onClick={() => toggleHomeowner(id)}
                        className="ml-2"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              {editSchedule ? "Update Schedule" : "Create Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
