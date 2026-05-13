'use client';

import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';

// ISO 3166-1 numeric codes for all 54 African countries
const AFRICA_ISO = new Set([
  12, 24, 204, 72, 854, 108, 132, 120, 140, 148, 174, 180, 178, 384,
  262, 818, 226, 232, 748, 231, 266, 270, 288, 324, 624, 404, 426,
  430, 434, 450, 454, 466, 478, 480, 504, 508, 516, 562, 566, 646,
  678, 686, 694, 706, 710, 728, 729, 834, 768, 788, 800, 894, 716,
]);

// Well-known African cities to always show (fallback when no real data)
const KNOWN_CITIES = [
  { city: 'Lagos',     country: 'NG', lat:  6.52,  lng:  3.37  },
  { city: 'Nairobi',   country: 'KE', lat: -1.29,  lng: 36.82  },
  { city: 'Cairo',     country: 'EG', lat: 30.05,  lng: 31.24  },
  { city: 'Accra',     country: 'GH', lat:  5.55,  lng: -0.20  },
  { city: 'Cape Town', country: 'ZA', lat: -33.93, lng: 18.42  },
  { city: 'Nairobi',   country: 'KE', lat: -1.29,  lng: 36.82  },
  { city: 'Abidjan',   country: 'CI', lat:  5.35,  lng: -4.01  },
  { city: 'Dakar',     country: 'SN', lat: 14.69,  lng: -17.44 },
  { city: 'Addis',     country: 'ET', lat:  9.03,  lng: 38.74  },
  { city: 'Kinshasa',  country: 'CD', lat: -4.32,  lng: 15.32  },
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
  // Use real data if available, otherwise show known cities with count=0
  const hasRealData = cityData.length > 0;
  const maxCount = hasRealData ? Math.max(...cityData.map(c => c.count), 1) : 1;

  // Build city legend (top 5 real + "Other")
  const legendCities = hasRealData
    ? cityData.slice(0, 5)
    : KNOWN_CITIES.slice(0, 5).map(c => ({ ...c, count: 0 }));

  const dotColors = ['#6c63ff', '#6c63ff', '#6c63ff', '#f8a4d8', '#f8a4d8'];

  return (
    <div>
      {/* Map */}
      <div className="relative rounded-xl overflow-hidden bg-[#f7f5f0]" style={{ height: 280 }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [22, 3], scale: 370 }}
          width={440}
          height={280}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup zoom={1} center={[22, 3]} translateExtent={[[-Infinity, -Infinity], [Infinity, Infinity]]}>
            {/* Ocean background is handled by the parent div bg */}
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies
                  .filter(geo => AFRICA_ISO.has(Number(geo.id)))
                  .map(geo => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#ede8df"
                      stroke="#d5cec4"
                      strokeWidth={0.6}
                      style={{
                        default: { outline: 'none' },
                        hover: { fill: '#ddd6c8', outline: 'none' },
                        pressed: { outline: 'none' },
                      }}
                    />
                  ))
              }
            </Geographies>

            {/* Real data markers */}
            {hasRealData &&
              cityData.map(({ city, lat, lng, count }) => {
                const r = 4 + (count / maxCount) * 12;
                return (
                  <Marker key={`${city}-${lat}`} coordinates={[lng, lat]}>
                    <circle r={r + 4} fill="#6c63ff" fillOpacity={0.12} />
                    <circle r={r} fill="#6c63ff" fillOpacity={0.85} />
                    <text
                      textAnchor="middle"
                      y={-(r + 5)}
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 7,
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

            {/* Known city dots when no real data yet */}
            {!hasRealData &&
              KNOWN_CITIES.map(({ city, lat, lng }, i) => (
                <Marker key={`known-${i}`} coordinates={[lng, lat]}>
                  <circle r={4} fill="#6c63ff" fillOpacity={0.25} />
                  <circle r={2} fill="#6c63ff" fillOpacity={0.5} />
                  <text
                    textAnchor="middle"
                    y={-7}
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 6.5,
                      fill: '#0f0f1a88',
                      pointerEvents: 'none',
                    }}
                  >
                    {city}
                  </text>
                </Marker>
              ))}
          </ZoomableGroup>
        </ComposableMap>

        {/* No-data overlay */}
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
