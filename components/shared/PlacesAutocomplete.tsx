'use client';

import { useRef, useState, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';

const LIBRARIES: ('places')[] = ['places'];

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

export function PlacesAutocomplete({ value, onChange, onPlaceSelected, placeholder, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [focused, setFocused] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    libraries: LIBRARIES,
  });

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ['name', 'formatted_address', 'geometry', 'address_components'],
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current!.getPlace();
      if (!place.geometry?.location) return;

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      let city = '';
      let country = '';
      for (const comp of place.address_components ?? []) {
        if (comp.types.includes('locality') || comp.types.includes('administrative_area_level_2')) {
          city = city || comp.long_name;
        }
        if (comp.types.includes('country')) {
          country = comp.long_name;
        }
      }

      const result: PlaceResult = {
        venue_name: place.name ?? '',
        venue_address: place.formatted_address ?? '',
        city,
        country,
        lat,
        lng,
      };

      onChange(place.name ?? place.formatted_address ?? '');
      onPlaceSelected(result);
    });
  }, [isLoaded, onChange, onPlaceSelected]);

  return (
    <div className="relative">
      <div
        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: focused ? '#1F4D3A' : '#9BA8A1' }}
      >
        <MapPin size={14} strokeWidth={2} />
      </div>
      <input
        ref={inputRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder ?? 'Search for a venue or address'}
        disabled={disabled}
        autoComplete="off"
        className="w-full h-12 pl-9 pr-4 rounded-xl text-[14px] outline-none transition"
        style={{
          background: disabled ? '#F5F3EE' : 'white',
          border: `1.5px solid ${focused ? '#1F4D3A' : '#E5E0D4'}`,
          color: disabled ? '#9BA8A1' : '#0F1F18',
        }}
      />
    </div>
  );
}
