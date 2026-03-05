import { useState, useCallback } from 'react';

interface Location {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

interface RouteStop extends Location {
  order: number;
  estimatedDriveTime?: number;
  distanceFromPrevious?: number;
}

interface OptimizedRoute {
  stops: RouteStop[];
  totalDistance: number;
  totalDriveTime: number;
}

// Haversine formula to calculate distance between two coordinates
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Estimate drive time based on distance (rough estimate: 60 km/h average)
const estimateDriveTime = (distanceKm: number): number => {
  return (distanceKm / 60) * 60; // Convert to minutes
};

// Nearest neighbor algorithm for TSP approximation
const optimizeRoute = (
  locations: Location[],
  startLat: number,
  startLon: number
): OptimizedRoute => {
  if (locations.length === 0) {
    return { stops: [], totalDistance: 0, totalDriveTime: 0 };
  }

  const unvisited = [...locations];
  const route: RouteStop[] = [];
  let currentLat = startLat;
  let currentLon = startLon;
  let totalDistance = 0;
  let totalDriveTime = 0;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    // Find nearest unvisited location
    unvisited.forEach((location, index) => {
      if (location.latitude && location.longitude) {
        const distance = calculateDistance(
          currentLat,
          currentLon,
          location.latitude,
          location.longitude
        );
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      }
    });

    const nearest = unvisited[nearestIndex];
    if (nearest.latitude && nearest.longitude) {
      const driveTime = estimateDriveTime(nearestDistance);
      
      route.push({
        ...nearest,
        order: route.length + 1,
        distanceFromPrevious: nearestDistance,
        estimatedDriveTime: driveTime,
      });

      totalDistance += nearestDistance;
      totalDriveTime += driveTime;
      currentLat = nearest.latitude;
      currentLon = nearest.longitude;
    }

    unvisited.splice(nearestIndex, 1);
  }

  return {
    stops: route,
    totalDistance,
    totalDriveTime,
  };
};

export function useRouteOptimization() {
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const optimize = useCallback(
    async (
      locations: Location[],
      currentLat: number,
      currentLon: number
    ) => {
      setIsOptimizing(true);
      
      try {
        // Geocode addresses if coordinates are missing
        const locationsWithCoords = await Promise.all(
          locations.map(async (location) => {
            if (location.latitude && location.longitude) {
              return location;
            }

            // Use a geocoding service (Google Maps, OpenStreetMap Nominatim, etc.)
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                  location.address
                )}`
              );
              const data = await response.json();
              
              if (data && data[0]) {
                return {
                  ...location,
                  latitude: parseFloat(data[0].lat),
                  longitude: parseFloat(data[0].lon),
                };
              }
            } catch (error) {
              console.error('Geocoding error:', error);
            }

            return location;
          })
        );

        const route = optimizeRoute(locationsWithCoords, currentLat, currentLon);
        setOptimizedRoute(route);
      } catch (error) {
        console.error('Route optimization error:', error);
      } finally {
        setIsOptimizing(false);
      }
    },
    []
  );

  const clearRoute = useCallback(() => {
    setOptimizedRoute(null);
  }, []);

  return {
    optimizedRoute,
    isOptimizing,
    optimize,
    clearRoute,
  };
}
