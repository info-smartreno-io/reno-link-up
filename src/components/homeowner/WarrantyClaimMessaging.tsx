import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Paperclip, Send, Download, FileText, Image, File, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { MessageTemplateSelector } from "@/components/warranty/MessageTemplateSelector";

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
}

interface Message {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  read_at: string | null;
  sender_name: string;
  attachments?: Attachment[];
}

interface WarrantyClaimMessagingProps {
  claimId: string;
  claimNumber: string;
  isAdmin?: boolean;
  onClaimResolved?: () => void;
  claimData?: {
    claim_number?: string;
    homeowner_name?: string;
    claim_type?: string;
  };
}

export const WarrantyClaimMessaging = ({ 
  claimId, 
  claimNumber, 
  isAdmin = false, 
  onClaimResolved,
  claimData 
}: WarrantyClaimMessagingProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [resolving, setResolving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
    fetchMessages();
  }, [claimId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Mark unread messages as read
    const markMessagesAsRead = async () => {
      if (!currentUserId) return;

      const unreadMessages = messages.filter(
        msg => msg.sender_id !== currentUserId && !msg.read_at
      );

      for (const msg of unreadMessages) {
        await supabase
          .from('warranty_claim_messages' as any)
          .update({ read_at: new Date().toISOString() })
          .eq('id', msg.id);
      }
    };

    markMessagesAsRead();
  }, [messages, currentUserId]);

  useEffect(() => {
    // Set up realtime subscription
    const channel = supabase
      .channel(`warranty-claim-messages-${claimId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'warranty_claim_messages',
          filter: `claim_id=eq.${claimId}`
        },
        async (payload) => {
          const newMsg = payload.new as any;
          
          // Fetch sender name and attachments
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', newMsg.sender_id)
            .single();

          const { data: attachments } = await supabase
            .from('warranty_message_attachments' as any)
            .select('*')
            .eq('message_id', newMsg.id);

          const formattedMsg: Message = {
            ...newMsg,
            sender_name: profile?.full_name || 'Unknown',
            attachments: attachments || []
          };

          setMessages(prev => [...prev, formattedMsg]);
          
          // Show toast if message from someone else
          if (newMsg.sender_id !== currentUserId) {
            toast.info(`New message from ${formattedMsg.sender_name}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [claimId, currentUserId]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data: messagesData, error } = await supabase
        .from('warranty_claim_messages' as any)
        .select('*')
        .eq('claim_id', claimId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch sender names and attachments for each message
      const messagesWithDetails = await Promise.all(
        ((messagesData as any) || []).map(async (msg: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', msg.sender_id)
            .single();

          const { data: attachments } = await supabase
            .from('warranty_message_attachments' as any)
            .select('*')
            .eq('message_id', msg.id);

          return {
            ...msg,
            sender_name: profile?.full_name || 'Unknown',
            attachments: (attachments as any) || []
          };
        })
      );

      setMessages(messagesWithDetails);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && selectedFiles.length === 0) return;
    if (!currentUserId) return;

    try {
      // Insert message
      const { data: messageData, error: messageError } = await supabase
        .from('warranty_claim_messages' as any)
        .insert({
          claim_id: claimId,
          sender_id: currentUserId,
          message: newMessage.trim() || '(attachment)',
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Upload files if any
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${claimId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('warranty-claim-photos')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          // Create attachment record
      const { error: attachmentError } = await supabase
            .from('warranty_message_attachments' as any)
            .insert({
              message_id: (messageData as any).id,
              file_name: file.name,
              file_path: filePath,
              file_type: file.type,
              file_size: file.size,
            });

          if (attachmentError) throw attachmentError;
        }
      }

      setNewMessage('');
      setSelectedFiles([]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length + selectedFiles.length > 5) {
        toast.error('Maximum 5 files allowed');
        return;
      }
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <File className="h-4 w-4" />;
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('warranty-claim-photos')
        .download(attachment.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const handleMarkAsResolved = async () => {
    if (!confirm('Are you sure you want to mark this claim as resolved? This will close the conversation and notify the homeowner.')) {
      return;
    }

    try {
      setResolving(true);

      // Update claim status
      const { error: claimError } = await supabase
        .from('warranty_claims' as any)
        .update({
          claim_status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', claimId);

      if (claimError) throw claimError;

      // Add system message
      await supabase
        .from('warranty_claim_messages' as any)
        .insert({
          claim_id: claimId,
          sender_id: currentUserId,
          message: '✓ This claim has been marked as resolved. The conversation is now closed.',
        });

      // Send notification via edge function
      try {
        await supabase.functions.invoke('send-warranty-claim-notification', {
          body: {
            claimId,
            claimNumber,
            type: 'resolved',
            message: 'Your warranty claim has been resolved and closed.'
          }
        });
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }

      toast.success('Claim marked as resolved and homeowner notified');
      
      if (onClaimResolved) {
        onClaimResolved();
      }
    } catch (error: any) {
      console.error('Error marking claim as resolved:', error);
      toast.error('Failed to mark claim as resolved');
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading messages...</div>;
  }

  return (
    <div className="flex flex-col h-[500px] border rounded-lg">
      <div className="p-4 border-b bg-muted/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Messages - Claim #{claimNumber}</h3>
            <p className="text-sm text-muted-foreground">
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
            </p>
          </div>
          {isAdmin && (
            <Button
              variant="default"
              size="sm"
              onClick={handleMarkAsResolved}
              disabled={resolving}
            >
              {resolving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resolving...
                </>
              ) : (
                'Mark as Resolved'
              )}
            </Button>
          )}
        </div>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => {
            const isOwn = msg.sender_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg p-3`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold">{msg.sender_name}</span>
                    <span className="text-xs opacity-70">
                      {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                    </span>
                    {msg.read_at && isOwn && (
                      <span className="text-xs opacity-70">✓✓</span>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-2 text-xs bg-background/20 rounded p-2 cursor-pointer hover:bg-background/30"
                          onClick={() => handleDownload(att)}
                        >
                          {getFileIcon(att.file_type)}
                          <span className="flex-1 truncate">{att.file_name}</span>
                          <span className="opacity-70">{formatFileSize(att.file_size)}</span>
                          <Download className="h-3 w-3" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        {selectedFiles.length > 0 && (
          <div className="mb-2 space-y-1">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 text-sm bg-muted rounded p-2">
                <File className="h-4 w-4" />
                <span className="flex-1 truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFile(index)}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {isAdmin && (
          <div className="mb-3">
            <MessageTemplateSelector 
              onSelectTemplate={(template) => setNewMessage(template)}
              claimData={claimData}
            />
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};
