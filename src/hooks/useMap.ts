import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { SavedPlace } from '../components/PostingCard';
import { previewMarkerHtml, placeMarkerHtml } from '../components/Map';
import { AuthUser } from './useAuth';

// Replace with your Mapbox public token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const MAPBOX_STYLE = 'mapbox://styles/mapbox/standard';

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
    const data = await res.json();
    return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (e) {
    console.error('Reverse geocoding error:', e);
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

interface UseMapParams {
  user: AuthUser | null;
  savedPlaces: SavedPlace[];
  setSavedPlaces: React.Dispatch<React.SetStateAction<SavedPlace[]>>;
  previewCoords: { lat: number; lng: number } | null;
  setPreviewCoords: (v: { lat: number; lng: number } | null) => void;
  setFormAddress: (v: string) => void;
  handleLike: (placeId: string) => void;
  onOpenComments: (placeId: string) => void;
  profilePhoto?: string | null;
}

export const useMap = ({
  user,
  savedPlaces,
  setSavedPlaces,
  previewCoords,
  setPreviewCoords,
  setFormAddress,
  handleLike,
  onOpenComments,
  profilePhoto,
}: UseMapParams) => {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const savedMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const savedPlacesRef = useRef<SavedPlace[]>([]);
  const previewMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [pointedPlaceId, setPointedPlaceId] = useState<string | null>(null);
  const [cardPos, setCardPos] = useState<{ x: number; y: number } | null>(null);
  const pointedPlaceIdRef = useRef<string | null>(null);

  useEffect(() => { savedPlacesRef.current = savedPlaces; }, [savedPlaces]);

  // Keep handler refs fresh to avoid stale closures in window handlers
  const handleLikeRef = useRef(handleLike);
  const onOpenCommentsRef = useRef(onOpenComments);
  useEffect(() => { handleLikeRef.current = handleLike; });
  useEffect(() => { onOpenCommentsRef.current = onOpenComments; });

  useEffect(() => {
    (window as any).handleLikePost = (placeId: string) => handleLikeRef.current(placeId);
    (window as any).handleOpenComments = (placeId: string) => onOpenCommentsRef.current(placeId);
  }, []);

  // Initialize Map
  useEffect(() => {
    const mapContainer = document.getElementById('map');
    if (user && !mapRef.current && mapContainer) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainer,
        style: MAPBOX_STYLE,
        center: [101.5556, 3.4083],
        zoom: 16,
        pitch: 30,
        bearing: 0,
        minZoom: 10,
        maxZoom: 18,
        attributionControl: false,
      });

      const updatePitch = () => {
        const map = mapRef.current!
        const zoom = map.getZoom()
        const t = Math.max(0, Math.min(1, (zoom - 12) / (16 - 12)))
        const pitch = 15 + 20 * t

        map.easeTo({
          pitch,
          duration: 2000,
          easing: (t) => t
        })
      }

      mapRef.current.on("zoomend", updatePitch)



     

      mapRef.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

      // Map move listener — directly update card DOM position every frame (no React re-render lag)
      mapRef.current.on('move', () => {
        if (!pointedPlaceIdRef.current) return;
        const place = savedPlacesRef.current.find(p => p.id === pointedPlaceIdRef.current);
        if (place) {
          const point = mapRef.current!.project([place.lng, place.lat]);
          const card = document.getElementById('floating-posting-card');
          if (card) {
            card.style.left = `${point.x}px`;
            card.style.top = `${point.y - 40}px`;
          }
        }
      });

      // Geolocation — wait for map style to load before flying
      mapRef.current.once('load', () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              setLocation({ lat: latitude, lng: longitude });
              mapRef.current!.flyTo({ 
                center: [longitude, latitude], 
                zoom: 16, 
                pitch: 50, 
                bearing: 0 
              });
              const userEl = document.createElement('div');
              userEl.style.cssText = 'width:16px;height:16px;background:#3b82f6;border:2px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.3)';
              new mapboxgl.Marker({ element: userEl })
                .setLngLat([longitude, latitude])
                .setPopup(new mapboxgl.Popup().setHTML('<p style="padding:4px;margin:0">Your Location</p>'))
                .addTo(mapRef.current!);
            },
            (err) => console.warn('Geolocation denied', err)
          );
        }
      });
    }

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [user]);





  
  // Update Preview Marker
  useEffect(() => {
    if (!mapRef.current) return;
    if (previewMarkerRef.current) { previewMarkerRef.current.remove(); previewMarkerRef.current = null; }

    if (previewCoords) {
      const el = document.createElement('div');
      el.innerHTML = previewMarkerHtml(user?.username || 'guest');
      const marker = new mapboxgl.Marker({ element: el, draggable: true, anchor: 'bottom' })
        .setLngLat([previewCoords.lng, previewCoords.lat])
        .addTo(mapRef.current);

      marker.on('dragend', async () => {
        const lngLat = marker.getLngLat();
        setPreviewCoords({ lat: lngLat.lat, lng: lngLat.lng });
        const newAddress = await reverseGeocode(lngLat.lat, lngLat.lng);
        setFormAddress(newAddress);
      });

      previewMarkerRef.current = marker;
    }
  }, [previewCoords, user]);

  // Update Saved Markers
  useEffect(() => {
    if (!mapRef.current) return;
    savedMarkersRef.current.forEach(m => m.remove());
    savedMarkersRef.current = [];

    savedPlaces.forEach(place => {
      const isPointed = place.id === pointedPlaceId;
      const avatarSrc = (place.userId === user?.id && profilePhoto) ? profilePhoto : (place.avatar || '');

      const el = document.createElement('div');
      el.innerHTML = placeMarkerHtml(avatarSrc, isPointed);

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([place.lng, place.lat])
        .addTo(mapRef.current!);

      el.addEventListener('click', () => {
        const isOpen = pointedPlaceIdRef.current === place.id;
        if (isOpen) {
          pointedPlaceIdRef.current = null;
          setPointedPlaceId(null);
          setCardPos(null);
        } else {
          const point = mapRef.current!.project([place.lng, place.lat]);
          pointedPlaceIdRef.current = place.id;
          setPointedPlaceId(place.id);
          setCardPos({ x: point.x, y: point.y });
        }
      });

      savedMarkersRef.current.push(marker);
    });
  }, [savedPlaces, pointedPlaceId, profilePhoto]);

  return { mapRef, location, pointedPlaceId, cardPos };
};
