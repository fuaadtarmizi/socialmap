import { useState, useEffect, useRef, RefObject } from 'react';
import mapboxgl from 'mapbox-gl';

interface UseGeocodingParams {
  mapRef: RefObject<mapboxgl.Map | null>;
  formAddress: string;
  setFormAddress: (v: string) => void;
  setPreviewCoords: (v: { lat: number; lng: number } | null) => void;
}

export const useGeocoding = ({
  mapRef,
  formAddress,
  setFormAddress,
  setPreviewCoords,
}: UseGeocodingParams) => {
  const [locating, setLocating] = useState(false);

  const geocodePlace = async (title: string) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(title)}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (e) {
      console.error("Geocoding error:", e);
    }
    return null;
  };

  const handleLocateFromTitle = async (title: string) => {
    setLocating(true);
    const coords = await geocodePlace(title);
    if (coords) {
      setPreviewCoords(coords);
      mapRef.current?.flyTo({ center: [coords.lng, coords.lat], zoom: 16 });
    }
    setLocating(false);
  };

  const handleLocate = async () => {
    if (!formAddress.trim()) return;
    setLocating(true);
    const coords = await geocodePlace(formAddress);
    if (coords) {
      setPreviewCoords(coords);
      mapRef.current?.flyTo({ center: [coords.lng, coords.lat], zoom: 16 });
    } else {
      alert("Could not find address. Try being more specific.");
    }
    setLocating(false);
  };

  // Expose handleAutoFill to window for map popup autocomplete
  const handleLocateFromTitleRef = useRef(handleLocateFromTitle);
  useEffect(() => { handleLocateFromTitleRef.current = handleLocateFromTitle; });

  useEffect(() => {
    (window as any).handleAutoFill = (title: string) => {
      setFormAddress(title);
      handleLocateFromTitleRef.current(title);
    };
  }, [setFormAddress]);

  return { locating, handleLocate, handleLocateFromTitle };
};
