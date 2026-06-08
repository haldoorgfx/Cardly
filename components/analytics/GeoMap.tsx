'use client';

import { useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';

// Global cities shown as placeholders before real data arrives
const KNOWN_CITIES = [
  { city: 'New York',  lat: 40.71,  lng: -74.01 },
  { city: 'London',    lat: 51.51,  lng:  -0.13 },
  { city: 'Lagos',     lat:  6.52,  lng:   3.37 },
  { city: 'Dubai',     lat: 25.20,  lng:  55.27 },
  { city: 'Singapore', lat:  1.35,  lng: 103.82 },
  { city: 'São Paulo', lat: -23.55, lng: -46.63 },
  { city: 'Nairobi',   lat: -1.29,  lng:  36.82 },
  { city: 'Mumbai',    lat: 19.08,  lng:  72.88 },
  { city: 'Sydney',    lat: -33.87, lng: 151.21 },
  { city: 'Cairo',     lat: 30.05,  lng:  31.24 },
];

const GEO_URL =
  'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const DEFAULT_CENTER: [number, number] = [10, 10];
const DEFAULT_ZOOM = 1;
const MIN_ZOOM = 1;
const MAX_ZOOM = 8;

export interface CityPoint {
  city: string;
  country: string;
  lat: number;
  lng: number;
  count: number;
}

interface Props {
  cityData: CityPoint[];
  totalCards: number;
}

export default function GeoMap({ cityData, totalCards }: Props) {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);

  const hasRealData = cityData.length > 0;
  const maxCount = hasRealData ? Math.max(...cityData.map(c => c.count), 1) : 1;

  const legendCities = hasRealData
    ? cityData.slice(0, 5)
    : KNOWN_CITIES.slice(0, 5).map(c => ({ ...c, country: '', count: 0 }));

  const dotColors = ['#1F4D3A', '#1F4D3A', '#1F4D3A', '#E8C57E', '#E8C57E'];

  function zoomIn()  { setZoom(z => Math.min(z * 2, MAX_ZOOM)); }
  function zoomOut() { setZoom(z => Math.max(z / 2, MIN_ZOOM)); }
  function reset()   { setZoom(DEFAULT_ZOOM); setCenter(DEFAULT_CENTER); }

  return (
    <div>
      {/* Map */}
      <div className="relative rounded-xl overflow-hidden bg-[#e8f0f7]" style={{ height: 260 }}>
        <ComposableMap
          projection="geoEqualEarth"
          projectionConfig={{ center: [10, 10], scale: 140 }}
          width={440}
          height={260}
          style={{ width: '100%', height: '100%', cursor: 'grab' }}
        >
          <ZoomableGroup
            zoom={zoom}
            center={center}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            onMoveEnd={({ coordinates, zoom: z }: { coordinates: [number, number]; zoom: number }) => {
              setCenter(coordinates as [number, number]);
              setZoom(z);
            }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }: { geographies: { rsmKey: string; [k: string]: unknown }[] }) =>
                geographies.map(geo => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#dfe8d0"
                    stroke="#c8d4b8"
                    strokeWidth={0.4}
                    style={{
                      default: { outline: 'none' },
                      hover:   { fill: '#cfdabf', outline: 'none' },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))
              }
            </Geographies>

            {/* Real data markers */}
            {hasRealData &&
              cityData.map(({ city, lat, lng, count }) => {
                const r = 3 + (count / maxCount) * 10;
                return (
                  <Marker key={`${city}-${lat}`} coordinates={[lng, lat]}>
                    <circle r={r + 4} fill="#1F4D3A" fillOpacity={0.12} />
                    <circle r={r}     fill="#1F4D3A" fillOpacity={0.85} />
                    <text
                      textAnchor="middle"
                      y={-(r + 5)}
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 6,
                        fontWeight: 500,
                        fill: '#0F1F18',
                        pointerEvents: 'none',
                      }}
                    >
                      {city}
                    </text>
                  </Marker>
                );
              })}

            {/* Placeholder dots */}
            {!hasRealData &&
              KNOWN_CITIES.map(({ lat, lng }, i) => (
                <Marker key={`known-${i}`} coordinates={[lng, lat]}>
                  <circle r={3.5} fill="#1F4D3A" fillOpacity={0.2} />
                  <circle r={2}   fill="#1F4D3A" fillOpacity={0.4} />
                </Marker>
              ))}
          </ZoomableGroup>
        </ComposableMap>

        {/* Zoom controls */}
        <div className="absolute top-3 right-3 flex flex-col gap-1">
          <button
            onClick={zoomIn}
            disabled={zoom >= MAX_ZOOM}
            className="h-7 w-7 rounded-lg bg-white border border-[#E5E0D4] shadow-soft text-[#0F1F18]/60 hover:text-[#1F4D3A] hover:border-[#1F4D3A]/30 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center text-[15px] font-light leading-none"
            title="Zoom in"
          >
            +
          </button>
          <button
            onClick={zoomOut}
            disabled={zoom <= MIN_ZOOM}
            className="h-7 w-7 rounded-lg bg-white border border-[#E5E0D4] shadow-soft text-[#0F1F18]/60 hover:text-[#1F4D3A] hover:border-[#1F4D3A]/30 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center text-[15px] font-light leading-none"
            title="Zoom out"
          >
            −
          </button>
          {(zoom !== DEFAULT_ZOOM || center[0] !== DEFAULT_CENTER[0] || center[1] !== DEFAULT_CENTER[1]) && (
            <button
              onClick={reset}
              className="h-7 w-7 rounded-lg bg-white border border-[#E5E0D4] shadow-soft text-[#0F1F18]/50 hover:text-[#1F4D3A] hover:border-[#1F4D3A]/30 transition flex items-center justify-center"
              title="Reset view"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
            </button>
          )}
        </div>

        {/* Drag hint */}
        <div className="absolute bottom-3 left-3 pointer-events-none">
          <span className="text-[9.5px] font-mono text-[#0F1F18]/30">drag to pan · scroll to zoom</span>
        </div>

        {/* No-data badge */}
        {!hasRealData && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
            <span className="bg-white/80 backdrop-blur-sm text-[10.5px] font-mono text-[#0F1F18]/40 px-2.5 py-1 rounded-lg border border-[#E5E0D4]/60">
              Waiting for real attendee data
            </span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
        {legendCities.map(({ city, count }, i) => {
          const pct = hasRealData && totalCards > 0
            ? Math.round((count / totalCards) * 100)
            : null;
          return (
            <div key={`${city}-${i}`} className="flex items-center gap-2 text-[12px]">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ background: dotColors[i] ?? '#E5E0D4' }}
              />
              <span className="flex-1 text-[#0F1F18]/70 truncate">{city}</span>
              <span className="font-mono text-[#0F1F18]/50">
                {pct !== null ? `${pct}%` : '—'}
              </span>
            </div>
          );
        })}
        {hasRealData && cityData.length > 5 && (() => {
          const otherCount = cityData.slice(5).reduce((s, c) => s + c.count, 0);
          const otherPct = totalCards > 0 ? Math.round((otherCount / totalCards) * 100) : 0;
          return (
            <div className="flex items-center gap-2 text-[12px]">
              <span className="h-2 w-2 rounded-full shrink-0 bg-[#E5E0D4]" />
              <span className="flex-1 text-[#0F1F18]/70">Other</span>
              <span className="font-mono text-[#0F1F18]/50">{otherPct}%</span>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
