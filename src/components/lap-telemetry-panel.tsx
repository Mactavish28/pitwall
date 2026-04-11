"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Activity } from "lucide-react";

type CarDataSample = {
  date: string;
  speed: number;
  throttle: number;
  brake: number;
  n_gear: number;
  drs?: number;
  rpm?: number;
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

function computeLapInsights(samples: CarDataSample[]) {
  const n = samples.length;
  if (n < 5) return null;

  const wotPct = (samples.filter((s) => s.throttle >= 95).length / n) * 100;
  let brakeApplications = 0;
  for (let i = 1; i < n; i++) {
    if (samples[i - 1].brake < 20 && samples[i].brake >= 50) brakeApplications++;
  }
  const avgSpeed = samples.reduce((a, s) => a + s.speed, 0) / n;
  const avgThrottle = samples.reduce((a, s) => a + s.throttle, 0) / n;
  const maxRpm = samples.some((s) => s.rpm != null)
    ? Math.max(...samples.map((s) => s.rpm ?? 0))
    : null;

  const hasDrs = samples.some((s) => s.drs != null && Number.isFinite(s.drs));
  const drsOnPct = hasDrs
    ? (samples.filter((s) => (s.drs ?? 0) >= 8).length / n) * 100
    : null;

  return { wotPct, brakeApplications, avgSpeed, avgThrottle, maxRpm, drsOnPct };
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

function buildApiUrl(sessionKey: number, driverNumber: number, dateStart: string, dateEnd: string) {
  return `https://api.openf1.org/v1/car_data?session_key=${sessionKey}&driver_number=${driverNumber}&date>=${encodeURIComponent(dateStart)}&date<=${encodeURIComponent(dateEnd)}`;
}

function InsightTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[14px] border border-white/6 bg-white/[0.02] px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-widest text-white/30">{label}</p>
      <p className="mt-1 font-mono text-lg text-white">{value}</p>
      <p className="mt-0.5 text-[10px] leading-snug text-white/32">{hint}</p>
    </div>
  );
}

export function LapTelemetryPanel({
  sessionKey,
  driverNumber,
  lapDateStart,
  lapDateEnd,
}: LapTelemetryPanelProps) {
  const [rawData, setRawData] = useState<CarDataSample[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setRawData(null);
    setLoading(false);
    setError(false);
  }, [sessionKey, driverNumber, lapDateStart, lapDateEnd]);

  const loadTelemetry = useCallback(async () => {
    if (!lapDateStart || !lapDateEnd) return;
    setLoading(true);
    setError(false);
    try {
      const url = buildApiUrl(sessionKey, driverNumber, lapDateStart, lapDateEnd);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw: CarDataSample[] = await res.json();
      if (raw.length === 0) throw new Error("No data");
      setRawData(raw);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [sessionKey, driverNumber, lapDateStart, lapDateEnd]);

  const chartData = useMemo(() => {
    if (!rawData || rawData.length < 5) return [];
    return downsample(rawData, 200).map((s, i) => ({
      idx: i,
      speed: s.speed,
      throttle: s.throttle,
      brake: s.brake,
      n_gear: s.n_gear,
    }));
  }, [rawData]);

  const insights = useMemo(() => (rawData ? computeLapInsights(rawData) : null), [rawData]);

  if (!lapDateStart || !lapDateEnd) {
    return null;
  }

  if (!rawData && !loading && !error) {
    return (
      <div className="panel rounded-[28px] p-5">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-[var(--accent)]" />
          <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">Lap telemetry</p>
        </div>
        <p className="mt-2 text-sm text-white/55">
          Speed, throttle, brake &amp; gear trace for the fastest lap.
        </p>
        <button
          onClick={loadTelemetry}
          className="mt-4 w-full rounded-[16px] border border-[var(--accent)]/20 bg-[var(--accent)]/6 py-3 text-sm font-medium text-[var(--accent)] transition hover:bg-[var(--accent)]/12"
        >
          Load telemetry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="panel rounded-[28px] p-5">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-[var(--accent)]" />
          <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">Lap telemetry</p>
        </div>
        <div className="mt-6 flex items-center justify-center py-8">
          <div className="size-5 animate-spin rounded-full border-2 border-white/15 border-t-[var(--accent)]" />
          <span className="ml-3 text-sm text-white/40">Fetching car data…</span>
        </div>
      </div>
    );
  }

  if (error || !rawData || rawData.length < 5) {
    return (
      <div className="panel rounded-[28px] p-5">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-[var(--accent)]" />
          <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">Lap telemetry</p>
        </div>
        <div className="mt-5 rounded-[18px] border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/38">
          {error ? "Telemetry data unavailable for this lap." : "Not enough telemetry samples."}
        </div>
        <button
          onClick={loadTelemetry}
          className="mt-3 w-full rounded-[16px] border border-white/10 bg-white/4 py-2.5 text-xs text-white/50 transition hover:text-white/70"
        >
          Retry
        </button>
      </div>
    );
  }

  const topSpeed = Math.max(...chartData.map((d) => d.speed));

  return (
    <div className="panel rounded-[28px] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-[var(--accent)]" />
            <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">Lap telemetry</p>
          </div>
          <p className="mt-2 text-sm text-white/55">
            Fastest lap — {rawData.length} samples (~3.7 Hz)
          </p>
        </div>
        <div className="text-right">
          <p className="display-font text-2xl" style={{ color: "#7af5ff", lineHeight: 1 }}>{topSpeed}</p>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-white/35">top km/h</p>
        </div>
      </div>

      {insights ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <InsightTile
            label="Wide-open throttle"
            value={`${insights.wotPct.toFixed(0)}%`}
            hint="Share of samples at ≥95% throttle — straights vs corners."
          />
          <InsightTile
            label="Hard braking"
            value={String(insights.brakeApplications)}
            hint="Approx. heavy brake applications (edge-detected from pedal)."
          />
          <InsightTile
            label="Avg speed / throttle"
            value={`${Math.round(insights.avgSpeed)} / ${Math.round(insights.avgThrottle)}`}
            hint="Mean km/h and mean % throttle across the lap."
          />
          {insights.maxRpm != null && insights.maxRpm > 0 ? (
            <InsightTile
              label="Peak RPM"
              value={Math.round(insights.maxRpm).toLocaleString()}
              hint="Highest engine speed in this lap window."
            />
          ) : null}
          {insights.drsOnPct != null ? (
            <InsightTile
              label="DRS active"
              value={`${insights.drsOnPct.toFixed(0)}%`}
              hint="Share of samples where DRS channel reads open (≥8)."
            />
          ) : null}
        </div>
      ) : null}

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
