import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  MessageSquare,
  Send,
  Paperclip,
  X,
  Download,
  Reply,
  Users,
  AtSign,
  Bell,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserProfile {
  id: string;
  display_name: string;
}

interface ChatChannel {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface ChatMessage {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  parent_message_id: string | null;
  lead_id: string | null;
  created_at: string;
  user_email?: string;
  attachments?: ChatAttachment[];
  replies?: ChatMessage[];
}

interface ChatAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
}

export function TeamChat() {
  const { toast } = useToast();
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [unreadMentions, setUnreadMentions] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchChannels();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      subscribeToMentions();
    }
  }, [currentUserId]);

  useEffect(() => {
    if (selectedChannel) {
      fetchMessages(selectedChannel.id);
      subscribeToMessages(selectedChannel.id);
    }
  }, [selectedChannel]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchUsers = async () => {
    // Fetch all user roles to get team members and subcontractors
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id');

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
      return;
    }

    const userIds = userRoles?.map(r => r.user_id) || [];
    const userProfiles: UserProfile[] = [];

    // Fetch user data from auth
    for (const userId of userIds) {
      try {
        const { data: authData } = await supabase.auth.admin.getUserById(userId);
        if (authData?.user) {
          userProfiles.push({
            id: authData.user.id,
            display_name: authData.user.email?.split('@')[0] || 'User',
          });
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    }

    setUsers(userProfiles);
  };

  const subscribeToMentions = () => {
    const channel = supabase
      .channel('mentions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_message_mentions',
          filter: `mentioned_user_id=eq.${currentUserId}`,
        },
        () => {
          fetchUnreadMentions();
        }
      )
      .subscribe();

    fetchUnreadMentions();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchUnreadMentions = async () => {
    if (!currentUserId) return;

    const { count } = await supabase
      .from('chat_message_mentions')
      .select('*', { count: 'exact', head: true })
      .eq('mentioned_user_id', currentUserId)
      .is('read_at', null);

    setUnreadMentions(count || 0);
  };

  const fetchChannels = async () => {
    const { data, error } = await supabase
      .from('chat_channels')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching channels:', error);
      return;
    }

    setChannels(data || []);
    if (data && data.length > 0 && !selectedChannel) {
      setSelectedChannel(data[0]);
    }
  };

  const fetchMessages = async (channelId: string) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        chat_message_attachments (*)
      `)
      .eq('channel_id', channelId)
      .is('parent_message_id', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    // Fetch user emails
    const messagesWithUsers = await Promise.all(
      (data || []).map(async (msg) => {
        const { data: userData } = await supabase.auth.admin.getUserById(msg.user_id);
        
        // Fetch replies
        const { data: replies } = await supabase
          .from('chat_messages')
          .select(`
            *,
            chat_message_attachments (*)
          `)
          .eq('parent_message_id', msg.id)
          .order('created_at', { ascending: true });

        const repliesWithUsers = await Promise.all(
          (replies || []).map(async (reply) => {
            const { data: replyUserData } = await supabase.auth.admin.getUserById(reply.user_id);
            return {
              ...reply,
              user_email: replyUserData?.user?.email,
              attachments: reply.chat_message_attachments || []
            };
          })
        );

        return {
          ...msg,
          user_email: userData?.user?.email,
          attachments: msg.chat_message_attachments || [],
          replies: repliesWithUsers
        };
      })
    );

    setMessages(messagesWithUsers);
  };

  const subscribeToMessages = (channelId: string) => {
    const channel = supabase
      .channel(`chat-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        () => {
          fetchMessages(channelId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    if (!selectedChannel || !currentUserId) return;

    try {
      // Create message
      const { data: message, error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          channel_id: selectedChannel.id,
          user_id: currentUserId,
          content: newMessage.trim(),
          parent_message_id: replyingTo?.id || null,
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Upload attachments
      if (attachments.length > 0 && message) {
        for (const file of attachments) {
          const filePath = `${currentUserId}/${Date.now()}-${file.name}`;
          
          const { error: uploadError } = await supabase.storage
            .from('chat-files')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          // Create attachment record
          await supabase
            .from('chat_message_attachments')
            .insert({
              message_id: message.id,
              file_name: file.name,
              file_path: filePath,
              file_size: file.size,
              file_type: file.type,
            });
        }
      }

      setNewMessage('');
      setAttachments([]);
      setReplyingTo(null);

      toast({
        title: "Message sent",
        description: "Your message has been sent to the team",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setNewMessage(value);
    setCursorPosition(cursorPos);

    // Check for @ mention trigger
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      // Only show dropdown if @ is recent and no space after it
      if (!textAfterAt.includes(' ') && textAfterAt.length < 50) {
        setMentionSearch(textAfterAt);
        setShowMentionDropdown(true);
        return;
      }
    }
    
    setShowMentionDropdown(false);
  };

  const insertMention = (user: UserProfile) => {
    const textBeforeCursor = newMessage.substring(0, cursorPosition);
    const textAfterCursor = newMessage.substring(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    const beforeMention = newMessage.substring(0, lastAtIndex);
    const mention = `@[${user.display_name}](${user.id}) `;
    const newText = beforeMention + mention + textAfterCursor;
    
    setNewMessage(newText);
    setShowMentionDropdown(false);
    setMentionSearch('');
    
    // Focus back on textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const renderMessageContent = (content: string) => {
    // Replace mention markdown with styled mentions
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {content.substring(lastIndex, match.index)}
          </span>
        );
      }

      // Add mention badge
      parts.push(
        <Badge key={`mention-${match.index}`} variant="secondary" className="mx-1">
          <AtSign className="h-3 w-3 mr-1" />
          {match[1]}
        </Badge>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {content.substring(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : content;
  };

  const filteredUsers = users.filter(user =>
    user.id !== currentUserId &&
    user.display_name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments([...attachments, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const downloadAttachment = async (attachment: ChatAttachment) => {
    const { data, error } = await supabase.storage
      .from('chat-files')
      .download(attachment.file_path);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.file_name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getUserInitials = (email?: string) => {
    if (!email) return '?';
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg">
          <MessageSquare className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
        <div className="flex h-full flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Team Chat</SheetTitle>
            <SheetDescription>
              Communicate with your sales team in real-time
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 overflow-hidden">
            {/* Channels Sidebar */}
            <div className="w-48 border-r bg-muted/20">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-1">
                  {channels.map((channel) => (
                    <Button
                      key={channel.id}
                      variant={selectedChannel?.id === channel.id ? "secondary" : "ghost"}
                      className="w-full justify-start text-left"
                      onClick={() => setSelectedChannel(channel)}
                    >
                      <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{channel.name}</span>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
              <div className="p-3 border-b">
                <h3 className="font-semibold">{selectedChannel?.name}</h3>
                {selectedChannel?.description && (
                  <p className="text-sm text-muted-foreground">{selectedChannel.description}</p>
                )}
              </div>

              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="space-y-2">
                      <Card className={message.user_id === currentUserId ? 'bg-primary/5' : ''}>
                        <CardContent className="p-3">
                          <div className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {getUserInitials(message.user_email)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">
                                  {message.user_email?.split('@')[0]}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-sm">{message.content}</p>
                              
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="space-y-1 mt-2">
                                  {message.attachments.map((attachment) => (
                                    <div
                                      key={attachment.id}
                                      className="flex items-center gap-2 text-xs bg-muted p-2 rounded"
                                    >
                                      <Paperclip className="h-3 w-3" />
                                      <span className="flex-1 truncate">{attachment.file_name}</span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                        onClick={() => downloadAttachment(attachment)}
                                      >
                                        <Download className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-xs"
                                onClick={() => setReplyingTo(message)}
                              >
                                <Reply className="h-3 w-3 mr-1" />
                                Reply
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Replies */}
                      {message.replies && message.replies.length > 0 && (
                        <div className="ml-12 space-y-2">
                          {message.replies.map((reply) => (
                            <Card key={reply.id} className="bg-muted/30">
                              <CardContent className="p-2">
                                <div className="flex gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs">
                                      {getUserInitials(reply.user_email)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-xs">
                                        {reply.user_email?.split('@')[0]}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                      </span>
                                    </div>
                                    <p className="text-xs">{reply.content}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t space-y-2">
                {replyingTo && (
                  <div className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
                    <Reply className="h-4 w-4" />
                    <span className="flex-1">Replying to {replyingTo.user_email?.split('@')[0]}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => setReplyingTo(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((file, index) => (
                      <Badge key={index} variant="secondary">
                        {file.name}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-4 w-4 p-0 ml-2"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    multiple
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 min-h-[60px] max-h-[120px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
