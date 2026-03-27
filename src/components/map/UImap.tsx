import { useEffect, RefObject } from 'react';
import mapboxgl from 'mapbox-gl';

// ═══════════════════════════════════════════════════════════════
// BUILDING THEMES
// Tukar ACTIVE_BUILDING_THEME untuk tukar design bangunan.
//
//   ground  → warna dinding bawah (tingkat 1–3)
//   mid     → warna dinding tengah (tingkat 4–15)
//   sky     → warna dinding tinggi (tingkat 16+)
//   roof    → warna bumbung rata
//   outline → warna garisan tepi bangunan
//   opacity → ketelusan 0.0 – 1.0
// ═══════════════════════════════════════════════════════════════

export const BUILDING_THEMES = {

  // Biru gelap — bandar malam
  'night-city': {
    ground:  '#0d1117',
    mid:     '#161b2e',
    sky:     '#1e2d5a',
    roof:    '#0a0e1f',
    outline: '#2a3a5c',
    opacity: 0.90,
  },

  // Ungu neon
  'neon': {
    ground:  '#0f0820',
    mid:     '#1a0a35',
    sky:     '#2d1060',
    roof:    '#08041a',
    outline: '#6d28d9',
    opacity: 0.88,
  },

  // Kuning amber
  'warm': {
    ground:  '#1a1005',
    mid:     '#2e1d08',
    sky:     '#3d2a10',
    roof:    '#120c04',
    outline: '#78450f',
    opacity: 0.85,
  },

  // Hijau teal
  'teal-city': {
    ground:  '#041414',
    mid:     '#082828',
    sky:     '#0e3d3d',
    roof:    '#020e0e',
    outline: '#0f5959',
    opacity: 0.87,
  },

  // Kelabu minimal — hampir telus
  'minimal': {
    ground:  '#111111',
    mid:     '#1c1c1c',
    sky:     '#282828',
    roof:    '#0d0d0d',
    outline: '#303030',
    opacity: 0.70,
  },

  // Merah jambu / rose
  'rose': {
    ground:  '#1a0810',
    mid:     '#2e0f1c',
    sky:     '#4a1530',
    roof:    '#10040c',
    outline: '#7c1d3a',
    opacity: 0.86,
  },

} as const;

export type BuildingTheme = keyof typeof BUILDING_THEMES;

// ── TUKAR DI SINI ──────────────────────────────────────────────
export const ACTIVE_BUILDING_THEME: BuildingTheme = 'neon';
// ──────────────────────────────────────────────────────────────

const THEME = BUILDING_THEMES[ACTIVE_BUILDING_THEME];

// ═══════════════════════════════════════════════════════════════
// useMapBuildings
// Panggil hook ini sekali dalam komponen yang ada mapRef.
// Ia akan cat semua bangunan mengikut tema yang dipilih.
//
// Layer yang dihasilkan:
//   ui-buildings-low   → bangunan rendah  (≤12 m)
//   ui-buildings-mid   → bangunan sedang  (12–60 m)
//   ui-buildings-high  → bangunan tinggi  (>60 m)
//   ui-building-roof   → bumbung rata
//   ui-building-edge   → garisan tepi
// ═══════════════════════════════════════════════════════════════

export function useMapBuildings(mapRef: RefObject<mapboxgl.Map | null>) {
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      // Buang layer lama supaya boleh apply semula dengan selamat
      [
        'ui-buildings-low',
        'ui-buildings-mid',
        'ui-buildings-high',
        'ui-building-roof',
        'ui-building-edge',
      ].forEach(id => { if (map.getLayer(id)) map.removeLayer(id); });

      // Opacity fade-in ikut zoom — bangunan muncul perlahan semasa zoom masuk
      const zoomFade: mapboxgl.ExpressionSpecification = [
        'interpolate', ['linear'], ['zoom'],
        13, 0,
        15, THEME.opacity,
      ];

      // Warna bertukar ikut ketinggian bangunan
      const heightGradient = (
        lo: string,
        hi: string,
      ): mapboxgl.ExpressionSpecification => [
        'interpolate', ['linear'], ['get', 'height'],
        0,   lo,
        30,  lo,
        100, hi,
      ];

      // ── Bangunan rendah (1–3 tingkat, ≤12 m) ──────────────────
      map.addLayer({
        id:     'ui-buildings-low',
        type:   'fill-extrusion',
        source: 'composite',
        'source-layer': 'building',
        filter: ['all',
          ['==', 'extrude', 'true'],
          ['<=', ['get', 'height'], 12],
        ],
        paint: {
          'fill-extrusion-color':             THEME.ground,
          'fill-extrusion-height':            ['get', 'height'],
          'fill-extrusion-base':              ['get', 'min_height'],
          'fill-extrusion-opacity':           zoomFade,
          'fill-extrusion-vertical-gradient': true,
        },
      });

      // ── Bangunan sedang (4–15 tingkat, 12–60 m) ───────────────
      map.addLayer({
        id:     'ui-buildings-mid',
        type:   'fill-extrusion',
        source: 'composite',
        'source-layer': 'building',
        filter: ['all',
          ['==', 'extrude', 'true'],
          ['>', ['get', 'height'], 12],
          ['<=', ['get', 'height'], 60],
        ],
        paint: {
          'fill-extrusion-color':             heightGradient(THEME.ground, THEME.mid),
          'fill-extrusion-height':            ['get', 'height'],
          'fill-extrusion-base':              ['get', 'min_height'],
          'fill-extrusion-opacity':           zoomFade,
          'fill-extrusion-vertical-gradient': true,
        },
      });

      // ── Bangunan tinggi / pencakar langit (>60 m) ─────────────
      map.addLayer({
        id:     'ui-buildings-high',
        type:   'fill-extrusion',
        source: 'composite',
        'source-layer': 'building',
        filter: ['all',
          ['==', 'extrude', 'true'],
          ['>', ['get', 'height'], 60],
        ],
        paint: {
          'fill-extrusion-color':             heightGradient(THEME.mid, THEME.sky),
          'fill-extrusion-height':            ['get', 'height'],
          'fill-extrusion-base':              ['get', 'min_height'],
          'fill-extrusion-opacity':           zoomFade,
          'fill-extrusion-vertical-gradient': true,
        },
      });

      // ── Bumbung rata (cap atas setiap bangunan) ────────────────
      map.addLayer({
        id:     'ui-building-roof',
        type:   'fill-extrusion',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        paint: {
          'fill-extrusion-color':             THEME.roof,
          'fill-extrusion-height':            ['get', 'height'],
          'fill-extrusion-base':              ['get', 'height'], // cap on top
          'fill-extrusion-opacity':           [
            'interpolate', ['linear'], ['zoom'],
            14, 0,
            16, THEME.opacity * 0.6,
          ],
          'fill-extrusion-vertical-gradient': false,
        },
      });

      // ── Garisan tepi bangunan ──────────────────────────────────
      map.addLayer({
        id:     'ui-building-edge',
        type:   'line',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        paint: {
          'line-color':   THEME.outline,
          'line-width':   [
            'interpolate', ['linear'], ['zoom'],
            14, 0.4,
            17, 1.2,
          ],
          'line-opacity': [
            'interpolate', ['linear'], ['zoom'],
            13, 0,
            15, 0.65,
          ],
        },
      });
    };

    if (map.isStyleLoaded()) apply();
    else map.once('style.load', apply);

    map.on('style.load', apply);
    return () => { map.off('style.load', apply); };
  }, [mapRef]);
}
