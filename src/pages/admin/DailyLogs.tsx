import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function DailyLogs() {
  const [activeTab, setActiveTab] = useState("work");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedProject, setSelectedProject] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch projects
  const { data: projects } = useQuery({
    queryKey: ["contractor-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contractor_projects")
        .select("id, project_name, client_name")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch logs
  const { data: logs, isLoading } = useQuery({
    queryKey: ["daily-logs", selectedProject, selectedDate],
    queryFn: async () => {
      let query = supabase
        .from("daily_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (selectedProject) {
        query = query.eq("project_id", selectedProject);
      }
      if (selectedDate) {
        query = query.eq("log_date", format(selectedDate, "yyyy-MM-dd"));
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Delete log mutation
  const deleteLog = useMutation({
    mutationFn: async (id: string) => {
      const { error} = await supabase
        .from("daily_logs")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-logs"] });
      toast({
        title: "Success",
        description: "Log entry deleted successfully",
      });
    },
  });

  const filteredLogs = logs?.filter((log) => log.log_type === activeTab) || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Daily Logs</h1>
          <p className="text-muted-foreground mt-2">
            Track work, safety, weather, equipment, materials, deliveries, visitors, and project notes
          </p>
        </div>

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label>Project</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Projects</SelectItem>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.project_name} - {project.client_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="work">Work</TabsTrigger>
            <TabsTrigger value="safety">Safety</TabsTrigger>
            <TabsTrigger value="weather">Weather</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="material">Materials</TabsTrigger>
            <TabsTrigger value="delivery">Deliveries</TabsTrigger>
            <TabsTrigger value="visitor">Visitors</TabsTrigger>
            <TabsTrigger value="note">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="work">
            <WorkLogForm 
              projects={projects || []} 
              selectedDate={selectedDate}
              selectedProject={selectedProject}
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ["daily-logs"] })}
            />
            <LogTable logs={filteredLogs} type="work" onDelete={deleteLog.mutate} />
          </TabsContent>

          <TabsContent value="safety">
            <SafetyLogForm 
              projects={projects || []} 
              selectedDate={selectedDate}
              selectedProject={selectedProject}
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ["daily-logs"] })}
            />
            <LogTable logs={filteredLogs} type="safety" onDelete={deleteLog.mutate} />
          </TabsContent>

          <TabsContent value="weather">
            <WeatherLogForm 
              projects={projects || []} 
              selectedDate={selectedDate}
              selectedProject={selectedProject}
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ["daily-logs"] })}
            />
            <LogTable logs={filteredLogs} type="weather" onDelete={deleteLog.mutate} />
          </TabsContent>

          <TabsContent value="equipment">
            <EquipmentLogForm 
              projects={projects || []} 
              selectedDate={selectedDate}
              selectedProject={selectedProject}
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ["daily-logs"] })}
            />
            <LogTable logs={filteredLogs} type="equipment" onDelete={deleteLog.mutate} />
          </TabsContent>

          <TabsContent value="material">
            <MaterialLogForm 
              projects={projects || []} 
              selectedDate={selectedDate}
              selectedProject={selectedProject}
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ["daily-logs"] })}
            />
            <LogTable logs={filteredLogs} type="material" onDelete={deleteLog.mutate} />
          </TabsContent>

          <TabsContent value="delivery">
            <DeliveryLogForm 
              projects={projects || []} 
              selectedDate={selectedDate}
              selectedProject={selectedProject}
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ["daily-logs"] })}
            />
            <LogTable logs={filteredLogs} type="delivery" onDelete={deleteLog.mutate} />
          </TabsContent>

          <TabsContent value="visitor">
            <VisitorLogForm 
              projects={projects || []} 
              selectedDate={selectedDate}
              selectedProject={selectedProject}
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ["daily-logs"] })}
            />
            <LogTable logs={filteredLogs} type="visitor" onDelete={deleteLog.mutate} />
          </TabsContent>

          <TabsContent value="note">
            <NoteLogForm 
              projects={projects || []} 
              selectedDate={selectedDate}
              selectedProject={selectedProject}
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ["daily-logs"] })}
            />
            <LogTable logs={filteredLogs} type="note" onDelete={deleteLog.mutate} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

// Work Log Form
function WorkLogForm({ projects, selectedDate, selectedProject, onSuccess }: any) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    project_id: selectedProject,
    work_description: "",
    hours_worked: "",
    workers_count: "",
    work_cost: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Error", description: "Not authenticated", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("daily_logs").insert({
      ...formData,
      log_type: "work",
      log_date: format(selectedDate, "yyyy-MM-dd"),
      created_by: user.id,
      hours_worked: formData.hours_worked ? parseFloat(formData.hours_worked) : null,
      workers_count: formData.workers_count ? parseInt(formData.workers_count) : null,
      work_cost: formData.work_cost ? parseFloat(formData.work_cost) : null,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Work log created" });
    setFormData({ project_id: selectedProject, work_description: "", hours_worked: "", workers_count: "", work_cost: "", notes: "" });
    onSuccess();
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Add Work Log</CardTitle>
        <CardDescription>Document work performed, hours worked, and cost</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Project *</Label>
              <Select value={formData.project_id} onValueChange={(v) => setFormData({...formData, project_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Work Description *</Label>
              <Textarea value={formData.work_description} onChange={(e) => setFormData({...formData, work_description: e.target.value})} required />
            </div>
            <div>
              <Label>Hours Worked *</Label>
              <Input type="number" step="0.5" value={formData.hours_worked} onChange={(e) => setFormData({...formData, hours_worked: e.target.value})} required />
            </div>
            <div>
              <Label>Workers *</Label>
              <Input type="number" value={formData.workers_count} onChange={(e) => setFormData({...formData, workers_count: e.target.value})} required />
            </div>
            <div>
              <Label>Cost</Label>
              <Input type="number" step="0.01" value={formData.work_cost} onChange={(e) => setFormData({...formData, work_cost: e.target.value})} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
            </div>
          </div>
          <Button type="submit"><Plus className="mr-2 h-4 w-4" />Add Work Log</Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Safety Log Form
function SafetyLogForm({ projects, selectedDate, selectedProject, onSuccess }: any) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    project_id: selectedProject,
    safety_type: "",
    safety_description: "",
    safety_action_taken: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("daily_logs").insert({
      ...formData,
      log_type: "safety",
      log_date: format(selectedDate, "yyyy-MM-dd"),
      created_by: user.id,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Safety log created" });
    setFormData({ project_id: selectedProject, safety_type: "", safety_description: "", safety_action_taken: "", notes: "" });
    onSuccess();
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Add Safety Log</CardTitle>
        <CardDescription>Document safety meetings, violations, warnings, and incidents</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Project *</Label>
              <Select value={formData.project_id} onValueChange={(v) => setFormData({...formData, project_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Safety Type *</Label>
              <Select value={formData.safety_type} onValueChange={(v) => setFormData({...formData, safety_type: v})}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="violation">Violation</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="incident">Incident</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Description *</Label>
              <Textarea value={formData.safety_description} onChange={(e) => setFormData({...formData, safety_description: e.target.value})} required />
            </div>
            <div className="md:col-span-2">
              <Label>Action Taken</Label>
              <Textarea value={formData.safety_action_taken} onChange={(e) => setFormData({...formData, safety_action_taken: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <Label>Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
            </div>
          </div>
          <Button type="submit"><Plus className="mr-2 h-4 w-4" />Add Safety Log</Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Weather Log Form
function WeatherLogForm({ projects, selectedDate, selectedProject, onSuccess }: any) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    project_id: selectedProject,
    weather_condition: "",
    temperature: "",
    weather_delay_hours: "",
    weather_notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("daily_logs").insert({
      ...formData,
      log_type: "weather",
      log_date: format(selectedDate, "yyyy-MM-dd"),
      created_by: user.id,
      temperature: formData.temperature ? parseFloat(formData.temperature) : null,
      weather_delay_hours: formData.weather_delay_hours ? parseFloat(formData.weather_delay_hours) : null,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Weather log created" });
    setFormData({ project_id: selectedProject, weather_condition: "", temperature: "", weather_delay_hours: "", weather_notes: "" });
    onSuccess();
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Add Weather Log</CardTitle>
        <CardDescription>Record weather conditions and delays</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Project *</Label>
              <Select value={formData.project_id} onValueChange={(v) => setFormData({...formData, project_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Condition *</Label>
              <Select value={formData.weather_condition} onValueChange={(v) => setFormData({...formData, weather_condition: v})}>
                <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sunny">Sunny</SelectItem>
                  <SelectItem value="Cloudy">Cloudy</SelectItem>
                  <SelectItem value="Rainy">Rainy</SelectItem>
                  <SelectItem value="Snowy">Snowy</SelectItem>
                  <SelectItem value="Windy">Windy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Temperature (°F)</Label>
              <Input type="number" step="0.1" value={formData.temperature} onChange={(e) => setFormData({...formData, temperature: e.target.value})} />
            </div>
            <div>
              <Label>Delay Hours</Label>
              <Input type="number" step="0.5" value={formData.weather_delay_hours} onChange={(e) => setFormData({...formData, weather_delay_hours: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <Label>Notes</Label>
              <Textarea value={formData.weather_notes} onChange={(e) => setFormData({...formData, weather_notes: e.target.value})} />
            </div>
          </div>
          <Button type="submit"><Plus className="mr-2 h-4 w-4" />Add Weather Log</Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Equipment, Material, Delivery, Visitor, Note forms follow similar pattern...
// (Simplified for brevity - each follows same structure as above)

function EquipmentLogForm({ projects, selectedDate, selectedProject, onSuccess }: any) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ project_id: selectedProject, equipment_name: "", equipment_hours: "", equipment_hourly_rate: "", equipment_operator: "", notes: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("daily_logs").insert({
      ...formData,
      log_type: "equipment",
      log_date: format(selectedDate, "yyyy-MM-dd"),
      created_by: user.id,
      equipment_hours: formData.equipment_hours ? parseFloat(formData.equipment_hours) : null,
      equipment_hourly_rate: formData.equipment_hourly_rate ? parseFloat(formData.equipment_hourly_rate) : null,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Equipment log created" });
    setFormData({ project_id: selectedProject, equipment_name: "", equipment_hours: "", equipment_hourly_rate: "", equipment_operator: "", notes: "" });
    onSuccess();
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Add Equipment Log</CardTitle>
        <CardDescription>Track equipment usage and hours</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Project *</Label>
              <Select value={formData.project_id} onValueChange={(v) => setFormData({...formData, project_id: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Equipment *</Label>
              <Input value={formData.equipment_name} onChange={(e) => setFormData({...formData, equipment_name: e.target.value})} required />
            </div>
            <div>
              <Label>Hours *</Label>
              <Input type="number" step="0.5" value={formData.equipment_hours} onChange={(e) => setFormData({...formData, equipment_hours: e.target.value})} required />
            </div>
            <div>
              <Label>Hourly Rate</Label>
              <Input type="number" step="0.01" value={formData.equipment_hourly_rate} onChange={(e) => setFormData({...formData, equipment_hourly_rate: e.target.value})} />
            </div>
            <div>
              <Label>Operator</Label>
              <Input value={formData.equipment_operator} onChange={(e) => setFormData({...formData, equipment_operator: e.target.value})} />
            </div>
          </div>
          <Button type="submit"><Plus className="mr-2 h-4 w-4" />Add Equipment Log</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function MaterialLogForm({ projects, selectedDate, selectedProject, onSuccess }: any) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ project_id: selectedProject, material_name: "", material_quantity: "", material_unit: "", material_unit_cost: "", material_supplier: "", notes: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("daily_logs").insert({
      ...formData,
      log_type: "material",
      log_date: format(selectedDate, "yyyy-MM-dd"),
      created_by: user.id,
      material_quantity: formData.material_quantity ? parseFloat(formData.material_quantity) : null,
      material_unit_cost: formData.material_unit_cost ? parseFloat(formData.material_unit_cost) : null,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Material log created" });
    setFormData({ project_id: selectedProject, material_name: "", material_quantity: "", material_unit: "", material_unit_cost: "", material_supplier: "", notes: "" });
    onSuccess();
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Add Material Log</CardTitle>
        <CardDescription>Document materials used</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Project *</Label>
              <Select value={formData.project_id} onValueChange={(v) => setFormData({...formData, project_id: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Material *</Label>
              <Input value={formData.material_name} onChange={(e) => setFormData({...formData, material_name: e.target.value})} required />
            </div>
            <div>
              <Label>Quantity *</Label>
              <Input type="number" step="0.01" value={formData.material_quantity} onChange={(e) => setFormData({...formData, material_quantity: e.target.value})} required />
            </div>
            <div>
              <Label>Unit *</Label>
              <Input value={formData.material_unit} onChange={(e) => setFormData({...formData, material_unit: e.target.value})} required />
            </div>
            <div>
              <Label>Unit Cost</Label>
              <Input type="number" step="0.01" value={formData.material_unit_cost} onChange={(e) => setFormData({...formData, material_unit_cost: e.target.value})} />
            </div>
            <div>
              <Label>Supplier</Label>
              <Input value={formData.material_supplier} onChange={(e) => setFormData({...formData, material_supplier: e.target.value})} />
            </div>
          </div>
          <Button type="submit"><Plus className="mr-2 h-4 w-4" />Add Material Log</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function DeliveryLogForm({ projects, selectedDate, selectedProject, onSuccess }: any) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ project_id: selectedProject, delivery_item: "", delivery_quantity: "", delivery_supplier: "", delivery_received_by: "", notes: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("daily_logs").insert({
      ...formData,
      log_type: "delivery",
      log_date: format(selectedDate, "yyyy-MM-dd"),
      created_by: user.id,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Delivery log created" });
    setFormData({ project_id: selectedProject, delivery_item: "", delivery_quantity: "", delivery_supplier: "", delivery_received_by: "", notes: "" });
    onSuccess();
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Add Delivery Log</CardTitle>
        <CardDescription>Record deliveries received</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Project *</Label>
              <Select value={formData.project_id} onValueChange={(v) => setFormData({...formData, project_id: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Item *</Label>
              <Input value={formData.delivery_item} onChange={(e) => setFormData({...formData, delivery_item: e.target.value})} required />
            </div>
            <div>
              <Label>Quantity</Label>
              <Input value={formData.delivery_quantity} onChange={(e) => setFormData({...formData, delivery_quantity: e.target.value})} />
            </div>
            <div>
              <Label>Supplier</Label>
              <Input value={formData.delivery_supplier} onChange={(e) => setFormData({...formData, delivery_supplier: e.target.value})} />
            </div>
            <div>
              <Label>Received By</Label>
              <Input value={formData.delivery_received_by} onChange={(e) => setFormData({...formData, delivery_received_by: e.target.value})} />
            </div>
          </div>
          <Button type="submit"><Plus className="mr-2 h-4 w-4" />Add Delivery Log</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function VisitorLogForm({ projects, selectedDate, selectedProject, onSuccess }: any) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ project_id: selectedProject, visitor_name: "", visitor_company: "", visitor_purpose: "", notes: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("daily_logs").insert({
      ...formData,
      log_type: "visitor",
      log_date: format(selectedDate, "yyyy-MM-dd"),
      created_by: user.id,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Visitor log created" });
    setFormData({ project_id: selectedProject, visitor_name: "", visitor_company: "", visitor_purpose: "", notes: "" });
    onSuccess();
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Add Visitor Log</CardTitle>
        <CardDescription>Track jobsite visitors</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Project *</Label>
              <Select value={formData.project_id} onValueChange={(v) => setFormData({...formData, project_id: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Visitor Name *</Label>
              <Input value={formData.visitor_name} onChange={(e) => setFormData({...formData, visitor_name: e.target.value})} required />
            </div>
            <div>
              <Label>Company</Label>
              <Input value={formData.visitor_company} onChange={(e) => setFormData({...formData, visitor_company: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <Label>Purpose</Label>
              <Textarea value={formData.visitor_purpose} onChange={(e) => setFormData({...formData, visitor_purpose: e.target.value})} />
            </div>
          </div>
          <Button type="submit"><Plus className="mr-2 h-4 w-4" />Add Visitor Log</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function NoteLogForm({ projects, selectedDate, selectedProject, onSuccess }: any) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ project_id: selectedProject, notes: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("daily_logs").insert({
      ...formData,
      log_type: "note",
      log_date: format(selectedDate, "yyyy-MM-dd"),
      created_by: user.id,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Note created" });
    setFormData({ project_id: selectedProject, notes: "" });
    onSuccess();
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Add Project Note</CardTitle>
        <CardDescription>General project notes</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Project *</Label>
              <Select value={formData.project_id} onValueChange={(v) => setFormData({...formData, project_id: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Note *</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} required rows={6} />
            </div>
          </div>
          <Button type="submit"><Plus className="mr-2 h-4 w-4" />Add Note</Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Log Table Component
function LogTable({ logs, type, onDelete }: any) {
  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No {type} logs found.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              {type === "work" && <><TableHead>Description</TableHead><TableHead>Hours</TableHead><TableHead>Workers</TableHead></>}
              {type === "safety" && <><TableHead>Type</TableHead><TableHead>Description</TableHead></>}
              {type === "weather" && <><TableHead>Condition</TableHead><TableHead>Temp</TableHead></>}
              {type === "equipment" && <><TableHead>Equipment</TableHead><TableHead>Hours</TableHead></>}
              {type === "material" && <><TableHead>Material</TableHead><TableHead>Quantity</TableHead></>}
              {type === "delivery" && <><TableHead>Item</TableHead><TableHead>Supplier</TableHead></>}
              {type === "visitor" && <><TableHead>Name</TableHead><TableHead>Company</TableHead></>}
              {type === "note" && <><TableHead>Note</TableHead></>}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log: any) => (
              <TableRow key={log.id}>
                <TableCell>{format(new Date(log.log_date), "MMM dd")}</TableCell>
                {type === "work" && <><TableCell>{log.work_description}</TableCell><TableCell>{log.hours_worked}</TableCell><TableCell>{log.workers_count}</TableCell></>}
                {type === "safety" && <><TableCell className="capitalize">{log.safety_type}</TableCell><TableCell>{log.safety_description}</TableCell></>}
                {type === "weather" && <><TableCell>{log.weather_condition}</TableCell><TableCell>{log.temperature}°F</TableCell></>}
                {type === "equipment" && <><TableCell>{log.equipment_name}</TableCell><TableCell>{log.equipment_hours}</TableCell></>}
                {type === "material" && <><TableCell>{log.material_name}</TableCell><TableCell>{log.material_quantity} {log.material_unit}</TableCell></>}
                {type === "delivery" && <><TableCell>{log.delivery_item}</TableCell><TableCell>{log.delivery_supplier}</TableCell></>}
                {type === "visitor" && <><TableCell>{log.visitor_name}</TableCell><TableCell>{log.visitor_company}</TableCell></>}
                {type === "note" && <><TableCell className="max-w-md truncate">{log.notes}</TableCell></>}
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => onDelete(log.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
