"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import type { MeetingCard } from "@/lib/openf1";
import { LAND_PATH, MAP_WIDTH, MAP_HEIGHT, PROJ_SCALE, PROJ_TRANSLATE } from "@/data/world-paths";

type Coord = { lat: number; lng: number };

const CIRCUIT_COORDS: Record<string, Coord> = {
  Melbourne:              { lat: -37.85, lng: 144.97 },
  Shanghai:               { lat: 31.34,  lng: 121.22 },
  Suzuka:                 { lat: 34.84,  lng: 136.54 },
  Sakhir:                 { lat: 26.03,  lng: 50.51  },
  Jeddah:                 { lat: 21.63,  lng: 39.10  },
  Miami:                  { lat: 25.96,  lng: -80.24 },
  "Monte Carlo":          { lat: 43.73,  lng: 7.42   },
  Montreal:               { lat: 45.50,  lng: -73.52 },
  Catalunya:              { lat: 41.57,  lng: 2.26   },
  Spielberg:              { lat: 47.22,  lng: 14.76  },
  Silverstone:            { lat: 52.07,  lng: -1.02  },
  "Spa-Francorchamps":    { lat: 50.44,  lng: 5.97   },
  Hungaroring:            { lat: 47.58,  lng: 19.25  },
  Zandvoort:              { lat: 52.39,  lng: 4.54   },
  Monza:                  { lat: 45.62,  lng: 9.28   },
  Madring:                { lat: 40.45,  lng: -3.58  },
  Baku:                   { lat: 40.37,  lng: 49.85  },
  Singapore:              { lat: 1.29,   lng: 103.86 },
  Austin:                 { lat: 30.13,  lng: -97.64 },
  "Mexico City":          { lat: 19.40,  lng: -99.09 },
  Interlagos:             { lat: -23.70, lng: -46.70 },
  "Las Vegas":            { lat: 36.11,  lng: -115.17},
  Lusail:                 { lat: 25.49,  lng: 51.45  },
  "Yas Marina Circuit":   { lat: 24.47,  lng: 54.60  },
  "Miami Gardens":        { lat: 25.96,  lng: -80.24 },
  "São Paulo":            { lat: -23.70, lng: -46.70 },
  "Montréal":             { lat: 45.50,  lng: -73.52 },
  "Marina Bay":           { lat: 1.29,   lng: 103.86 },
  Madrid:                 { lat: 40.45,  lng: -3.58  },
};

function project(lat: number, lng: number): { x: number; y: number } {
  const phi = (lat * Math.PI) / 180;
  const lambda = (lng * Math.PI) / 180;
  const phi2 = phi * phi;
  const phi4 = phi2 * phi2;
  const phi6 = phi2 * phi4;

  const rawX = lambda * (0.8707 - 0.131979 * phi2 - 0.013791 * phi4 + 0.003971 * phi6);
  const rawY = phi * (1.007226 + 0.015085 * phi2 - 0.044475 * phi4 + 0.028874 * phi6);

  const x = PROJ_TRANSLATE[0] + PROJ_SCALE * rawX;
  const y = PROJ_TRANSLATE[1] - PROJ_SCALE * rawY;
  return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
}

function getCoords(card: MeetingCard): Coord | null {
  return (
    CIRCUIT_COORDS[card.meeting.circuit_short_name] ??
    CIRCUIT_COORDS[card.meeting.location] ??
    null
  );
}

const STATUS_COLORS: Record<string, { fill: string; glow: string }> = {
  completed:  { fill: "#ff5a36", glow: "rgba(255,90,54,0.5)" },
  live:       { fill: "#22d65a", glow: "rgba(34,214,90,0.55)" },
  upcoming:   { fill: "rgba(255,255,255,0.35)", glow: "transparent" },
  cancelled:  { fill: "rgba(255,80,80,0.25)", glow: "transparent" },
};

type MarkerInfo = {
  card: MeetingCard;
  x: number;
  y: number;
  fill: string;
  glow: string;
  index: number;
};

export function SeasonMap({ meetings }: { meetings: MeetingCard[] }) {
  const router = useRouter();
  const [hovered, setHovered] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const markers: MarkerInfo[] = useMemo(() => {
    let idx = 0;
    return meetings
      .map((card) => {
        const coord = getCoords(card);
        if (!coord) return null;
        const { x, y } = project(coord.lat, coord.lng);
        idx++;
        const colors = STATUS_COLORS[card.status] ?? STATUS_COLORS.upcoming;
        return { card, x, y, fill: colors.fill, glow: colors.glow, index: idx };
      })
      .filter((m): m is MarkerInfo => m !== null);
  }, [meetings]);

  const handleClick = useCallback(
    (meetingKey: number) => { router.push(`/races/${meetingKey}`); },
    [router],
  );

  const completedMarkers = markers.filter((m) => m.card.status === "completed");

  const hoveredMarker = hovered
    ? markers.find((m) => m.card.meeting.meeting_key === hovered)
    : null;

  return (
    <section className="panel rounded-[30px] p-5 lg:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">
            Season Map
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            2026 Grand Prix calendar
          </h2>
        </div>
        <div className="flex items-center gap-5 text-xs text-white/50">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-[var(--accent)]" />
            Completed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full" style={{ background: "#22d65a" }} />
            Live
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-white/25" />
            Upcoming
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full" style={{ background: "rgba(255,80,80,0.25)" }} />
            Cancelled
          </span>
        </div>
      </div>

      <div className="season-map-wrap relative w-full overflow-hidden rounded-[20px] border border-white/6">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="season-map-svg w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <radialGradient id="glow-red" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff5a36" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#ff5a36" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="glow-green" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22d65a" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#22d65a" stopOpacity="0" />
            </radialGradient>
            <filter id="soften">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>

          {/* Land mass */}
          <path
            d={LAND_PATH}
            fill="rgba(255,255,255,0.04)"
            stroke="rgba(255,255,255,0.10)"
            strokeWidth="0.4"
          />

          {/* Route connecting completed races */}
          {completedMarkers.length > 1 &&
            completedMarkers.map((marker, i) => {
              if (i === 0) return null;
              const prev = completedMarkers[i - 1];
              const dx = marker.x - prev.x;
              const dy = marker.y - prev.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const curve = Math.min(dist * 0.3, 50);
              const mx = (prev.x + marker.x) / 2;
              const my = (prev.y + marker.y) / 2 - curve;
              return (
                <path
                  key={`route-${i}`}
                  d={`M${prev.x},${prev.y} Q${mx},${my} ${marker.x},${marker.y}`}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="1.2"
                  strokeOpacity="0.18"
                  strokeDasharray="4 5"
                  className="season-route-line"
                />
              );
            })}

          {/* Markers */}
          {markers.map((marker) => {
            const isHovered = hovered === marker.card.meeting.meeting_key;
            const isCompleted = marker.card.status === "completed";
            const isLive = marker.card.status === "live";
            const isActive = isCompleted || isLive;
            const glowGrad = isLive ? "url(#glow-green)" : "url(#glow-red)";

            return (
              <g
                key={marker.card.meeting.meeting_key}
                className="season-marker cursor-pointer"
                onClick={() => handleClick(marker.card.meeting.meeting_key)}
                onMouseEnter={() => setHovered(marker.card.meeting.meeting_key)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Glow */}
                {isActive && (
                  <circle
                    cx={marker.x}
                    cy={marker.y}
                    r={isHovered ? 28 : 20}
                    fill={glowGrad}
                    filter="url(#soften)"
                    className="transition-all duration-300"
                  />
                )}

                {/* Pulse ring for live */}
                {isLive && (
                  <circle cx={marker.x} cy={marker.y} r="8" fill="none" stroke="#22d65a" strokeWidth="1" strokeOpacity="0.6">
                    <animate attributeName="r" from="6" to="22" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="stroke-opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Dot */}
                <circle
                  cx={marker.x}
                  cy={marker.y}
                  r={isHovered ? 6 : isActive ? 4.5 : 3}
                  fill={marker.fill}
                  stroke={isHovered ? "white" : isActive ? "rgba(5,6,11,0.4)" : "transparent"}
                  strokeWidth={isHovered ? 2 : 1}
                  className="transition-all duration-200"
                />

                {/* Country code label */}
                {!isHovered && isActive && (
                  <text
                    x={marker.x}
                    y={marker.y + 16}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.30)"
                    fontSize="7"
                    fontFamily="var(--font-mono)"
                    fontWeight="500"
                    letterSpacing="0.06em"
                  >
                    {marker.card.meeting.country_code}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* HTML tooltip positioned via CSS (avoids SVG foreignObject + hydration) */}
        {hoveredMarker && svgRef.current && (
          <Tooltip marker={hoveredMarker} svgEl={svgRef.current} />
        )}
      </div>
    </section>
  );
}

function Tooltip({ marker, svgEl }: { marker: MarkerInfo; svgEl: SVGSVGElement }) {
  const rect = svgEl.getBoundingClientRect();
  const viewBox = svgEl.viewBox.baseVal;

  const pxX = ((marker.x - viewBox.x) / viewBox.width) * rect.width;
  const pxY = ((marker.y - viewBox.y) / viewBox.height) * rect.height;

  const statusLabel = marker.card.status.charAt(0).toUpperCase() + marker.card.status.slice(1);

  return (
    <div
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full"
      style={{ left: pxX, top: pxY - 14 }}
    >
      <div className="season-map-tooltip rounded-xl border border-white/10 bg-[rgba(5,6,11,0.94)] px-3.5 py-2 shadow-lg backdrop-blur-md">
        <p className="whitespace-nowrap text-[11px] font-semibold text-white">
          <span className="mr-1.5 font-mono text-[10px] text-white/40">R{marker.index}</span>
          {marker.card.meeting.meeting_name.replace(" Grand Prix", " GP")}
        </p>
        <p className="mt-0.5 flex items-center gap-2 whitespace-nowrap text-[10px] text-white/45">
          <span>{marker.card.meeting.location}</span>
          <span className="inline-block size-1 rounded-full" style={{ background: marker.fill }} />
          <span style={{ color: marker.fill }}>{statusLabel}</span>
        </p>
      </div>
    </div>
  );
}
