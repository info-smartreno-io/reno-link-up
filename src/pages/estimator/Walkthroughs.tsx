import { useState, useEffect } from "react";
import { EstimatorLayout } from "@/components/estimator/EstimatorLayout";
import CreateWalkthroughForm from "@/components/forms/CreateWalkthroughForm";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Filter, Plus, Calendar, MapPin, Clock, ImageUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Walkthrough {
  id: string;
  walkthrough_number: string;
  client_name: string;
  project_name: string;
  address: string;
  date: string;
  time: string;
  status: string;
  photos_uploaded: boolean;
}

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500",
  in_progress: "bg-yellow-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
};

export default function EstimatorWalkthroughs() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [walkthroughs, setWalkthroughs] = useState<Walkthrough[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWalkthroughs();

    // Set up real-time subscription
    const channel = supabase
      .channel('walkthroughs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'walkthroughs'
        },
        () => {
          fetchWalkthroughs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchWalkthroughs = async () => {
    try {
      const { data, error } = await supabase
        .from('walkthroughs')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setWalkthroughs(data || []);
    } catch (error: any) {
      console.error('Error fetching walkthroughs:', error);
      toast({
        title: "Error",
        description: "Failed to load walkthroughs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredWalkthroughs = walkthroughs.filter(walkthrough =>
    walkthrough.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    walkthrough.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    walkthrough.walkthrough_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <EstimatorLayout>
    <div className="min-h-screen bg-muted/20">
      <div className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/estimator/dashboard")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Walkthroughs</h1>
            <p className="text-muted-foreground">Schedule and manage site visits</p>
          </div>
          <CreateWalkthroughForm onSuccess={fetchWalkthroughs} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search walkthroughs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Walkthroughs ({filteredWalkthroughs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredWalkthroughs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No walkthroughs found</p>
              </div>
            ) : (
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Photos</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWalkthroughs.map((walkthrough) => (
                  <TableRow key={walkthrough.id}>
                    <TableCell className="font-medium">{walkthrough.walkthrough_number}</TableCell>
                    <TableCell>{walkthrough.client_name}</TableCell>
                    <TableCell>{walkthrough.project_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {walkthrough.address}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(walkthrough.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {walkthrough.time}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <div className={`h-2 w-2 rounded-full ${statusColors[walkthrough.status] || 'bg-gray-500'}`} />
                        {walkthrough.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {walkthrough.photos_uploaded ? (
                        <Badge variant="outline" className="gap-1">
                          <ImageUp className="h-3 w-3" />
                          Uploaded
                        </Badge>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="gap-1"
                          onClick={() => navigate(`/estimator/upload-photos/${walkthrough.id}`)}
                        >
                          <ImageUp className="h-3 w-3" />
                          Upload
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
          </>
        )}
      </main>
    </div>
    </EstimatorLayout>
  );
}