'use client';

import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
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
  const hasRealData = cityData.length > 0;
  const maxCount = hasRealData ? Math.max(...cityData.map(c => c.count), 1) : 1;

  const legendCities = hasRealData
    ? cityData.slice(0, 5)
    : KNOWN_CITIES.slice(0, 5).map(c => ({ ...c, country: '', count: 0 }));

  const dotColors = ['#6c63ff', '#6c63ff', '#6c63ff', '#f8a4d8', '#f8a4d8'];

  return (
    <div>
      {/* Map */}
      <div className="relative rounded-xl overflow-hidden bg-[#e8f0f7]" style={{ height: 260 }}>
        <ComposableMap
          projection="geoEqualEarth"
          projectionConfig={{ center: [10, 10], scale: 140 }}
          width={440}
          height={260}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Ocean fill */}
          <rect x={0} y={0} width={440} height={260} fill="#e8f0f7" />

          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
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
                  <circle r={r + 4} fill="#6c63ff" fillOpacity={0.12} />
                  <circle r={r} fill="#6c63ff" fillOpacity={0.85} />
                  <text
                    textAnchor="middle"
                    y={-(r + 5)}
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 6,
                      fontWeight: 500,
                      fill: '#0f0f1a',
                      pointerEvents: 'none',
                    }}
                  >
                    {city}
                  </text>
                </Marker>
              );
            })}

          {/* Placeholder dots when no real data yet */}
          {!hasRealData &&
            KNOWN_CITIES.map(({ city, lat, lng }, i) => (
              <Marker key={`known-${i}`} coordinates={[lng, lat]}>
                <circle r={3.5} fill="#6c63ff" fillOpacity={0.2} />
                <circle r={2}   fill="#6c63ff" fillOpacity={0.4} />
              </Marker>
            ))}
        </ComposableMap>

        {/* No-data badge */}
        {!hasRealData && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
            <span className="bg-white/80 backdrop-blur-sm text-[10.5px] font-mono text-[#0f0f1a]/40 px-2.5 py-1 rounded-lg border border-[#e5e5ea]/60">
              Waiting for real attendee data
            </span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        {legendCities.map(({ city, count }, i) => {
          const pct = hasRealData && totalCards > 0
            ? Math.round((count / totalCards) * 100)
            : null;
          return (
            <div key={`${city}-${i}`} className="flex items-center gap-2 text-[12px]">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ background: dotColors[i] ?? '#e5e5ea' }}
              />
              <span className="flex-1 text-[#0f0f1a]/70 truncate">{city}</span>
              <span className="font-mono text-[#0f0f1a]/50">
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
              <span className="h-2 w-2 rounded-full shrink-0 bg-[#e5e5ea]" />
              <span className="flex-1 text-[#0f0f1a]/70">Other</span>
              <span className="font-mono text-[#0f0f1a]/50">{otherPct}%</span>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
