import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MessageSquare, Search, Flag, CheckCircle, Eye, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export default function AdminMessagesOversight() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedThread, setSelectedThread] = useState<any>(null);

  // Fetch subcontractor messages as the primary message source
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["admin-messages-oversight", filterType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subcontractor_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch bid opportunity messages
  const { data: bidMessages = [] } = useQuery({
    queryKey: ["admin-bid-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bid_opportunity_messages")
        .select("*, bid_opportunities(title)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  // Group messages by project_id for thread view
  const threads = messages.reduce((acc: Record<string, any[]>, msg: any) => {
    const key = msg.project_id || msg.bid_package_id || "general";
    if (!acc[key]) acc[key] = [];
    acc[key].push(msg);
    return acc;
  }, {});

  const threadList = Object.entries(threads).map(([key, msgs]) => ({
    id: key,
    lastMessage: msgs[0],
    messageCount: msgs.length,
    messages: msgs,
    hasUnread: msgs.some((m: any) => !m.read_by || m.read_by.length === 0),
    lastActivity: msgs[0]?.created_at,
  }));

  const filteredThreads = threadList.filter((t) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return t.lastMessage?.message?.toLowerCase().includes(searchLower) ||
        t.id.toLowerCase().includes(searchLower);
    }
    if (filterType === "unread") return t.hasUnread;
    return true;
  });

  const totalMessages = messages.length + bidMessages.length;
  const unreadCount = threadList.filter((t) => t.hasUnread).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Messages Oversight</h1>
          <p className="text-muted-foreground">Monitor communication across all projects</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{totalMessages}</p>
                  <p className="text-xs text-muted-foreground">Total Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-2xl font-bold">{unreadCount}</p>
                  <p className="text-xs text-muted-foreground">Unread Threads</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{threadList.length}</p>
                  <p className="text-xs text-muted-foreground">Active Threads</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{bidMessages.length}</p>
                  <p className="text-xs text-muted-foreground">Bid Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search messages..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Threads</SelectItem>
              <SelectItem value="unread">Unread Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Thread Table */}
        <Card>
          <CardHeader><CardTitle>Message Threads</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading messages...</p>
            ) : filteredThreads.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No message threads found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thread</TableHead>
                    <TableHead>Sender Type</TableHead>
                    <TableHead>Messages</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredThreads.map((thread) => (
                    <TableRow key={thread.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm truncate max-w-[300px]">{thread.lastMessage?.message || "—"}</p>
                          <p className="text-xs text-muted-foreground">Project: {thread.id === "general" ? "General" : thread.id.slice(0, 8)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{thread.lastMessage?.sender_type || "unknown"}</Badge>
                      </TableCell>
                      <TableCell>{thread.messageCount}</TableCell>
                      <TableCell className="text-sm">
                        {thread.lastActivity ? format(new Date(thread.lastActivity), "MMM d, h:mm a") : "—"}
                      </TableCell>
                      <TableCell>
                        {thread.hasUnread ? (
                          <Badge variant="destructive" className="text-xs">Unread</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Read</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedThread(thread)}>
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Thread Detail Sheet */}
      <Sheet open={!!selectedThread} onOpenChange={() => setSelectedThread(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Thread Messages</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-120px)] mt-4">
            <div className="space-y-3">
              {selectedThread?.messages?.map((msg: any) => (
                <div key={msg.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-xs">{msg.sender_type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(msg.created_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <p className="text-sm">{msg.message}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
