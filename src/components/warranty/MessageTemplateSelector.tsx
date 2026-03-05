import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Edit } from "lucide-react";

interface MessageTemplateSelectorProps {
  onSelectTemplate: (templateBody: string) => void;
  claimData?: {
    claim_number?: string;
    homeowner_name?: string;
    claim_type?: string;
  };
}

export const MessageTemplateSelector = ({ onSelectTemplate, claimData }: MessageTemplateSelectorProps) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [mergeFields, setMergeFields] = useState<Record<string, string>>({});
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<string>("");

  const { data: templates } = useQuery({
    queryKey: ['warranty-message-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warranty_message_templates' as any)
        .select('*')
        .eq('is_active', true)
        .order('template_name');
      
      if (error) throw error;
      return data;
    },
  });

  const extractMergeFields = (template: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const fields: string[] = [];
    let match;
    while ((match = regex.exec(template)) !== null) {
      if (!fields.includes(match[1])) {
        fields.push(match[1]);
      }
    }
    return fields;
  };

  const replaceMergeFields = (template: string, fields: Record<string, string>): string => {
    let result = template;
    Object.entries(fields).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });
    return result;
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates?.find((t: any) => t.id === templateId);
    if (!template) return;

    const templateBody = (template as any).message_body as string;
    const fields = extractMergeFields(templateBody);
    
    if (fields.length > 0) {
      // Pre-fill known fields from claimData
      const prefilledFields: Record<string, string> = {};
      fields.forEach(field => {
        if (claimData && field in claimData) {
          prefilledFields[field] = (claimData as any)[field] || '';
        } else {
          prefilledFields[field] = '';
        }
      });
      setMergeFields(prefilledFields);
      setCurrentTemplate(templateBody);
      setShowMergeDialog(true);
    } else {
      // No merge fields, insert directly
      onSelectTemplate(templateBody);
    }
  };

  const handleInsertTemplate = () => {
    const finalMessage = replaceMergeFields(currentTemplate, mergeFields);
    onSelectTemplate(finalMessage);
    setShowMergeDialog(false);
    setSelectedTemplateId("");
    setMergeFields({});
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
          <SelectTrigger className="w-[280px]">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <SelectValue placeholder="Quick Reply Templates" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {templates?.map((template: any) => (
              <SelectItem key={template.id} value={template.id}>
                {template.template_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Dialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customize Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{currentTemplate}</p>
            </div>
            
            <div className="space-y-3">
              <Label className="text-base font-semibold">Fill in Merge Fields:</Label>
              {Object.keys(mergeFields).map((field) => (
                <div key={field} className="space-y-2">
                  <Label htmlFor={field} className="capitalize">
                    {field.replace(/_/g, ' ')}
                  </Label>
                  <Input
                    id={field}
                    value={mergeFields[field]}
                    onChange={(e) => setMergeFields(prev => ({
                      ...prev,
                      [field]: e.target.value
                    }))}
                    placeholder={`Enter ${field.replace(/_/g, ' ')}`}
                  />
                </div>
              ))}
            </div>

            <div className="bg-border/20 p-4 rounded-lg">
              <Label className="text-sm font-semibold mb-2 block">Preview:</Label>
              <p className="text-sm whitespace-pre-wrap">
                {replaceMergeFields(currentTemplate, mergeFields)}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowMergeDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleInsertTemplate}>
                <Edit className="h-4 w-4 mr-2" />
                Insert Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
