import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Share2, CheckSquare, LayoutGrid, NotebookPen, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type TemplateType = "three_three_three" | "eisenhower" | "blank";

interface SmartPlanItem {
  id: string;
  section: string;
  content: string;
  isDone: boolean;
  orderIndex: number;
}

interface Project {
  id: string;
  project_name: string;
  client_name: string;
}

export default function AdminSmartPlan() {
  const { toast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [templateType, setTemplateType] = useState<TemplateType>("three_three_three");
  const [title, setTitle] = useState("SmartPlan – Site Visit 01");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<SmartPlanItem[]>([]);
  const [isSharedWithContractor, setIsSharedWithContractor] = useState(false);
  const [notifyPM, setNotifyPM] = useState(true);
  const [notifyCoordinator, setNotifyCoordinator] = useState(true);
  const [notifyEstimator, setNotifyEstimator] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentSmartPlanId, setCurrentSmartPlanId] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadSmartPlan(selectedProjectId);
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contractor_projects')
        .select('id, project_name, client_name')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
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
    try {
      const { data: smartPlan, error } = await supabase
        .from('smartplans')
        .select('*, smartplan_items(*)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (smartPlan) {
        setCurrentSmartPlanId(smartPlan.id);
        setTitle(smartPlan.title);
        setNotes(smartPlan.notes || "");
        setTemplateType(smartPlan.template_type as TemplateType);
        setIsSharedWithContractor(smartPlan.is_shared_with_contractor);
        setNotifyPM(smartPlan.notify_project_manager);
        setNotifyCoordinator(smartPlan.notify_coordinator);
        setNotifyEstimator(smartPlan.notify_estimator);
        
        const loadedItems: SmartPlanItem[] = (smartPlan.smartplan_items || [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((item: any) => ({
            id: item.id,
            section: item.section,
            content: item.content,
            isDone: item.is_done,
            orderIndex: item.order_index,
          }));
        setItems(loadedItems);
      } else {
        // Reset for new SmartPlan
        setCurrentSmartPlanId(null);
        setTitle(`SmartPlan – ${new Date().toLocaleDateString()}`);
        setNotes("");
        setItems([]);
        setIsSharedWithContractor(false);
        setNotifyPM(true);
        setNotifyCoordinator(true);
        setNotifyEstimator(false);
      }
    } catch (error) {
      console.error('Error loading SmartPlan:', error);
      toast({
        title: "Error",
        description: "Failed to load SmartPlan",
        variant: "destructive",
      });
    }
  };

  // Set up realtime subscription for smartplan items
  useEffect(() => {
    if (!currentSmartPlanId) return;

    const channel = supabase
      .channel('admin-smartplan-items-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'smartplan_items',
          filter: `smartplan_id=eq.${currentSmartPlanId}`
        },
        (payload) => {
          setItems(prev => prev.map(item => 
            item.id === payload.new.id 
              ? {
                  ...item,
                  isDone: payload.new.is_done,
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
  }, [currentSmartPlanId]);

  const addItem = (section: string) => {
    const newItem: SmartPlanItem = {
      id: crypto.randomUUID(),
      section,
      content: "",
      isDone: false,
      orderIndex: items.filter(i => i.section === section).length,
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

  const updateItemContent = (id: string, content: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, content } : item)));
  };

  const toggleItemDone = (id: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, isDone: !item.isDone } : item)));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
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

  const handleSave = async () => {
    if (!selectedProjectId) {
      toast({
        title: "Project Required",
        description: "Please select a project before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let smartPlanId = currentSmartPlanId;

      if (currentSmartPlanId) {
        // Update existing SmartPlan
        const { error: updateError } = await supabase
          .from('smartplans')
          .update({
            title,
            template_type: templateType,
            notes,
            is_shared_with_contractor: isSharedWithContractor,
            notify_project_manager: notifyPM,
            notify_coordinator: notifyCoordinator,
            notify_estimator: notifyEstimator,
          })
          .eq('id', currentSmartPlanId);

        if (updateError) throw updateError;

        // Delete existing items
        const { error: deleteError } = await supabase
          .from('smartplan_items')
          .delete()
          .eq('smartplan_id', currentSmartPlanId);

        if (deleteError) throw deleteError;
      } else {
        // Create new SmartPlan
        const { data: newSmartPlan, error: insertError } = await supabase
          .from('smartplans')
          .insert({
            project_id: selectedProjectId,
            owner_id: user.id,
            title,
            template_type: templateType,
            notes,
            is_shared_with_contractor: isSharedWithContractor,
            notify_project_manager: notifyPM,
            notify_coordinator: notifyCoordinator,
            notify_estimator: notifyEstimator,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        smartPlanId = newSmartPlan.id;
        setCurrentSmartPlanId(smartPlanId);
      }

      // Insert items with content
      const itemsToInsert = items
        .filter(item => item.content.trim() !== '')
        .map((item, index) => ({
          smartplan_id: smartPlanId,
          section: item.section,
          content: item.content,
          is_done: item.isDone,
          order_index: index,
        }));

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase
          .from('smartplan_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      toast({
        title: "Success",
        description: "SmartPlan saved successfully",
      });
    } catch (error) {
      console.error('Error saving SmartPlan:', error);
      toast({
        title: "Error",
        description: "Failed to save SmartPlan",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderThreeThreeThree = () => (
    <div className="grid gap-4 md:grid-cols-3">
      {[
        { key: "today", label: "3 Must-Do Today" },
        { key: "week", label: "3 This Week" },
        { key: "later", label: "3 Later / Backlog" },
      ].map((section) => {
        const sectionItems = items.filter((item) => item.section === section.key);
        const completedCount = sectionItems.filter(item => item.isDone).length;
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
            <CardContent className="space-y-3 flex-1 flex flex-col">
              <div className="space-y-2 flex-1">
                {sectionItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-2">
                    <Checkbox
                      checked={item.isDone}
                      onCheckedChange={() => toggleItemDone(item.id)}
                      className="mt-2"
                    />
                    <Input
                      placeholder="Task..."
                      value={item.content}
                      onChange={(e) => updateItemContent(item.id, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, item.id, section.key)}
                      data-section={section.key}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => addItem(section.key)}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Task
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
          const completedCount = sectionItems.filter(item => item.isDone).length;
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
              <CardContent className="space-y-3 flex-1 flex flex-col">
                <div className="space-y-2 flex-1">
                  {sectionItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-2">
                      <Checkbox
                        checked={item.isDone}
                        onCheckedChange={() => toggleItemDone(item.id)}
                        className="mt-2"
                      />
                      <Input
                        placeholder="Task..."
                        value={item.content}
                        onChange={(e) => updateItemContent(item.id, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, item.id, section.key)}
                        data-section={section.key}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => addItem(section.key)}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Task
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
    const completedCount = sectionItems.filter(item => item.isDone).length;
    const totalCount = sectionItems.length;
    const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    
    return (
      <Card className="relative border-dashed border-2">
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
          <div className="space-y-2">
            {sectionItems.map((item) => (
              <div key={item.id} className="flex items-start gap-2">
                <Checkbox
                  checked={item.isDone}
                  onCheckedChange={() => toggleItemDone(item.id)}
                  className="mt-2"
                />
                <Input
                  placeholder="Bullet item..."
                  value={item.content}
                  onChange={(e) => updateItemContent(item.id, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, item.id, "default")}
                  data-section="default"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addItem("default")}
            >
              <Plus className="w-4 h-4 mr-1" /> Add Line
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6" />
            SmartPlan Task List
          </h1>
          <p className="text-sm text-muted-foreground">
            Create a project-specific SmartPlan using 3/3/3, Eisenhower, or a freeform notebook. 
            Share it into the Contractor Portal for PMs & Coordinators.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-1" 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            Save & Sync
          </Button>
        </div>
      </div>

      {/* Project & Template Controls */}
      <Card>
        <CardContent className="pt-4 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="flex-1 space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Project
            </label>
            <Select
              value={selectedProjectId ?? ""}
              onValueChange={(value) => setSelectedProjectId(value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project…" />
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

          <div className="flex-1 space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              SmartPlan Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. SmartPlan – Week of Nov 18"
            />
          </div>

          <div className="flex-1 space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Layout
            </label>
            <Tabs
              value={templateType}
              onValueChange={(val) => {
                setTemplateType(val as TemplateType);
                setItems([]);
              }}
            >
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="three_three_three" className="flex items-center gap-1 text-xs">
                  <CheckSquare className="w-3 h-3" />
                  3/3/3
                </TabsTrigger>
                <TabsTrigger value="eisenhower" className="flex items-center gap-1 text-xs">
                  <LayoutGrid className="w-3 h-3" />
                  Eisenhower
                </TabsTrigger>
                <TabsTrigger value="blank" className="flex items-center gap-1 text-xs">
                  <NotebookPen className="w-3 h-3" />
                  Notebook
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Main Canvas */}
      <Tabs value={templateType} className="space-y-4">
        <TabsContent value="three_three_three" className="space-y-4">
          {renderThreeThreeThree()}
        </TabsContent>
        <TabsContent value="eisenhower" className="space-y-4">
          {renderEisenhower()}
        </TabsContent>
        <TabsContent value="blank" className="space-y-4">
          {renderBlank()}
        </TabsContent>
      </Tabs>

      {/* Sharing & Notifications */}
      <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Internal Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Context for this SmartPlan – site visit notes, risks, client expectations, etc."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sharing & Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={isSharedWithContractor}
                onCheckedChange={(checked) => setIsSharedWithContractor(checked as boolean)}
              />
              <span>Share SmartPlan into Contractor Portal</span>
            </div>
            <p className="text-xs text-muted-foreground">
              When enabled, Project Managers and Coordinators attached to this project 
              will see a "SmartPlan" tab in their Contractor Portal.
            </p>

            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={notifyPM}
                  onCheckedChange={(checked) => setNotifyPM(checked as boolean)}
                />
                <span>Notify assigned Project Manager</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={notifyCoordinator}
                  onCheckedChange={(checked) => setNotifyCoordinator(checked as boolean)}
                />
                <span>Notify Project Coordinator</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={notifyEstimator}
                  onCheckedChange={(checked) => setNotifyEstimator(checked as boolean)}
                />
                <span>Notify Construction Agent</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
