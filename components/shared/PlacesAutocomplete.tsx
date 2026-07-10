'use client';

import { useRef, useState, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

export interface PlaceResult {
  venue_name: string;
  venue_address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
}

interface Props {
  value: string;
  onChange: (raw: string) => void;
  onPlaceSelected: (place: PlaceResult) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  address?: Record<string, string>;
}

function toPlace(r: NominatimResult): PlaceResult {
  const a = r.address ?? {};
  const city = a.city || a.town || a.village || a.municipality || a.county || a.state || '';
  const venueName =
    r.name ||
    a.amenity || a.building || a.tourism || a.leisure || a.office ||
    r.display_name.split(',')[0];
  return {
    venue_name: venueName,
    venue_address: r.display_name,
    city,
    country: a.country || '',
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  };
}

/**
 * Address/venue autocomplete powered by OpenStreetMap Nominatim — no API key
 * required (Google Places is unavailable on this deployment). Suggests places
 * as the user types and returns name/address/city/country/coords on select.
 */
export function PlacesAutocomplete({ value, onChange, onPlaceSelected, placeholder, disabled }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const justSelectedRef = useRef(false);

  // Fetch suggestions (debounced) as the value changes
  useEffect(() => {
    if (justSelectedRef.current) { justSelectedRef.current = false; return; }
    const q = value.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 3) { setResults([]); setOpen(false); setLoading(false); return; }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          'https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&q=' + encodeURIComponent(q),
          { headers: { 'Accept-Language': 'en' } },
        );
        const data = (await res.json()) as NominatimResult[];
        setResults(Array.isArray(data) ? data : []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  function pick(r: NominatimResult) {
    const place = toPlace(r);
    justSelectedRef.current = true;
    onChange(place.venue_name || place.venue_address);
    onPlaceSelected(place);
    setOpen(false);
    setResults([]);
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: focused ? '#1F4D3A' : '#9BA8A1' }}>
        <MapPin size={14} strokeWidth={2} />
      </div>
      {loading && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <Loader2 size={14} className="animate-spin" style={{ color: '#9BA8A1' }} />
        </div>
      )}
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => { setFocused(true); if (results.length) setOpen(true); }}
        onBlur={() => setFocused(false)}
        placeholder={placeholder ?? 'Search for a venue or address'}
        disabled={disabled}
        autoComplete="off"
        className="w-full h-12 pl-9 pr-9 rounded-xl text-[14px] outline-none transition"
        style={{
          background: disabled ? '#F5F3EE' : 'white',
          border: `1.5px solid ${focused ? '#1F4D3A' : '#E5E0D4'}`,
          color: disabled ? '#9BA8A1' : '#0F1F18',
        }}
      />

      {open && results.length > 0 && (
        <div
          className="absolute z-50 left-0 right-0 mt-2 rounded-xl overflow-hidden py-1"
          style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', boxShadow: '0 14px 40px rgba(15,31,24,0.18)', maxHeight: 280, overflowY: 'auto' }}
        >
          {results.map((r, i) => {
            const primary = r.name || r.display_name.split(',')[0];
            const rest = r.display_name.split(',').slice(1).join(',').trim();
            return (
              <button
                key={`${r.lat}-${r.lon}-${i}`}
                type="button"
                onMouseDown={e => { e.preventDefault(); pick(r); }}
                className="w-full flex items-start gap-2.5 px-3.5 py-2.5 text-left transition hover:bg-[#F5F2EA]"
              >
                <MapPin size={14} strokeWidth={2} className="mt-0.5 shrink-0" style={{ color: '#1F4D3A' }} />
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium truncate" style={{ color: '#0F1F18' }}>{primary}</span>
                  {rest && <span className="block text-[12px] truncate" style={{ color: '#6B7A72' }}>{rest}</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
