import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Palette, Save, Eye, Plus, Copy, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import DOMPurify from "dompurify";

interface EmailTemplate {
  id?: string;
  company_name: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  welcome_message: string;
  custom_footer: string;
  template_name: string;
  is_active: boolean;
}

export function EmailTemplateEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState("");
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [template, setTemplate] = useState<EmailTemplate>({
    company_name: "SmartReno",
    logo_url: "",
    primary_color: "#667eea",
    secondary_color: "#764ba2",
    welcome_message: "Welcome to the team!",
    custom_footer: "",
    template_name: "Default Template",
    is_active: true,
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [newTemplateDialogOpen, setNewTemplateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      setUserId(session.user.id);

      const { data, error } = await supabase
        .from('contractor_email_templates')
        .select('*')
        .eq('contractor_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading templates:', error);
      } else if (data && data.length > 0) {
        setTemplates(data as EmailTemplate[]);
        const activeTemplate = data.find(t => t.is_active) || data[0];
        setSelectedTemplateId(activeTemplate.id);
        setTemplate(activeTemplate as EmailTemplate);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (!userId || !selectedTemplateId) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('contractor_email_templates')
        .update({
          company_name: template.company_name,
          logo_url: template.logo_url,
          primary_color: template.primary_color,
          secondary_color: template.secondary_color,
          welcome_message: template.welcome_message,
          custom_footer: template.custom_footer,
          template_name: template.template_name,
        })
        .eq('id', selectedTemplateId);

      if (error) throw error;
      toast.success('Template saved successfully!');
      await loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const createNewTemplate = async () => {
    if (!userId || !newTemplateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    setSaving(true);

    try {
      const { data, error } = await supabase
        .from('contractor_email_templates')
        .insert({
          contractor_id: userId,
          company_name: "SmartReno",
          logo_url: "",
          primary_color: "#667eea",
          secondary_color: "#764ba2",
          welcome_message: "Welcome to the team!",
          custom_footer: "",
          template_name: newTemplateName.trim(),
          is_active: false,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('New template created!');
      setNewTemplateDialogOpen(false);
      setNewTemplateName("");
      await loadTemplates();
      if (data) {
        setSelectedTemplateId(data.id);
        setTemplate(data as EmailTemplate);
      }
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    } finally {
      setSaving(false);
    }
  };

  const duplicateTemplate = async () => {
    if (!userId) return;
    setSaving(true);

    try {
      const { data, error } = await supabase
        .from('contractor_email_templates')
        .insert({
          contractor_id: userId,
          company_name: template.company_name,
          logo_url: template.logo_url,
          primary_color: template.primary_color,
          secondary_color: template.secondary_color,
          welcome_message: template.welcome_message,
          custom_footer: template.custom_footer,
          template_name: `${template.template_name} (Copy)`,
          is_active: false,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Template duplicated!');
      await loadTemplates();
      if (data) {
        setSelectedTemplateId(data.id);
        setTemplate(data as EmailTemplate);
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Failed to duplicate template');
    } finally {
      setSaving(false);
    }
  };

  const setActiveTemplate = async () => {
    if (!userId || !selectedTemplateId) return;
    setSaving(true);

    try {
      // First, set all templates to inactive
      await supabase
        .from('contractor_email_templates')
        .update({ is_active: false })
        .eq('contractor_id', userId);

      // Then set the selected one to active
      const { error } = await supabase
        .from('contractor_email_templates')
        .update({ is_active: true })
        .eq('id', selectedTemplateId);

      if (error) throw error;
      toast.success('Active template updated!');
      await loadTemplates();
    } catch (error) {
      console.error('Error setting active template:', error);
      toast.error('Failed to set active template');
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async () => {
    if (!userId || !selectedTemplateId || templates.length <= 1) {
      toast.error('Cannot delete the last template');
      return;
    }
    setSaving(true);

    try {
      const { error } = await supabase
        .from('contractor_email_templates')
        .delete()
        .eq('id', selectedTemplateId);

      if (error) throw error;
      toast.success('Template deleted!');
      setDeleteDialogOpen(false);
      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    } finally {
      setSaving(false);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    const selected = templates.find(t => t.id === templateId);
    if (selected) {
      setSelectedTemplateId(templateId);
      setTemplate(selected);
    }
  };

  const getPreviewHtml = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Preview</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, ${template.primary_color} 0%, ${template.secondary_color} 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            ${template.logo_url ? `
              <img src="${template.logo_url}" alt="${template.company_name}" style="max-width: 200px; height: auto; margin-bottom: 15px;">
            ` : ''}
            <h1 style="color: white; margin: 0; font-size: 28px;">${template.welcome_message}</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi John,</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              You've been invited to join <strong>${template.company_name}</strong> as a <strong>Foreman</strong>.
            </p>
            
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                <strong>System Access Role:</strong> Project Manager
              </p>
            </div>
            
            <p style="font-size: 16px; margin-bottom: 25px;">
              Click the button below to accept your invitation and set up your account:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" 
                 style="display: inline-block; background: linear-gradient(135deg, ${template.primary_color} 0%, ${template.secondary_color} 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                Accept Invitation
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 13px; color: #9ca3af; margin-top: 20px;">
              This invitation will expire in 7 days.
            </p>
            
            <p style="font-size: 13px; color: #9ca3af; margin-top: 15px;">
              Best regards,<br>
              <strong>${template.company_name} Team</strong>
            </p>

            ${template.custom_footer ? `
              <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #6b7280; margin: 0;">${template.custom_footer}</p>
              </div>
            ` : ''}
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p style="margin: 5px 0;">© ${new Date().getFullYear()} ${template.company_name}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Email Template Customization
            </CardTitle>
            <CardDescription>
              Create and manage multiple email templates with custom branding
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Email Preview</DialogTitle>
                  <DialogDescription>
                    This is how your team invitation emails will appear
                  </DialogDescription>
                </DialogHeader>
                <div 
                  className="border rounded-lg p-4 bg-gray-50"
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(getPreviewHtml(), {
                      ALLOWED_TAGS: ['html', 'head', 'body', 'meta', 'title', 'style', 'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'img', 'strong', 'em', 'br', 'hr', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span'],
                      ALLOWED_ATTR: ['style', 'href', 'src', 'alt', 'class', 'charset', 'name', 'content'],
                      ALLOW_DATA_ATTR: false,
                      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
                      FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur']
                    })
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Selector and Actions */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px] space-y-2">
            <Label>Select Template</Label>
            <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id!}>
                    {t.template_name} {t.is_active && "(Active)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={newTemplateDialogOpen} onOpenChange={setNewTemplateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
                <DialogDescription>
                  Enter a name for your new email template
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="e.g., Holiday Theme, Modern Design"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setNewTemplateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createNewTemplate} disabled={saving}>
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={duplicateTemplate} disabled={!selectedTemplateId}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setDeleteDialogOpen(true)}
              disabled={!selectedTemplateId || templates.length <= 1}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Template</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{template.template_name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteTemplate}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {!template.is_active && (
            <Button variant="default" size="sm" onClick={setActiveTemplate} disabled={!selectedTemplateId}>
              Set as Active
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Company Name *</Label>
            <Input
              value={template.company_name}
              onChange={(e) => setTemplate({ ...template, company_name: e.target.value })}
              placeholder="Your Company Name"
            />
          </div>

          <div className="space-y-2">
            <Label>Logo URL (Optional)</Label>
            <Input
              value={template.logo_url}
              onChange={(e) => setTemplate({ ...template, logo_url: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div className="space-y-2">
            <Label>Primary Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={template.primary_color}
                onChange={(e) => setTemplate({ ...template, primary_color: e.target.value })}
                className="w-20"
              />
              <Input
                value={template.primary_color}
                onChange={(e) => setTemplate({ ...template, primary_color: e.target.value })}
                placeholder="#667eea"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={template.secondary_color}
                onChange={(e) => setTemplate({ ...template, secondary_color: e.target.value })}
                className="w-20"
              />
              <Input
                value={template.secondary_color}
                onChange={(e) => setTemplate({ ...template, secondary_color: e.target.value })}
                placeholder="#764ba2"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Template Name</Label>
          <Input
            value={template.template_name}
            onChange={(e) => setTemplate({ ...template, template_name: e.target.value })}
            placeholder="Template Name"
          />
        </div>

        <div className="space-y-2">
          <Label>Welcome Message</Label>
          <Input
            value={template.welcome_message}
            onChange={(e) => setTemplate({ ...template, welcome_message: e.target.value })}
            placeholder="Welcome to the team!"
          />
        </div>

        <div className="space-y-2">
          <Label>Custom Footer (Optional)</Label>
          <Textarea
            value={template.custom_footer}
            onChange={(e) => setTemplate({ ...template, custom_footer: e.target.value })}
            placeholder="Add any additional information or legal disclaimers..."
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={saveTemplate} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
