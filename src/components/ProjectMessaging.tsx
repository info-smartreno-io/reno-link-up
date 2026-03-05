import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Send, Loader2, Search, Filter, X, Paperclip, Download, FileText, Image as ImageIcon, File } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MessageAttachment {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
}

interface Message {
  id: string;
  project_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender_name?: string;
  is_own_message: boolean;
  attachments?: MessageAttachment[];
}

interface ProjectMessagingProps {
  projectId: string;
  projectName: string;
}

export default function ProjectMessaging({ projectId, projectName }: ProjectMessagingProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [senderFilter, setSenderFilter] = useState<"all" | "mine" | "others">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCurrentUser();
    fetchMessages();
    setupRealtimeSubscription();
  }, [projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [filteredMessages]);

  useEffect(() => {
    applyFilters();
  }, [messages, searchTerm, senderFilter, dateFrom, dateTo]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const applyFilters = () => {
    let filtered = [...messages];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(msg => 
        msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.sender_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sender filter
    if (senderFilter === "mine") {
      filtered = filtered.filter(msg => msg.is_own_message);
    } else if (senderFilter === "others") {
      filtered = filtered.filter(msg => !msg.is_own_message);
    }

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(msg => new Date(msg.created_at) >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(msg => new Date(msg.created_at) <= toDate);
    }

    setFilteredMessages(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSenderFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters = searchTerm || senderFilter !== "all" || dateFrom || dateTo;

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("project_messages")
        .select(`
          id,
          project_id,
          sender_id,
          message,
          created_at
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Get sender profiles
      const senderIds = [...new Set(data?.map(m => m.sender_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", senderIds);

      // Get attachments for all messages
      const messageIds = data?.map(m => m.id) || [];
      const { data: attachments } = await supabase
        .from("message_attachments")
        .select("*")
        .in("message_id", messageIds);

      // Enrich messages with sender names and attachments
      const enrichedMessages: Message[] = (data || []).map((msg: any) => ({
        ...msg,
        sender_name: profiles?.find(p => p.id === msg.sender_id)?.full_name || "Unknown",
        is_own_message: msg.sender_id === currentUserId,
        attachments: attachments?.filter(a => a.message_id === msg.id) || [],
      }));

      setMessages(enrichedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`project-messages-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "project_messages",
          filter: `project_id=eq.${projectId}`,
        },
        async (payload) => {
          console.log("New message received:", payload);
          
          // Get sender profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", payload.new.sender_id)
            .maybeSingle();

          const newMsg: Message = {
            id: payload.new.id,
            project_id: payload.new.project_id,
            sender_id: payload.new.sender_id,
            message: payload.new.message,
            created_at: payload.new.created_at,
            sender_name: profile?.full_name || "Unknown",
            is_own_message: payload.new.sender_id === currentUserId,
          };

          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!newMessage.trim() && selectedFiles.length === 0) || !currentUserId) return;

    setSending(true);
    setUploadingFiles(true);
    
    try {
      // Insert the message first
      const { data: messageData, error: messageError } = await supabase
        .from("project_messages")
        .insert({
          project_id: projectId,
          sender_id: currentUserId,
          message: newMessage.trim() || "(sent attachments)",
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Upload files if any
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${messageData.id}/${Date.now()}.${fileExt}`;
          const filePath = `${projectId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("message-attachments")
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          // Create attachment record
          return supabase.from("message_attachments").insert({
            message_id: messageData.id,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
          });
        });

        await Promise.all(uploadPromises);
      }

      setNewMessage("");
      setSelectedFiles([]);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to send message");
    } finally {
      setSending(false);
      setUploadingFiles(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024); // 10MB limit
      
      if (validFiles.length < files.length) {
        toast.error("Some files were too large (max 10MB)");
      }
      
      setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="h-4 w-4" />;
    if (fileType === "application/pdf") return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const downloadFile = async (attachment: MessageAttachment) => {
    try {
      const { data, error } = await supabase.storage
        .from("message-attachments")
        .download(attachment.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  const getAttachmentUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from("message-attachments")
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Project Messages</CardTitle>
            <CardDescription>Chat about {projectName}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Badge variant="secondary" className="gap-1">
                <Filter className="h-3 w-3" />
                {filteredMessages.length} of {messages.length}
              </Badge>
            )}
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">Search Messages</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search by content or sender..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sender">Filter by Sender</Label>
                    <Select value={senderFilter} onValueChange={(value: any) => setSenderFilter(value)}>
                      <SelectTrigger id="sender">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Messages</SelectItem>
                        <SelectItem value="mine">My Messages</SelectItem>
                        <SelectItem value="others">Others' Messages</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Date Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">From</Label>
                        <Input
                          id="dateFrom"
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="dateTo" className="text-xs text-muted-foreground">To</Label>
                        <Input
                          id="dateTo"
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="w-full gap-2"
                    >
                      <X className="h-4 w-4" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-4 py-4">
            {filteredMessages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {hasActiveFilters ? "No messages match your filters" : "No messages yet. Start the conversation!"}
              </div>
            ) : (
              filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.is_own_message ? "flex-row-reverse" : "flex-row"}`}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <div className="h-full w-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                      {message.sender_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  </Avatar>
                  <div className={`flex flex-col gap-1 max-w-[70%] ${message.is_own_message ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">{message.sender_name}</span>
                      <span>{formatTime(message.created_at)}</span>
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        message.is_own_message
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {message.message && (
                        <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                      )}
                      
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {message.attachments.map((attachment) => {
                            const isImage = attachment.file_type.startsWith("image/");
                            return (
                              <div key={attachment.id} className="space-y-1">
                                {isImage ? (
                                  <div className="relative group">
                                    <img
                                      src={getAttachmentUrl(attachment.file_path)}
                                      alt={attachment.file_name}
                                      className="max-w-sm rounded-lg cursor-pointer"
                                      onClick={() => setPreviewImage(getAttachmentUrl(attachment.file_path))}
                                    />
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        downloadFile(attachment);
                                      }}
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div
                                    className={`flex items-center gap-2 p-2 rounded border ${
                                      message.is_own_message
                                        ? "bg-primary-foreground/10 border-primary-foreground/20"
                                        : "bg-background border-border"
                                    }`}
                                  >
                                    {getFileIcon(attachment.file_type)}
                                    <span className="text-xs flex-1 truncate">{attachment.file_name}</span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => downloadFile(attachment)}
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="space-y-3">
            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <Badge key={index} variant="secondary" className="gap-2 pr-1">
                    {getFileIcon(file.type)}
                    <span className="text-xs max-w-[120px] truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
            
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending || selectedFiles.length >= 5}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sending}
                className="flex-1"
                maxLength={1000}
              />
              <Button 
                type="submit" 
                disabled={(!newMessage.trim() && selectedFiles.length === 0) || sending} 
                size="icon"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </CardContent>

      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Image Preview</DialogTitle>
            </DialogHeader>
            <div className="relative">
              <img src={previewImage} alt="Preview" className="w-full h-auto rounded-lg" />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
