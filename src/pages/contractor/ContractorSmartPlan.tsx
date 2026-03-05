import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CheckSquare, LayoutGrid, NotebookPen, Loader2, FolderOpen, Lightbulb, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoProjects, getDemoSmartPlan } from "@/utils/demoContractorData";

type TemplateType = "three_three_three" | "eisenhower" | "blank";

interface SmartPlan {
  id: string;
  title: string;
  template_type: TemplateType;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface SmartPlanItem {
  id: string;
  section: string;
  content: string;
  is_done: boolean;
  order_index: number;
}

interface Project {
  id: string;
  project_name: string;
  client_name: string;
}

const DUMMY_SMARTPLAN: SmartPlan = {
  id: "dummy",
  title: "Example SmartPlan - Kitchen Remodel",
  template_type: "three_three_three",
  notes: "This is an example SmartPlan to help you understand how it works. The actual SmartPlan will be shared by the SmartReno team.",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DUMMY_ITEMS: SmartPlanItem[] = [
  { id: "1", section: "today", content: "Review final cabinet selections", is_done: true, order_index: 0 },
  { id: "2", section: "today", content: "Confirm countertop installation date", is_done: false, order_index: 1 },
  { id: "3", section: "today", content: "Walk through site with electrician", is_done: false, order_index: 2 },
  { id: "4", section: "week", content: "Order appliances from supplier", is_done: false, order_index: 0 },
  { id: "5", section: "week", content: "Schedule tile delivery", is_done: true, order_index: 1 },
  { id: "6", section: "week", content: "Review plumbing rough-in", is_done: false, order_index: 2 },
  { id: "7", section: "later", content: "Final paint color selection", is_done: false, order_index: 0 },
  { id: "8", section: "later", content: "Order backsplash materials", is_done: false, order_index: 1 },
  { id: "9", section: "later", content: "Schedule final inspection", is_done: false, order_index: 2 },
];

function SmartPlanSidebar({ 
  activeTemplate, 
  onTemplateChange,
  showExample 
}: { 
  activeTemplate: TemplateType; 
  onTemplateChange: (template: TemplateType) => void;
  showExample: boolean;
}) {
  const { open } = useSidebar();

  const templates = [
    { id: "three_three_three" as TemplateType, label: "3/3/3 Method", icon: CheckSquare },
    { id: "eisenhower" as TemplateType, label: "Eisenhower Matrix", icon: LayoutGrid },
    { id: "blank" as TemplateType, label: "Notebook", icon: NotebookPen },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{open ? "SmartPlan Templates" : "Templates"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {templates.map((template) => (
                <SidebarMenuItem key={template.id}>
                  <SidebarMenuButton
                    onClick={() => onTemplateChange(template.id)}
                    isActive={activeTemplate === template.id}
                    className="cursor-pointer"
                  >
                    <template.icon className="h-4 w-4" />
                    <span>{template.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {showExample && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <Lightbulb className="h-4 w-4 inline mr-1" />
              {open && "Example Mode"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {open && (
                <div className="px-2 py-1 text-xs text-muted-foreground">
                  Viewing sample data
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

export default function ContractorSmartPlan() {
  const { toast } = useToast();
  const { isDemoMode } = useDemoMode();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [smartPlan, setSmartPlan] = useState<SmartPlan | null>(null);
  const [items, setItems] = useState<SmartPlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>("three_three_three");
  const [showExample, setShowExample] = useState(false);

  useEffect(() => {
    if (isDemoMode) {
      // Load demo projects
      const demoProjects = getDemoProjects().map(p => ({
        id: p.id,
        project_name: p.name,
        client_name: p.client_name,
      }));
      setProjects(demoProjects);
      if (demoProjects.length > 0) {
        setSelectedProjectId(demoProjects[0].id);
        // Load demo SmartPlan
        const demoSmartPlan = getDemoSmartPlan();
        setSmartPlan(demoSmartPlan.smartPlan);
        setItems(demoSmartPlan.items);
        setShowExample(true);
      }
      return;
    }
    loadProjects();
  }, [isDemoMode]);

  useEffect(() => {
    if (selectedProjectId && !isDemoMode) {
      loadSmartPlan(selectedProjectId);
    }
  }, [selectedProjectId, isDemoMode]);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('contractor_projects')
        .select('id, project_name, client_name')
        .eq('contractor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
      
      // Auto-select first project if available
      if (data && data.length > 0) {
        setSelectedProjectId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSmartPlan = async (projectId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('smartplans')
        .select(`
          id,
          title,
          template_type,
          notes,
          created_at,
          updated_at,
          smartplan_items (
            id,
            section,
            content,
            is_done,
            order_index
          )
        `)
        .eq('project_id', projectId)
        .eq('is_shared_with_contractor', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSmartPlan({
          id: data.id,
          title: data.title,
          template_type: data.template_type as TemplateType,
          notes: data.notes,
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
        
        // Sort items by order_index
        const sortedItems = (data.smartplan_items || []).sort(
          (a: any, b: any) => a.order_index - b.order_index
        );
        setItems(sortedItems);
        setActiveTemplate(data.template_type as TemplateType);
        setShowExample(false);
      } else {
        // Show dummy example when no SmartPlan exists
        setSmartPlan(DUMMY_SMARTPLAN);
        setItems(DUMMY_ITEMS);
        setActiveTemplate("three_three_three");
        setShowExample(true);
      }
    } catch (error) {
      console.error('Error loading SmartPlan:', error);
      toast({
        title: "Error",
        description: "Failed to load SmartPlan",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTaskCompletion = async (itemId: string, currentStatus: boolean) => {
    // Prevent toggling dummy data
    if (showExample) {
      toast({
        title: "Example Mode",
        description: "This is sample data. Real SmartPlans will sync when shared by the team.",
      });
      return;
    }

    try {
      // Optimistically update UI
      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, is_done: !currentStatus } : item
      ));

      const { error } = await supabase
        .from('smartplan_items')
        .update({ is_done: !currentStatus })
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Success",
        description: currentStatus ? "Task marked as incomplete" : "Task marked as complete",
      });
    } catch (error) {
      // Revert on error
      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, is_done: currentStatus } : item
      ));
      
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  const addItem = async (section: string) => {
    if (showExample) {
      toast({
        title: "Example Mode",
        description: "This is sample data. Real SmartPlans allow editing.",
      });
      return;
    }

    if (!smartPlan?.id) return;

    const newItem: SmartPlanItem = {
      id: crypto.randomUUID(),
      section,
      content: "",
      is_done: false,
      order_index: items.filter(i => i.section === section).length,
    };
    
    setItems((prev) => [...prev, newItem]);
    
    // Focus the new input after a brief delay
    setTimeout(() => {
      const inputs = document.querySelectorAll(`input[data-section="${section}"]`);
      const lastInput = inputs[inputs.length - 1] as HTMLInputElement;
      if (lastInput) {
        lastInput.focus();
      }
    }, 50);
  };

  const updateItemContent = async (id: string, content: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, content } : item))
    );
  };

  const removeItem = async (id: string) => {
    if (showExample) {
      toast({
        title: "Example Mode",
        description: "This is sample data. Real SmartPlans allow editing.",
      });
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
    
    try {
      const { error } = await supabase
        .from('smartplan_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, itemId: string, section: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const item = items.find(i => i.id === itemId);
      
      // Only add new item if current item has content
      if (item && item.content.trim() !== '') {
        addItem(section);
      }
    }
  };

  const saveItems = async () => {
    if (showExample) {
      toast({
        title: "Example Mode",
        description: "This is sample data. Real SmartPlans allow editing.",
      });
      return;
    }

    if (!smartPlan?.id) return;

    try {
      // Delete empty items
      const itemsToSave = items.filter(item => item.content.trim() !== '');
      const emptyItems = items.filter(item => item.content.trim() === '');
      
      if (emptyItems.length > 0) {
        const { error: deleteError } = await supabase
          .from('smartplan_items')
          .delete()
          .in('id', emptyItems.map(i => i.id));
        
        if (deleteError) throw deleteError;
      }

      // Upsert non-empty items
      if (itemsToSave.length > 0) {
        const { error: upsertError } = await supabase
          .from('smartplan_items')
          .upsert(
            itemsToSave.map(item => ({
              id: item.id,
              smartplan_id: smartPlan.id,
              section: item.section,
              content: item.content,
              is_done: item.is_done,
              order_index: item.order_index,
            }))
          );

        if (upsertError) throw upsertError;
      }

      setItems(itemsToSave);

      toast({
        title: "Success",
        description: "SmartPlan tasks saved successfully",
      });
    } catch (error) {
      console.error('Error saving items:', error);
      toast({
        title: "Error",
        description: "Failed to save tasks",
        variant: "destructive",
      });
    }
  };

  // Set up realtime subscription for smartplan items
  useEffect(() => {
    if (!smartPlan?.id) return;

    const channel = supabase
      .channel('smartplan-items-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'smartplan_items',
          filter: `smartplan_id=eq.${smartPlan.id}`
        },
        (payload) => {
          setItems(prev => prev.map(item => 
            item.id === payload.new.id 
              ? {
                  ...item,
                  is_done: payload.new.is_done,
                  content: payload.new.content,
                }
              : item
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [smartPlan?.id]);

  const renderThreeThreeThree = () => (
    <div className="grid gap-4 md:grid-cols-3">
      {[
        { key: "today", label: "3 Must-Do Today" },
        { key: "week", label: "3 This Week" },
        { key: "later", label: "3 Later / Backlog" },
      ].map((section) => {
        const sectionItems = items.filter((item) => item.section === section.key);
        const completedCount = sectionItems.filter(item => item.is_done).length;
        const totalCount = sectionItems.length;
        const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        
        return (
          <Card key={section.key} className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between gap-2">
                <span>{section.label}</span>
                <Badge variant="outline">{totalCount}</Badge>
              </CardTitle>
              {totalCount > 0 && (
                <div className="space-y-1 mt-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{completedCount} of {totalCount} completed</span>
                    <span className="font-medium">{completionPercentage}%</span>
                  </div>
                  <Progress value={completionPercentage} className="h-2" />
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {sectionItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks in this section</p>
              ) : (
                sectionItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-2 group">
                    <Checkbox 
                      checked={item.is_done} 
                      onCheckedChange={() => toggleTaskCompletion(item.id, item.is_done)}
                      className="mt-0.5"
                      disabled={showExample}
                    />
                    <Input
                      placeholder="Task..."
                      value={item.content}
                      onChange={(e) => updateItemContent(item.id, e.target.value)}
                      onBlur={saveItems}
                      onKeyDown={(e) => handleKeyDown(e, item.id, section.key)}
                      data-section={section.key}
                      className={`flex-1 ${item.is_done ? 'line-through text-muted-foreground' : ''}`}
                      disabled={showExample}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={showExample}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addItem(section.key)}
                className="w-full mt-2"
                disabled={showExample}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderEisenhower = () => {
    const sections = [
      {
        key: "urgent_important",
        title: "Urgent & Important",
        subtitle: "Do now",
      },
      {
        key: "not_urgent_important",
        title: "Not Urgent & Important",
        subtitle: "Schedule",
      },
      {
        key: "urgent_not_important",
        title: "Urgent & Not Important",
        subtitle: "Delegate",
      },
      {
        key: "not_urgent_not_important",
        title: "Not Urgent & Not Important",
        subtitle: "Eliminate",
      },
    ];

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => {
          const sectionItems = items.filter((item) => item.section === section.key);
          const completedCount = sectionItems.filter(item => item.is_done).length;
          const totalCount = sectionItems.length;
          const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
          
          return (
            <Card key={section.key} className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {section.title}
                  <div className="text-xs text-muted-foreground">{section.subtitle}</div>
                </CardTitle>
                {totalCount > 0 && (
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{completedCount} of {totalCount} completed</span>
                      <span className="font-medium">{completionPercentage}%</span>
                    </div>
                    <Progress value={completionPercentage} className="h-2" />
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
              {sectionItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks in this quadrant</p>
              ) : (
                sectionItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-2 group">
                    <Checkbox 
                      checked={item.is_done} 
                      onCheckedChange={() => toggleTaskCompletion(item.id, item.is_done)}
                      className="mt-0.5"
                      disabled={showExample}
                    />
                    <Input
                      placeholder="Task..."
                      value={item.content}
                      onChange={(e) => updateItemContent(item.id, e.target.value)}
                      onBlur={saveItems}
                      onKeyDown={(e) => handleKeyDown(e, item.id, section.key)}
                      data-section={section.key}
                      className={`flex-1 ${item.is_done ? 'line-through text-muted-foreground' : ''}`}
                      disabled={showExample}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={showExample}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addItem(section.key)}
                className="w-full mt-2"
                disabled={showExample}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderBlank = () => {
    const sectionItems = items.filter((item) => item.section === "default");
    const completedCount = sectionItems.filter(item => item.is_done).length;
    const totalCount = sectionItems.length;
    const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    
    return (
      <Card className="border-dashed border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <NotebookPen className="w-4 h-4" />
            Freeform SmartPlan Notes
          </CardTitle>
          {totalCount > 0 && (
            <div className="space-y-1 mt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{completedCount} of {totalCount} completed</span>
                <span className="font-medium">{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {smartPlan?.notes && (
            <div className="mb-4 p-3 bg-muted rounded-md">
              <p className="text-sm whitespace-pre-wrap">{smartPlan.notes}</p>
            </div>
          )}
          {sectionItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items in this SmartPlan</p>
          ) : (
            sectionItems.map((item) => (
              <div key={item.id} className="flex items-start gap-2 group">
                <Checkbox 
                  checked={item.is_done} 
                  onCheckedChange={() => toggleTaskCompletion(item.id, item.is_done)}
                  className="mt-0.5"
                  disabled={showExample}
                />
                <Input
                  placeholder="Bullet item..."
                  value={item.content}
                  onChange={(e) => updateItemContent(item.id, e.target.value)}
                  onBlur={saveItems}
                  onKeyDown={(e) => handleKeyDown(e, item.id, "default")}
                  data-section="default"
                  className={`flex-1 ${item.is_done ? 'line-through text-muted-foreground' : ''}`}
                  disabled={showExample}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={showExample}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addItem("default")}
            className="w-full mt-2"
            disabled={showExample}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <ContractorLayout>
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full">
          <SmartPlanSidebar 
            activeTemplate={activeTemplate}
            onTemplateChange={setActiveTemplate}
            showExample={showExample}
          />

          <main className="flex-1">
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <SidebarTrigger />
                <div className="flex-1">
                  <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                    <CheckSquare className="w-6 h-6" />
                    SmartPlan
                    {showExample && (
                      <Badge variant="secondary" className="ml-2">
                        <Lightbulb className="w-3 h-3 mr-1" />
                        Example
                      </Badge>
                    )}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {showExample 
                      ? "Viewing example SmartPlan - Real plans will be shared by the SmartReno team"
                      : "View project SmartPlans shared by the SmartReno team"
                    }
                  </p>
                </div>
              </div>

              {/* Project Selector */}
              {!showExample && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          Select Project
                        </label>
                        <Select
                          value={selectedProjectId ?? ""}
                          onValueChange={(value) => setSelectedProjectId(value)}
                          disabled={isLoading || projects.length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={projects.length === 0 ? "No projects available" : "Select a project…"} />
                          </SelectTrigger>
                          <SelectContent>
                            {projects.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.project_name} – {p.client_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Loading State */}
              {isLoading && (
                <Card>
                  <CardContent className="pt-6 pb-6 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </CardContent>
                </Card>
              )}

              {/* SmartPlan Content */}
              {!isLoading && smartPlan && (
                <>
                  {/* SmartPlan Info */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{smartPlan.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              Last updated: {new Date(smartPlan.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    {smartPlan.notes && (
                      <CardContent>
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-sm whitespace-pre-wrap">{smartPlan.notes}</p>
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  {/* SmartPlan Items */}
                  {activeTemplate === "three_three_three" && renderThreeThreeThree()}
                  {activeTemplate === "eisenhower" && renderEisenhower()}
                  {activeTemplate === "blank" && renderBlank()}
                </>
              )}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </ContractorLayout>
  );
}
