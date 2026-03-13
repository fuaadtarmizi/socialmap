import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapProps {
  center: [number, number];
  zoom: number;
  onMapClick?: (lat: number, lng: number) => void;
  markers?: Array<{
    id: string;
    position: [number, number];
    title: string;
    description?: string;
  }>;
}

const Map: React.FC<MapProps> = ({ center, zoom, onMapClick, markers = [] }) => {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Initialize map
    mapRef.current = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView(center, zoom);

    // Add tile layer (CartoDB Positron is clean and modern)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(mapRef.current);

    // Add zoom control to bottom right
    L.control.zoom({
      position: 'bottomright'
    }).addTo(mapRef.current);

    // Layer for markers
    markersLayerRef.current = L.layerGroup().addTo(mapRef.current);

    mapRef.current.on('click', (e: any) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, zoom, { animate: true });
    }
  }, [center, zoom]);

  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    markers.forEach(marker => {
      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="relative group">
            <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-xl transition-transform group-hover:scale-110">
              <path d="M16 0C7.16344 0 0 7.16344 0 16C0 28 16 42 16 42C16 42 32 28 32 16C32 7.16344 24.8366 0 16 0Z" fill="#EF4444"/>
              <circle cx="16" cy="16" r="6" fill="white"/>
            </svg>
          </div>
        `,
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        popupAnchor: [0, -40]
      });

      const m = L.marker(marker.position, { icon: customIcon }).addTo(markersLayerRef.current);
      
      if (marker.title) {
        m.bindPopup(`
          <div class="p-4">
            <h3 class="font-bold text-slate-900 text-lg mb-1">${marker.title}</h3>
            ${marker.description ? `<p class="text-slate-600 text-sm leading-relaxed">${marker.description}</p>` : ''}
          </div>
        `);
      }
    });
  }, [markers]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default Map;
