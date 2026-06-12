'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView, InfoWindow } from '@react-google-maps/api';
import type { DiscoveryEvent } from './EventCard';

const WORLD_CENTER = { lat: 12.0, lng: 20.0 };
const WORLD_ZOOM = 3;
const MAX_DEFAULT_ZOOM = 11; // never auto-zoom tighter than a city view

function priceBubbleLabel(price?: number | null): string {
  if (price === 0) return 'Free';
  if (price != null) return `$${Math.round(price)}`;
  return 'Tickets';
}

interface Props {
  events: DiscoveryEvent[];
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onBoundsChange?: (bounds: { n: number; s: number; e: number; w: number }) => void;
}

export function GoogleMapView({ events, hoveredId, onHover, onBoundsChange }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const mappable = useMemo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => events.filter(e => typeof (e as any).venue_lat === 'number' && typeof (e as any).venue_lng === 'number'),
    [events],
  );

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);

    // 1) Fit the current events so something is always visible immediately,
    //    but never zoom in tighter than a city.
    if (mappable.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mappable.forEach(e => bounds.extend({ lat: (e as any).venue_lat, lng: (e as any).venue_lng }));
      mapInstance.fitBounds(bounds, 80);
      google.maps.event.addListenerOnce(mapInstance, 'idle', () => {
        const z = mapInstance.getZoom() ?? WORLD_ZOOM;
        if (z > MAX_DEFAULT_ZOOM) mapInstance.setZoom(MAX_DEFAULT_ZOOM);
      });
    }

    // 2) Default to the user's region if they allow location — "events near me".
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          mapInstance.setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          mapInstance.setZoom(8);
        },
        () => { /* denied — keep the fitted view */ },
        { timeout: 6000, maximumAge: 600_000 },
      );
    }
  }, [mappable]);

  const onUnmount = useCallback(() => setMap(null), []);

  // Keep the map and the list in sync: hovering a list card pans to its pin.
  useEffect(() => {
    if (!map || !hoveredId) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = mappable.find(x => x.id === hoveredId) as any;
    if (e) map.panTo({ lat: e.venue_lat, lng: e.venue_lng });
  }, [hoveredId, map, mappable]);

  const handleSearchArea = useCallback(() => {
    if (!map || !onBoundsChange) return;
    const b = map.getBounds();
    if (!b) return;
    const ne = b.getNorthEast();
    const sw = b.getSouthWest();
    onBoundsChange({ n: ne.lat(), s: sw.lat(), e: ne.lng(), w: sw.lng() });
  }, [map, onBoundsChange]);

  if (!apiKey) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ background: '#E8EFEB' }}>
        <p className="text-[13px] font-medium" style={{ color: '#0F1F18' }}>Map unavailable</p>
        <p className="text-[11px] text-center max-w-[200px]" style={{ color: '#6B7A72' }}>
          Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local to enable the map.
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: '#E8EFEB' }}>
        <p className="text-[13px]" style={{ color: '#B8423C' }}>Failed to load Google Maps.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: '#E8EFEB' }}>
        <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#1F4D3A', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const selectedEvent = selectedId ? events.find(e => e.id === selectedId) ?? null : null;

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={WORLD_CENTER}
        zoom={WORLD_ZOOM}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: { position: 9 }, // RIGHT_BOTTOM
          styles: BRAND_MAP_STYLE,
          clickableIcons: false,
        }}
      >
        {/* Price-bubble markers */}
        {mappable.map(ev => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const p = ev as any;
          const price = priceBubbleLabel(ev.price_from);
          const active = hoveredId === ev.id || selectedId === ev.id;

          return (
            <OverlayView
              key={ev.id}
              position={{ lat: p.venue_lat, lng: p.venue_lng }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <div
                style={{ transform: 'translate(-50%, -100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                onMouseEnter={() => onHover(ev.id)}
                onMouseLeave={() => onHover(null)}
                onClick={() => setSelectedId(selectedId === ev.id ? null : ev.id)}
              >
                <div style={{
                  padding: '3px 9px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  fontFamily: '"JetBrains Mono", monospace',
                  background: active ? '#1F4D3A' : '#FFFFFF',
                  color: active ? '#E8C57E' : '#0F1F18',
                  border: `1.5px solid ${active ? '#1F4D3A' : '#E5E0D4'}`,
                  boxShadow: active ? '0 4px 12px rgba(15,31,24,0.2)' : '0 1px 3px rgba(15,31,24,0.1)',
                  transform: active ? 'scale(1.12)' : 'scale(1)',
                  transition: 'all 0.15s',
                  zIndex: active ? 3 : 1,
                }}>
                  {price}
                </div>
                <div style={{
                  width: 0, height: 0,
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderTop: `6px solid ${active ? '#1F4D3A' : '#FFFFFF'}`,
                  marginTop: -1,
                  filter: active ? 'none' : 'drop-shadow(0 1px 0 rgba(0,0,0,0.1))',
                }} />
              </div>
            </OverlayView>
          );
        })}

        {/* Info window for selected event */}
        {selectedEvent && (
          <InfoWindow
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            position={{ lat: (selectedEvent as any).venue_lat, lng: (selectedEvent as any).venue_lng }}
            onCloseClick={() => setSelectedId(null)}
            options={{ pixelOffset: new google.maps.Size(0, -18) }}
          >
            <div style={{ maxWidth: 220, fontFamily: 'Inter, sans-serif', padding: '2px 0' }}>
              {selectedEvent.cover_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedEvent.cover_image_url}
                  alt={selectedEvent.title}
                  style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 6, marginBottom: 8 }}
                />
              )}
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1F18', marginBottom: 2, lineHeight: 1.3 }}>
                {selectedEvent.title}
              </div>
              <div style={{ fontSize: 11, color: '#6B7A72', marginBottom: 8 }}>
                {new Date(selectedEvent.starts_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                {selectedEvent.venue_name ? ` · ${selectedEvent.venue_name}` : ''}
              </div>
              <a
                href={`/e/${selectedEvent.custom_slug ?? selectedEvent.events?.slug ?? selectedEvent.event_id}`}
                style={{ display: 'inline-block', fontSize: 12, color: '#FFFFFF', fontWeight: 600, background: '#1F4D3A', padding: '4px 10px', borderRadius: 6, textDecoration: 'none' }}
              >
                View event →
              </a>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Search this area button — overlaid on the map */}
      {onBoundsChange && (
        <button
          className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 h-9 rounded-full text-[13px] font-medium z-10"
          style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', boxShadow: '0 2px 8px rgba(15,31,24,0.1)', color: '#0F1F18' }}
          onClick={handleSearchArea}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7A72" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" /><polyline points="23 20 23 14 17 14" />
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
          </svg>
          Search this area
        </button>
      )}

      {/* No coordinates fallback */}
      {mappable.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="rounded-xl px-5 py-4 text-center"
            style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', border: '1px solid #E5E0D4' }}
          >
            <p className="text-[13px] font-medium mb-1" style={{ color: '#0F1F18' }}>No location data</p>
            <p className="text-[12px]" style={{ color: '#6B7A72' }}>Events don&apos;t have coordinates yet.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Brand-matched Google Maps style
const BRAND_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#f0ebe0' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#3A4A42' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#FAF6EE' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#B8D4E8' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3A6B8C' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#E5E0D4' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#f8e9b0' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#E5E0D4' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#E8EFEB' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#C8DFC0' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#C9C3B1' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#6B7A72' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#3A4A42' }] },
];
