"use client";

import { useState, useCallback, useMemo } from "react";
import { Eye, EyeOff, MapPin } from "lucide-react";

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

export function TrackMap({ sessionKey, driverNumber, lapDateStart, lapDateEnd }: TrackMapProps) {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<LocationSample[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const loadTrack = useCallback(async () => {
    if (!lapDateStart || !lapDateEnd) return;
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({
        session_key: String(sessionKey),
        driver_number: String(driverNumber),
        "date>=": lapDateStart,
        "date<=": lapDateEnd,
      });
      const res = await fetch(`https://api.openf1.org/v1/location?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw: LocationSample[] = await res.json();
      setData(downsample(raw, 200));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [sessionKey, driverNumber, lapDateStart, lapDateEnd]);

  const handleToggle = useCallback(() => {
    const next = !visible;
    setVisible(next);
    if (next && !data && !loading) loadTrack();
  }, [visible, data, loading, loadTrack]);

  const points = useMemo(() => (data ? normalize(data) : []), [data]);

  if (!lapDateStart || !lapDateEnd) return null;

  const padding = 20;
  const size = 200;
  const svgSize = size + padding * 2;

  const polylinePoints = points.map((p) => `${padding + p.nx * size},${padding + (1 - p.ny) * size}`).join(" ");

  return (
    <div className="panel rounded-[28px] p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="size-3.5 text-[var(--accent-cool)]" />
          <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">Circuit trace</p>
        </div>
        <button
          onClick={handleToggle}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs text-white/50 transition hover:text-white/70"
        >
          {visible ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
          {visible ? "Hide" : "Show"}
        </button>
      </div>

      {visible && (
        <div className="mt-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="size-5 animate-spin rounded-full border-2 border-white/15 border-t-[var(--accent)]" />
              <span className="ml-3 text-sm text-white/40">Fetching location data…</span>
            </div>
          )}

          {error && (
            <div className="rounded-[18px] border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/38">
              Failed to load location data.
            </div>
          )}

          {!loading && !error && points.length > 5 && (
            <>
              <div className="flex justify-center">
                <svg
                  viewBox={`0 0 ${svgSize} ${svgSize}`}
                  width="100%"
                  style={{ maxWidth: 280, aspectRatio: "1" }}
                >
                  <polyline
                    points={polylinePoints}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.7"
                  />
                  {points.length > 0 && (
                    <circle
                      cx={padding + points[0].nx * size}
                      cy={padding + (1 - points[0].ny) * size}
                      r="4"
                      fill="var(--accent)"
                      stroke="rgba(5,6,11,0.8)"
                      strokeWidth="2"
                    />
                  )}
                </svg>
              </div>
              <p className="mt-2 text-center text-[10px] text-white/25">
                GPS coordinates are approximate. Circuit shape may vary.
              </p>
            </>
          )}

          {!loading && !error && data && points.length <= 5 && (
            <div className="rounded-[18px] border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/38">
              Not enough GPS samples for this lap.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
