import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, X, Upload, FileText } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const proposalSchema = z.object({
  project_id: z.string().min(1, "Project is required"),
  design_phase: z.string().min(1, "Design phase is required"),
  proposal_amount: z.string().min(1, "Proposal amount is required"),
  estimated_timeline: z.string().min(1, "Timeline is required"),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

type ProposalFormData = z.infer<typeof proposalSchema>;

interface LineItem {
  description: string;
  amount: number;
}

interface CreateProposalFormProps {
  projects: Array<{ id: string; project_name: string; client_name: string }>;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateProposalForm({ projects, onSuccess, onCancel }: CreateProposalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const form = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      project_id: "",
      design_phase: "",
      proposal_amount: "",
      estimated_timeline: "",
      notes: "",
      terms: "",
    },
  });

  const addLineItem = () => {
    if (!newItemDescription.trim() || !newItemAmount) {
      toast({
        title: "Invalid line item",
        description: "Please provide both description and amount",
        variant: "destructive",
      });
      return;
    }

    setLineItems([
      ...lineItems,
      {
        description: newItemDescription.trim(),
        amount: parseFloat(newItemAmount),
      },
    ]);
    setNewItemDescription("");
    setNewItemAmount("");
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setUploadedFiles([...uploadedFiles, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const uploadFiles = async (userId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of uploadedFiles) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("architect-proposals")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Error uploading file:", uploadError);
        throw new Error(`Failed to upload ${file.name}`);
      }

      const { data, error: urlError } = await supabase.storage
        .from("architect-proposals")
        .createSignedUrl(fileName, 3600);

      if (urlError || !data?.signedUrl) {
        console.error("Error creating signed URL:", urlError);
        throw new Error(`Failed to create URL for ${file.name}`);
      }

      uploadedUrls.push(data.signedUrl);
    }

    return uploadedUrls;
  };

  const onSubmit = async (data: ProposalFormData) => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload files if any
      let attachmentUrls: string[] = [];
      if (uploadedFiles.length > 0) {
        attachmentUrls = await uploadFiles(user.id);
      }

      // Create proposal
      const { error } = await supabase.from("architect_proposals").insert({
        architect_id: user.id,
        project_id: data.project_id,
        design_phase: data.design_phase,
        proposal_amount: parseFloat(data.proposal_amount),
        estimated_timeline: data.estimated_timeline,
        notes: data.notes || null,
        terms: data.terms || null,
        line_items: lineItems.length > 0 ? (lineItems as any) : null,
        attachment_urls: attachmentUrls.length > 0 ? (attachmentUrls as any) : null,
        status: "pending",
      } as any);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Proposal submitted successfully",
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error submitting proposal:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit proposal",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="project_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.project_name} - {project.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="design_phase"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Design Phase</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select design phase" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Schematic Design">Schematic Design</SelectItem>
                  <SelectItem value="Design Development">Design Development</SelectItem>
                  <SelectItem value="Construction Documents">Construction Documents</SelectItem>
                  <SelectItem value="Full Service">Full Service (All Phases)</SelectItem>
                  <SelectItem value="Consultation">Consultation Only</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Select the design services you're proposing</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="proposal_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Proposal Amount ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="25000"
                    {...field}
                  />
                </FormControl>
                {totalAmount > 0 && (
                  <FormDescription>Line items total: ${totalAmount.toLocaleString()}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estimated_timeline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Timeline</FormLabel>
                <FormControl>
                  <Input placeholder="8-10 weeks" {...field} />
                </FormControl>
                <FormDescription>e.g., "8-10 weeks" or "2-3 months"</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Line Items Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cost Breakdown (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="item-description">Description</Label>
                <Input
                  id="item-description"
                  placeholder="Schematic Design Phase"
                  value={newItemDescription}
                  onChange={(e) => setNewItemDescription(e.target.value)}
                />
              </div>
              <div className="w-32">
                <Label htmlFor="item-amount">Amount ($)</Label>
                <Input
                  id="item-amount"
                  type="number"
                  step="0.01"
                  placeholder="5000"
                  value={newItemAmount}
                  onChange={(e) => setNewItemAmount(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button type="button" onClick={addLineItem} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>

            {lineItems.length > 0 && (
              <div className="border rounded-lg p-3 space-y-2">
                {lineItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="flex-1">{item.description}</span>
                    <span className="font-medium">${item.amount.toLocaleString()}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(index)}
                      className="ml-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="pt-2 border-t flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${totalAmount.toLocaleString()}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proposal Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional details about your proposal, deliverables, methodology, etc."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Terms & Conditions</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Payment terms, project terms, etc."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>Include payment schedule, revision policy, etc.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attachments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Upload Files (Standard Agreement, Portfolio, etc.)</Label>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="cursor-pointer"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Supported: PDF, Word, Images (max 10MB each)
              </p>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="border rounded-lg p-3 space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{file.name}</span>
                      <span className="text-muted-foreground">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Proposal
          </Button>
        </div>
      </form>
    </Form>
  );
}
