'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    position: [number, number];
    popup?: string;
    icon?: L.Icon | L.DivIcon;
  }>;
  polylines?: Array<{
    positions: [number, number][];
    color?: string;
    weight?: number;
    opacity?: number;
  }>;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Map Component
 *
 * OpenStreetMap integration using Leaflet
 *
 * @example
 * <Map
 *   center={[39.9334, 32.8597]}
 *   zoom={13}
 *   markers={[
 *     { position: [39.9334, 32.8597], popup: 'Ankara' }
 *   ]}
 * />
 */
export default function Map({
  center = [39.9334, 32.8597], // Ankara coordinates
  zoom = 13,
  markers = [],
  polylines = [],
  onMapClick,
  className = '',
  style = {},
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylinesRef = useRef<L.Polyline[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map instance
    const map = L.map(mapContainerRef.current).setView(center, zoom);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Handle map click
    if (onMapClick) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    mapRef.current = map;

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update center and zoom
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  // Update markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach(({ position, popup, icon }) => {
      const marker = L.marker(position, icon ? { icon } : undefined).addTo(
        mapRef.current!
      );

      if (popup) {
        marker.bindPopup(popup);
      }

      markersRef.current.push(marker);
    });
  }, [markers]);

  // Update polylines
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old polylines
    polylinesRef.current.forEach((polyline) => polyline.remove());
    polylinesRef.current = [];

    // Add new polylines
    polylines.forEach(({ positions, color = '#3388ff', weight = 5, opacity = 0.7 }) => {
      const polyline = L.polyline(positions, {
        color,
        weight,
        opacity,
      }).addTo(mapRef.current!);

      polylinesRef.current.push(polyline);
    });

    // Fit bounds if polylines exist
    if (polylines.length > 0 && polylines[0].positions.length > 0) {
      const bounds = L.latLngBounds(
        polylines.flatMap((p) => p.positions)
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [polylines]);

  return (
    <div
      ref={mapContainerRef}
      className={`w-full h-full ${className}`}
      style={{ minHeight: '400px', ...style }}
    />
  );
}
