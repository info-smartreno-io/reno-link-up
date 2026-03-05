import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  location: string;
  status: string;
}

interface LeadsMapProps {
  leads: Lead[];
  currentLocation?: { lat: number; lng: number };
}

export function LeadsMap({ leads, currentLocation }: LeadsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    // Try to load token from environment or local storage
    const storedToken = localStorage.getItem('mapbox_token');
    if (storedToken) {
      setMapboxToken(storedToken);
    } else {
      setShowTokenInput(true);
    }
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    try {
      mapboxgl.accessToken = mapboxToken;
      
      // Initialize map centered on North Jersey
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-74.1724, 40.7357], // North Jersey coordinates
        zoom: 10,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl(),
        'top-right'
      );

      // Add current location marker if available
      if (currentLocation) {
        new mapboxgl.Marker({ color: '#3b82f6' })
          .setLngLat([currentLocation.lng, currentLocation.lat])
          .setPopup(
            new mapboxgl.Popup().setHTML('<strong>Your Location</strong>')
          )
          .addTo(map.current);
      }

      // Save token to localStorage
      localStorage.setItem('mapbox_token', mapboxToken);
      setShowTokenInput(false);
    } catch (error) {
      console.error('Error initializing map:', error);
      setShowTokenInput(true);
    }

    // Cleanup
    return () => {
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      map.current?.remove();
    };
  }, [mapboxToken, currentLocation]);

  useEffect(() => {
    if (!map.current || !mapboxToken) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add lead markers (using geocoding would require addresses)
    // For now, we'll show leads in a cluster around North Jersey
    const colors: { [key: string]: string } = {
      new_lead: '#10b981',
      contacted: '#f59e0b',
      qualified: '#3b82f6',
      lost: '#ef4444',
    };

    leads.forEach((lead, index) => {
      // Generate random positions around North Jersey for demo
      // In production, you'd geocode the actual addresses
      const lat = 40.7357 + (Math.random() - 0.5) * 0.2;
      const lng = -74.1724 + (Math.random() - 0.5) * 0.2;

      const marker = new mapboxgl.Marker({ 
        color: colors[lead.status] || '#6b7280' 
      })
        .setLngLat([lng, lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div class="p-2">
              <strong>${lead.name}</strong><br/>
              <span class="text-sm text-gray-600">${lead.location}</span><br/>
              <span class="text-xs text-gray-500">Status: ${lead.status}</span>
            </div>`
          )
        )
        .addTo(map.current!);

      markers.current.push(marker);
    });
  }, [leads, mapboxToken]);

  if (showTokenInput) {
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-card">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            To display the map, please enter your Mapbox public token. You can get one for free at{' '}
            <a 
              href="https://mapbox.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              mapbox.com
            </a>
          </AlertDescription>
        </Alert>
        <div className="space-y-2">
          <Label htmlFor="mapbox-token">Mapbox Public Token</Label>
          <Input
            id="mapbox-token"
            type="text"
            placeholder="pk.eyJ1..."
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Your token will be saved locally in your browser
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      <div className="absolute top-4 left-4 bg-card p-3 rounded-lg shadow-lg space-y-2">
        <div className="text-sm font-semibold">Legend</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
            <span>New Lead</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
            <span>Contacted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
            <span>Qualified</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
            <span>Lost</span>
          </div>
        </div>
      </div>
    </div>
  );
}
