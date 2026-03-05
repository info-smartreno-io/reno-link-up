import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ShieldCheck, Clock, CheckCircle2, AlertTriangle, Plus, X, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { WarrantyClaimMessaging } from "./WarrantyClaimMessaging";

interface WarrantyClaim {
  id: string;
  claim_number: string;
  claim_status: string;
  priority: string;
  reported_issue_title: string;
  reported_area: string;
  date_reported: string;
  within_coverage: boolean;
  resolved_at: string | null;
  resolution_summary: string | null;
  project_id: string;
}

interface ClaimEvent {
  id: string;
  event_type: string;
  message: string;
  created_at: string;
  actor_role: string;
}

interface ClaimPhoto {
  name: string;
  url: string;
}

export function HomeownerWarrantyHistory() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<string | null>(null);
  const [claimEvents, setClaimEvents] = useState<ClaimEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [claimPhotos, setClaimPhotos] = useState<Record<string, ClaimPhoto[]>>({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState<ClaimPhoto[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    fetchClaims();

    // Set up realtime subscription for warranty claims
    const claimsChannel = supabase
      .channel('warranty-claims-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'warranty_claims',
          filter: `homeowner_id=eq.${supabase.auth.getUser().then(({ data }) => data.user?.id)}`
        },
        (payload) => {
          console.log('Warranty claim change:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newClaim = payload.new as any as WarrantyClaim;
            setClaims(prev => [newClaim, ...prev]);
            toast.success('New warranty claim created');
          } else if (payload.eventType === 'UPDATE') {
            const updatedClaim = payload.new as any as WarrantyClaim;
            setClaims(prev => prev.map(claim => 
              claim.id === updatedClaim.id ? updatedClaim : claim
            ));
            
            // Show notification for status changes
            const oldClaim = payload.old as any as WarrantyClaim;
            if (oldClaim.claim_status !== updatedClaim.claim_status) {
              toast.info(`Claim #${updatedClaim.claim_number} status updated to ${updatedClaim.claim_status.replace(/_/g, ' ')}`);
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedClaim = payload.old as any as WarrantyClaim;
            setClaims(prev => prev.filter(claim => claim.id !== deletedClaim.id));
            toast.info('Warranty claim removed');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(claimsChannel);
    };
  }, []);

  useEffect(() => {
    if (selectedClaim) {
      fetchClaimEvents(selectedClaim);
      fetchClaimPhotos(selectedClaim);

      // Set up realtime subscription for claim events
      const eventsChannel = supabase
        .channel(`claim-events-${selectedClaim}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'warranty_claim_events',
            filter: `claim_id=eq.${selectedClaim}`
          },
          (payload) => {
            console.log('New claim event:', payload);
            const newEvent = payload.new as any as ClaimEvent;
            setClaimEvents(prev => [newEvent, ...prev]);
            toast.info('New update on warranty claim');
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(eventsChannel);
      };
    }
  }, [selectedClaim]);

  async function fetchClaims() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all warranty claims for user's projects
      const { data, error } = await supabase
        .from('warranty_claims' as any)
        .select('*')
        .eq('homeowner_id', user.id)
        .order('date_reported', { ascending: false });

      if (error) throw error;
      setClaims((data || []) as any as WarrantyClaim[]);
    } catch (error: any) {
      console.error('Error fetching claims:', error);
      toast.error('Failed to load warranty claims');
    } finally {
      setLoading(false);
    }
  }

  async function fetchClaimEvents(claimId: string) {
    try {
      setLoadingEvents(true);
      const { data, error } = await supabase
        .from('warranty_claim_events' as any)
        .select('*')
        .eq('claim_id', claimId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClaimEvents((data || []) as any as ClaimEvent[]);
    } catch (error: any) {
      console.error('Error fetching events:', error);
    } finally {
      setLoadingEvents(false);
    }
  }

  async function fetchClaimPhotos(claimId: string) {
    try {
      const { data, error } = await supabase.storage
        .from('warranty-claim-photos')
        .list(claimId);

      if (error) throw error;

      if (data) {
        const photosWithUrls = await Promise.all(
          data.map(async (file) => {
            const { data: { publicUrl } } = supabase.storage
              .from('warranty-claim-photos')
              .getPublicUrl(`${claimId}/${file.name}`);
            
            return {
              name: file.name,
              url: publicUrl
            };
          })
        );

        setClaimPhotos(prev => ({
          ...prev,
          [claimId]: photosWithUrls
        }));
      }
    } catch (error: any) {
      console.error('Error fetching photos:', error);
    }
  }

  const openLightbox = (photos: ClaimPhoto[], index: number) => {
    setLightboxPhotos(photos);
    setCurrentPhotoIndex(index);
    setLightboxOpen(true);
  };

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % lightboxPhotos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + lightboxPhotos.length) % lightboxPhotos.length);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'in_review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'info_requested': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'scheduled_inspection': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'in_repair': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'denied': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'resolved') return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    if (status === 'denied') return <AlertTriangle className="w-5 h-5 text-red-500" />;
    return <Clock className="w-5 h-5 text-blue-500" />;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Warranty Claims</h2>
            <p className="text-sm text-muted-foreground">
              View and track your warranty claims
            </p>
          </div>
        </div>
        <Button onClick={() => navigate('/homeowner/warranty-claim')}>
          <Plus className="w-4 h-4 mr-2" />
          New Claim
        </Button>
      </div>

      {/* Claims List */}
      {claims.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Warranty Claims</h3>
            <p className="text-muted-foreground mb-4">
              You haven't submitted any warranty claims yet.
            </p>
            <Button onClick={() => navigate('/homeowner/warranty-claim')}>
              <Plus className="w-4 h-4 mr-2" />
              Submit Your First Claim
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {claims.map((claim) => (
            <Card
              key={claim.id}
              className={`cursor-pointer transition-all ${
                selectedClaim === claim.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedClaim(selectedClaim === claim.id ? null : claim.id)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(claim.claim_status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{claim.reported_issue_title}</h3>
                        {getPriorityIcon(claim.priority)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Claim #{claim.claim_number}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(claim.claim_status)}>
                    {claim.claim_status.replace(/_/g, ' ')}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Area</p>
                    <p className="font-medium">{claim.reported_area || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Reported</p>
                    <p className="font-medium">{formatDate(claim.date_reported)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Coverage</p>
                    <Badge variant={claim.within_coverage ? 'default' : 'destructive'} className="mt-1">
                      {claim.within_coverage ? 'Covered' : 'Not Covered'}
                    </Badge>
                  </div>
                  {claim.resolved_at && (
                    <div>
                      <p className="text-muted-foreground">Resolved</p>
                      <p className="font-medium">{formatDate(claim.resolved_at)}</p>
                    </div>
                  )}
                </div>

                {claim.resolution_summary && (
                  <div className="bg-muted/50 rounded-lg p-3 mb-4">
                    <p className="text-sm font-medium mb-1">Resolution</p>
                    <p className="text-sm text-muted-foreground">{claim.resolution_summary}</p>
                  </div>
                )}

                {/* Photo Gallery */}
                {claimPhotos[claim.id] && claimPhotos[claim.id].length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Photos ({claimPhotos[claim.id].length})
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {claimPhotos[claim.id].map((photo, index) => (
                        <button
                          key={photo.name}
                          onClick={() => openLightbox(claimPhotos[claim.id], index)}
                          className="relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-colors group"
                        >
                          <img
                            src={photo.url}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                {selectedClaim === claim.id && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Status Timeline
                    </h4>
                    
                    {loadingEvents ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    ) : claimEvents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No timeline events yet</p>
                    ) : (
                      <div className="space-y-3">
                        {claimEvents.map((event, index) => (
                          <div key={event.id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className={`w-2 h-2 rounded-full ${
                                index === 0 ? 'bg-primary' : 'bg-muted-foreground/50'
                              }`} />
                              {index < claimEvents.length - 1 && (
                                <div className="w-0.5 h-full bg-border mt-1" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium text-sm">
                                    {event.event_type.replace(/_/g, ' ')}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {event.message}
                                  </p>
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                                  {formatDateTime(event.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Claim Detail Dialog */}
      <Dialog open={!!selectedClaim} onOpenChange={(open) => !open && setSelectedClaim(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Claim #{claims.find(c => c.id === selectedClaim)?.claim_number}</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline">
              <ScrollArea className="h-[500px] pr-4">
                {loadingEvents ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : claimEvents.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No timeline events yet</p>
                ) : (
                  <div className="space-y-4">
                    {claimEvents.map((event) => (
                      <div key={event.id} className="flex gap-3">
                        <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium capitalize">
                              {event.event_type.replace(/_/g, ' ')}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(event.created_at), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                          {event.message && (
                            <p className="text-sm text-muted-foreground">{event.message}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="photos">
              <ScrollArea className="h-[500px] pr-4">
                {selectedClaim && claimPhotos[selectedClaim] && claimPhotos[selectedClaim].length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {claimPhotos[selectedClaim].map((photo, index) => (
                      <div
                        key={photo.name}
                        className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openLightbox(claimPhotos[selectedClaim], index)}
                      >
                        <img
                          src={photo.url}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No photos available</p>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="messages">
              {selectedClaim && (
                <WarrantyClaimMessaging
                  claimId={selectedClaim}
                  claimNumber={claims.find(c => c.id === selectedClaim)?.claim_number || ''}
                />
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl w-full p-0 overflow-hidden bg-black/95">
          <div className="relative w-full h-[80vh] flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>

            {lightboxPhotos.length > 0 && (
              <>
                <img
                  src={lightboxPhotos[currentPhotoIndex]?.url}
                  alt={`Photo ${currentPhotoIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />

                {lightboxPhotos.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                      onClick={prevPhoto}
                      disabled={currentPhotoIndex === 0}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                      onClick={nextPhoto}
                      disabled={currentPhotoIndex === lightboxPhotos.length - 1}
                    >
                      <ChevronRight className="w-6 h-6" />
                    </Button>
                  </>
                )}

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
                  {currentPhotoIndex + 1} / {lightboxPhotos.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
