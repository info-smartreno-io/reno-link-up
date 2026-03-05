import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Send } from "lucide-react";
import { toast } from "sonner";

interface CommunicationHelperProps {
  projectId: string;
  recentActivity?: any[];
  timeline?: any[];
  delays?: any[];
}

export function CommunicationHelper({ 
  projectId, 
  recentActivity = [], 
  timeline = [], 
  delays = [] 
}: CommunicationHelperProps) {
  const [generating, setGenerating] = useState(false);
  const [messageType, setMessageType] = useState<'homeowner' | 'subcontractor'>('homeowner');
  const [messageLength, setMessageLength] = useState<'short' | 'medium' | 'detailed'>('medium');
  const [draftMessages, setDraftMessages] = useState<any>(null);
  const [customNotes, setCustomNotes] = useState('');
  const [editedMessage, setEditedMessage] = useState('');

  const handleGenerateDraft = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-communication-helper', {
        body: {
          projectId,
          recentActivity,
          timeline,
          delays,
          notes: customNotes,
          messageType
        }
      });

      if (error) throw error;

      setDraftMessages(data);
      
      // Set initial edited message based on type and length
      const initialMessage = messageType === 'homeowner' 
        ? data.homeowner_message 
        : data.subcontractor_message;
      setEditedMessage(data.alternate_versions?.[messageLength] || initialMessage);
      
      toast.success('Draft message generated');
    } catch (error: any) {
      console.error('Error generating draft:', error);
      toast.error(error.message || 'Failed to generate message');
    } finally {
      setGenerating(false);
    }
  };

  const handleLengthChange = (length: 'short' | 'medium' | 'detailed') => {
    setMessageLength(length);
    if (draftMessages?.alternate_versions) {
      setEditedMessage(draftMessages.alternate_versions[length]);
    }
  };

  const handleSendMessage = () => {
    // In a real implementation, this would send via email/SMS
    toast.success('Message copied to clipboard (sending not yet implemented)');
    navigator.clipboard.writeText(editedMessage);
  };

  return (
    <Card className="border-primary/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>Draft Update (AI)</CardTitle>
        </div>
        <CardDescription>
          Generate professional project updates for homeowners and subcontractors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Message Type</label>
            <Select value={messageType} onValueChange={(v: any) => setMessageType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="homeowner">Homeowner Update</SelectItem>
                <SelectItem value="subcontractor">Subcontractor Coordination</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {draftMessages && (
            <div>
              <label className="text-sm font-medium mb-2 block">Message Length</label>
              <Select value={messageLength} onValueChange={(v: any) => handleLengthChange(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Additional Notes */}
        <div>
          <label className="text-sm font-medium mb-2 block">Additional Context (Optional)</label>
          <Textarea
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            placeholder="Add any specific details you want to include..."
            rows={3}
          />
        </div>

        <Button 
          onClick={handleGenerateDraft} 
          disabled={generating}
          className="w-full"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {generating ? 'Generating...' : 'Generate Draft Message (AI)'}
        </Button>

        {/* Generated Message */}
        {draftMessages && (
          <div className="space-y-4 pt-4 border-t">
            <Tabs value={messageType} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="homeowner" onClick={() => setMessageType('homeowner')}>
                  Homeowner Message
                </TabsTrigger>
                <TabsTrigger value="subcontractor" onClick={() => setMessageType('subcontractor')}>
                  Subcontractor Message
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value={messageType} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Edit Message</label>
                  <Textarea
                    value={editedMessage}
                    onChange={(e) => setEditedMessage(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setDraftMessages(null)}
                    className="flex-1"
                  >
                    Clear Draft
                  </Button>
                  <Button 
                    onClick={handleSendMessage}
                    className="flex-1"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Copy & Send
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
