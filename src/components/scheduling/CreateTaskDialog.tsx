import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, X, Users } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const taskSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Task name is required")
    .max(200, "Task name must be less than 200 characters"),
  phase: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  workdays: z.number().min(0, "Workdays must be positive").max(365, "Workdays must be less than 365"),
  status: z.enum(["pending", "in_progress", "completed", "on_hold"]),
  color: z.string().min(1, "Color is required"),
  predecessors: z.string().max(100, "Predecessors must be less than 100 characters").optional(),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  assignedResources: z.array(z.string()).optional(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: "End date must be after or equal to start date",
  path: ["endDate"],
});

type TaskFormData = z.infer<typeof taskSchema>;

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleId?: string;
  existingTasks?: Array<{ id: string; name: string }>;
  editTask?: TaskFormData & { id?: string; phase_id?: string };
  onSave: (task: TaskFormData & { phase_id?: string }) => void;
}

const PHASE_OPTIONS = [
  "Demolition",
  "Foundation",
  "Framing",
  "Rough-In",
  "Insulation",
  "Drywall",
  "Finishing",
  "Flooring",
  "Cabinets & Countertops",
  "Fixtures & Appliances",
  "Final Inspection",
];

const COLOR_OPTIONS = [
  { name: "Orange", value: "bg-orange-500" },
  { name: "Green", value: "bg-green-600" },
  { name: "Blue", value: "bg-blue-600" },
  { name: "Purple", value: "bg-purple-600" },
  { name: "Red", value: "bg-red-600" },
  { name: "Yellow", value: "bg-yellow-600" },
  { name: "Pink", value: "bg-pink-600" },
  { name: "Indigo", value: "bg-indigo-600" },
  { name: "Teal", value: "bg-teal-600" },
  { name: "Gray", value: "bg-gray-600" },
];

const MOCK_RESOURCES = [
  { id: "1", name: "John Smith", role: "Project Manager" },
  { id: "2", name: "Mike Johnson", role: "Foreman" },
  { id: "3", name: "Sarah Davis", role: "Carpenter" },
  { id: "4", name: "Tom Wilson", role: "Electrician" },
  { id: "5", name: "Lisa Brown", role: "Plumber" },
];

export default function CreateTaskDialog({
  open,
  onOpenChange,
  scheduleId,
  existingTasks = [],
  editTask,
  onSave,
}: CreateTaskDialogProps) {
  const [selectedResources, setSelectedResources] = useState<string[]>(
    editTask?.assignedResources || []
  );
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>(
    editTask?.phase_id || "none"
  );

  // Fetch resources from database
  const { data: resources = [] } = useQuery({
    queryKey: ["schedule-resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_resources")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch phases for this schedule
  const { data: phases = [] } = useQuery({
    queryKey: ["schedule-phases", scheduleId],
    queryFn: async () => {
      if (!scheduleId) return [];
      
      const { data, error } = await supabase
        .from("schedule_phases")
        .select("*")
        .eq("schedule_id", scheduleId)
        .order("sort_order");
      
      if (error) throw error;
      return data;
    },
    enabled: !!scheduleId,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: editTask || {
      name: "",
      phase: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      workdays: 1,
      status: "pending",
      color: "bg-blue-600",
      predecessors: "",
      description: "",
      assignedResources: [],
    },
  });

  const selectedColor = watch("color");
  const selectedPhase = watch("phase");
  const selectedStatus = watch("status");

  const onSubmit = (data: TaskFormData) => {
    const taskData = {
      ...data,
      assignedResources: selectedResources,
      phase_id: selectedPhaseId === "none" ? undefined : selectedPhaseId,
    };
    
    onSave(taskData);
    reset();
    setSelectedResources([]);
    setSelectedPhaseId("none");
  };

  const handleClose = () => {
    reset();
    setSelectedResources([]);
    setSelectedPhaseId(undefined);
    onOpenChange(false);
  };

  const toggleResource = (resourceId: string) => {
    setSelectedResources(prev =>
      prev.includes(resourceId)
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editTask ? "Edit Task" : "Create New Task"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Task Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Task Name *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Enter task name"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Phase Selection */}
          <div className="space-y-2">
            <Label htmlFor="phase">Phase</Label>
            <Select value={selectedPhaseId} onValueChange={setSelectedPhaseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select phase (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Phase</SelectItem>
                {phases.map((phase: any) => (
                  <SelectItem key={phase.id} value={phase.id}>
                    {phase.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
              />
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                {...register("endDate")}
              />
              {errors.endDate && (
                <p className="text-sm text-destructive">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Workdays and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workdays">Workdays *</Label>
              <Input
                id="workdays"
                type="number"
                {...register("workdays", { valueAsNumber: true })}
                min="0"
                max="365"
              />
              {errors.workdays && (
                <p className="text-sm text-destructive">{errors.workdays.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={selectedStatus} onValueChange={(value) => setValue("status", value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Predecessors */}
          <div className="space-y-2">
            <Label htmlFor="predecessors">Dependencies (Predecessors)</Label>
            <Input
              id="predecessors"
              {...register("predecessors")}
              placeholder="e.g., 2fs, 4fs+3 (task IDs with finish-to-start relationships)"
            />
            {existingTasks.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {existingTasks.map((task) => (
                  <Badge key={task.id} variant="outline" className="text-xs">
                    #{task.id}: {task.name}
                  </Badge>
                ))}
              </div>
            )}
            {errors.predecessors && (
              <p className="text-sm text-destructive">{errors.predecessors.message}</p>
            )}
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label>Gantt Bar Color *</Label>
            <div className="grid grid-cols-5 gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setValue("color", color.value)}
                  className={`h-10 rounded-md ${color.value} relative transition-all hover:scale-105`}
                >
                  {selectedColor === color.value && (
                    <div className="absolute inset-0 border-4 border-foreground rounded-md" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Resource Assignment */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assigned Resources
            </Label>
            <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto bg-muted/20">
              {resources.map((resource: any) => (
                <label
                  key={resource.id}
                  className="flex items-center gap-3 p-2 hover:bg-accent/50 rounded cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedResources.includes(resource.id)}
                    onChange={() => toggleResource(resource.id)}
                    className="h-4 w-4"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">{resource.name}</div>
                    <div className="text-xs text-muted-foreground">{resource.role}</div>
                  </div>
                </label>
              ))}
            </div>
            {selectedResources.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedResources.map((id) => {
                  const resource = resources.find((r: any) => r.id === id);
                  return resource ? (
                    <Badge key={id} variant="secondary">
                      {resource.name}
                      <button
                        type="button"
                        onClick={() => toggleResource(id)}
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

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Enter task description or notes"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              {editTask ? "Update Task" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
