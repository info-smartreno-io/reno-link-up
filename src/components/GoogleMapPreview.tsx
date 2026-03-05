import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { MapPin, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GoogleMapPreviewProps {
  address: string;
  className?: string;
}

export function GoogleMapPreview({ address, className = '' }: GoogleMapPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [mapUrl, setMapUrl] = useState('');

  useEffect(() => {
    if (address) {
      // Create Google Maps embed URL
      const encodedAddress = encodeURIComponent(address);
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (apiKey) {
        setMapUrl(
          `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedAddress}&zoom=15`
        );
      } else {
        // Fallback to static map URL if no API key
        setMapUrl(
          `https://maps.googleapis.com/maps/api/staticmap?center=${encodedAddress}&zoom=15&size=400x300&markers=${encodedAddress}`
        );
      }
    }
  }, [address]);

  const openInGoogleMaps = () => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(mapsUrl, '_blank');
  };

  if (!address) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">No address provided</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        <iframe
          width="100%"
          height="200"
          frameBorder="0"
          style={{ border: 0 }}
          src={mapUrl}
          allowFullScreen
          loading="lazy"
          onLoad={() => setIsLoading(false)}
          className="w-full"
        />
      </div>
      <div className="p-3 flex items-center justify-between gap-2 bg-muted/50">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm truncate">{address}</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={openInGoogleMaps}
          className="flex-shrink-0"
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          Open
        </Button>
      </div>
    </Card>
  );
}
