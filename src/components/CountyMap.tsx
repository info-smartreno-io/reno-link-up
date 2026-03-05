import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface CountyMapProps {
  countyName: string;
}

// Simplified regional map showing county location in Northern NJ
const COUNTY_COORDINATES: Record<string, { x: number; y: number }> = {
  bergen: { x: 45, y: 20 },
  passaic: { x: 55, y: 35 },
  morris: { x: 65, y: 50 },
  essex: { x: 45, y: 55 },
  hudson: { x: 30, y: 45 },
};

export function CountyMap({ countyName }: CountyMapProps) {
  const normalizedCounty = countyName.toLowerCase().replace(' county', '').trim();
  const coords = COUNTY_COORDINATES[normalizedCounty];

  if (!coords) return null;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          {countyName} Location
        </h3>
        <div className="relative w-full aspect-[4/3] bg-secondary/20 rounded-lg overflow-hidden">
          {/* Simple SVG map of Northern NJ region */}
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Background region outline */}
            <path
              d="M 20,15 L 80,15 L 85,30 L 80,50 L 75,70 L 65,85 L 45,85 L 30,75 L 20,55 Z"
              fill="hsl(var(--muted))"
              stroke="hsl(var(--border))"
              strokeWidth="0.5"
              opacity="0.6"
            />
            
            {/* All counties as subtle shapes */}
            {Object.entries(COUNTY_COORDINATES).map(([county, pos]) => (
              <circle
                key={county}
                cx={pos.x}
                cy={pos.y}
                r={county === normalizedCounty ? 8 : 4}
                fill={county === normalizedCounty ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
                opacity={county === normalizedCounty ? 1 : 0.3}
                className="transition-all duration-300"
              />
            ))}
            
            {/* Highlight active county */}
            <circle
              cx={coords.x}
              cy={coords.y}
              r={10}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="1.5"
              className="animate-pulse"
            />
            
            {/* County label */}
            <text
              x={coords.x}
              y={coords.y - 15}
              textAnchor="middle"
              className="text-[4px] font-semibold fill-foreground"
            >
              {countyName}
            </text>
          </svg>
          
          {/* Legend */}
          <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm px-3 py-2 rounded-md text-xs">
            <p className="text-muted-foreground">Northern New Jersey</p>
          </div>
        </div>
        
        {/* County names list */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          {Object.keys(COUNTY_COORDINATES).map((county) => (
            <div
              key={county}
              className={`flex items-center gap-1 ${
                county === normalizedCounty ? 'text-primary font-semibold' : ''
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  county === normalizedCounty ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              />
              {county.charAt(0).toUpperCase() + county.slice(1)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
