"use client";

import { useState, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type CarDataSample = {
  date: string;
  speed: number;
  throttle: number;
  brake: number;
  n_gear: number;
};

type LapTelemetryPanelProps = {
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

const CHANNELS = [
  { key: "speed" as const, label: "Speed", unit: "km/h", color: "#7af5ff", domain: [0, 370] },
  { key: "throttle" as const, label: "Throttle", unit: "%", color: "#4ae38f", domain: [0, 100] },
  { key: "brake" as const, label: "Brake", unit: "%", color: "#ff5555", domain: [0, 100] },
  { key: "n_gear" as const, label: "Gear", unit: "", color: "#ffd84d", domain: [0, 8] },
];

type TooltipEntry = { value: number; color: string };

function TelemetryTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-[10px] px-2.5 py-1.5 text-xs shadow-2xl"
      style={{ background: "rgba(5,6,11,0.94)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <span className="font-mono text-white">{payload[0].value}</span>
      <span className="ml-1 text-white/35">{label}</span>
    </div>
  );
}

export function LapTelemetryPanel({
  sessionKey,
  driverNumber,
  lapDateStart,
  lapDateEnd,
}: LapTelemetryPanelProps) {
  const [data, setData] = useState<CarDataSample[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const loadTelemetry = useCallback(async () => {
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
      const res = await fetch(`https://api.openf1.org/v1/car_data?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw: CarDataSample[] = await res.json();
      setData(downsample(raw, 200));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [sessionKey, driverNumber, lapDateStart, lapDateEnd]);

  if (!lapDateStart || !lapDateEnd) {
    return null;
  }

  if (!data && !loading) {
    return (
      <div className="panel rounded-[28px] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">Lap telemetry</p>
            <p className="mt-2 text-sm text-white/55">
              Speed, throttle, brake &amp; gear trace for the fastest lap.
            </p>
          </div>
          <button
            onClick={loadTelemetry}
            className="shrink-0 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/8 px-4 py-2 text-xs font-medium text-[var(--accent)] transition hover:bg-[var(--accent)]/15"
          >
            Load telemetry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="panel rounded-[28px] p-5">
        <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">Lap telemetry</p>
        <div className="mt-6 flex items-center justify-center py-8">
          <div className="size-5 animate-spin rounded-full border-2 border-white/15 border-t-[var(--accent)]" />
          <span className="ml-3 text-sm text-white/40">Fetching car data…</span>
        </div>
      </div>
    );
  }

  if (error || !data || data.length < 5) {
    return (
      <div className="panel rounded-[28px] p-5">
        <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">Lap telemetry</p>
        <div className="mt-5 rounded-[18px] border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/38">
          {error ? "Failed to load telemetry data." : "Not enough telemetry samples."}
        </div>
      </div>
    );
  }

  const chartData = data.map((s, i) => ({
    idx: i,
    speed: s.speed,
    throttle: s.throttle,
    brake: s.brake,
    n_gear: s.n_gear,
  }));

  return (
    <div className="panel rounded-[28px] p-5">
      <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">Lap telemetry</p>
      <p className="mt-2 text-sm text-white/55">
        Fastest lap — {data.length} samples at ~3.7 Hz
      </p>

      <div className="mt-4 space-y-1">
        {CHANNELS.map((ch) => (
          <div key={ch.key}>
            <div className="mb-0.5 flex items-center justify-between text-[10px]">
              <span className="uppercase tracking-widest" style={{ color: `${ch.color}88` }}>
                {ch.label}
              </span>
              {ch.unit && <span className="text-white/25">{ch.unit}</span>}
            </div>
            <div style={{ width: "100%", height: 64 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id={`tele-${ch.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={ch.color} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={ch.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="idx" hide />
                  <YAxis hide domain={ch.domain} />
                  <Tooltip
                    content={(props) => (
                      <TelemetryTooltip
                        active={props.active}
                        payload={props.payload as unknown as TooltipEntry[]}
                        label={ch.unit}
                      />
                    )}
                    cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey={ch.key}
                    stroke={ch.color}
                    strokeWidth={1.5}
                    fill={`url(#tele-${ch.key})`}
                    dot={false}
                    activeDot={{ r: 3, fill: ch.color, stroke: "rgba(5,6,11,0.8)", strokeWidth: 1 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
