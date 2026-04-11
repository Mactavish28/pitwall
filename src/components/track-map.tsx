"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { MapPin } from "lucide-react";

import { InlineLoader } from "@/components/inline-loader";
import { openF1ProxyUrl } from "@/lib/openf1-client-proxy";

type LocationSample = {
  x: number;
  y: number;
};

type TrackMapProps = {
  sessionKey: number;
  driverNumber: number;
  lapDateStart: string | null;
  lapDateEnd: string | null;
};

function downsample<T>(items: T[], maxPoints: number): T[] {
  if (items.length <= maxPoints) return items;
  return Array.from({ length: maxPoints }, (_, i) => {
    const idx = Math.round((i * (items.length - 1)) / (maxPoints - 1));
    return items[idx];
  });
}

function normalize(samples: LocationSample[]): { nx: number; ny: number }[] {
  if (samples.length === 0) return [];
  const xs = samples.map((s) => s.x);
  const ys = samples.map((s) => s.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const scale = Math.max(rangeX, rangeY);
  const offX = (scale - rangeX) / 2;
  const offY = (scale - rangeY) / 2;
  return samples.map((s) => ({
    nx: (s.x - minX + offX) / scale,
    ny: (s.y - minY + offY) / scale,
  }));
}

function buildApiUrl(sessionKey: number, driverNumber: number, dateStart: string, dateEnd: string) {
  // Proxy uses `date_start` / `date_end` so Next.js URL parsing is stable; the route rewrites to OpenF1 `date>=` / `date<=`.
  const qs = [
    `session_key=${sessionKey}`,
    `driver_number=${driverNumber}`,
    `date_start=${encodeURIComponent(dateStart)}`,
    `date_end=${encodeURIComponent(dateEnd)}`,
  ].join("&");
  return openF1ProxyUrl(`location?${qs}`);
}

export function TrackMap({ sessionKey, driverNumber, lapDateStart, lapDateEnd }: TrackMapProps) {
  const [data, setData] = useState<LocationSample[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const loadInFlightRef = useRef(false);

  useEffect(() => {
    setData(null);
    setLoading(false);
    setError(false);
    loadInFlightRef.current = false;
  }, [sessionKey, driverNumber, lapDateStart, lapDateEnd]);

  const loadTrack = useCallback(async () => {
    if (!lapDateStart || !lapDateEnd) return;
    if (loadInFlightRef.current) return;
    loadInFlightRef.current = true;
    setData(null);
    setLoading(true);
    setError(false);
    try {
      const url = buildApiUrl(sessionKey, driverNumber, lapDateStart, lapDateEnd);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw: LocationSample[] = await res.json();
      if (raw.length === 0) throw new Error("No data");
      setData(downsample(raw, 200));
    } catch {
      setError(true);
    } finally {
      loadInFlightRef.current = false;
      setLoading(false);
    }
  }, [sessionKey, driverNumber, lapDateStart, lapDateEnd]);

  const points = useMemo(() => (data ? normalize(data) : []), [data]);

  if (!lapDateStart || !lapDateEnd) return null;

  const padding = 20;
  const size = 200;
  const svgSize = size + padding * 2;
  const polylinePoints = points.map((p) => `${padding + p.nx * size},${padding + (1 - p.ny) * size}`).join(" ");

  const hasTrace = Boolean(data && points.length > 5);
  const showInsufficient =
    Boolean(data && points.length > 0 && points.length <= 5 && !error);

  if (!hasTrace) {
    return (
      <div className="panel rounded-[28px] p-5">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-[var(--accent-cool)]" />
          <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">Circuit trace</p>
        </div>
        <p className="mt-2 text-sm text-white/55">GPS outline of the fastest lap.</p>
        {loading ? (
          <InlineLoader label="Loading circuit trace…" className="mt-2 rounded-[16px] border border-white/6 bg-white/[0.02]" />
        ) : null}
        {!loading && error ? (
          <>
            <div className="mt-4 rounded-[18px] border border-dashed border-white/10 px-4 py-6 text-center text-sm text-white/38">
              GPS data unavailable for this lap.
            </div>
            <button
              type="button"
              onClick={loadTrack}
              disabled={loading}
              className="mt-3 w-full rounded-[16px] border border-white/10 bg-white/4 py-2.5 text-xs text-white/50 transition hover:text-white/70 disabled:pointer-events-none disabled:opacity-40"
            >
              Retry
            </button>
          </>
        ) : null}
        {!loading && !error && showInsufficient ? (
          <>
            <div className="mt-4 rounded-[18px] border border-dashed border-white/10 px-4 py-6 text-center text-sm text-white/38">
              Not enough GPS samples for this lap.
            </div>
            <button
              type="button"
              onClick={loadTrack}
              disabled={loading}
              className="mt-3 w-full rounded-[16px] border border-white/10 bg-white/4 py-2.5 text-xs text-white/50 transition hover:text-white/70 disabled:pointer-events-none disabled:opacity-40"
            >
              Retry
            </button>
          </>
        ) : null}
        {!loading && !error && !showInsufficient ? (
          <button
            type="button"
            onClick={loadTrack}
            disabled={loading}
            className="mt-4 w-full rounded-[16px] border border-[var(--accent-cool)]/20 bg-[var(--accent-cool)]/6 py-3 text-sm font-medium text-[var(--accent-cool)] transition hover:bg-[var(--accent-cool)]/12 disabled:pointer-events-none disabled:opacity-40"
          >
            Load circuit trace
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="panel rounded-[28px] p-5">
      <div className="flex items-center gap-2">
        <MapPin className="size-4 text-[var(--accent-cool)]" />
        <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">Circuit trace</p>
      </div>
      <p className="mt-2 text-sm text-white/55">GPS outline of the fastest lap.</p>

      <div className="mt-4">
        <div className="flex justify-center">
          <svg
            viewBox={`0 0 ${svgSize} ${svgSize}`}
            width="100%"
            style={{ maxWidth: 260, aspectRatio: "1" }}
          >
            <polyline
              points={polylinePoints}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
            />
            {points.length > 0 && (
              <>
                <circle
                  cx={padding + points[0]!.nx * size}
                  cy={padding + (1 - points[0]!.ny) * size}
                  r="5"
                  fill="var(--accent)"
                  stroke="rgba(5,6,11,0.8)"
                  strokeWidth="2"
                />
                <text
                  x={padding + points[0]!.nx * size + 8}
                  y={padding + (1 - points[0]!.ny) * size + 3}
                  fill="rgba(255,255,255,0.4)"
                  fontSize="8"
                >
                  S/F
                </text>
              </>
            )}
          </svg>
        </div>
        <p className="mt-2 text-center text-[10px] text-white/25">
          Coordinates are approximate — shape may vary from actual layout.
        </p>
      </div>
    </div>
  );
}
