"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

import type { IntervalSample } from "@/lib/openf1";

type GapTraceChartProps = {
  gaps: IntervalSample[];
  color?: string;
};

function downsample<T>(items: T[], maxPoints: number): T[] {
  if (items.length <= maxPoints) return items;
  return Array.from({ length: maxPoints }, (_, i) => {
    const idx = Math.round((i * (items.length - 1)) / (maxPoints - 1));
    return items[idx];
  });
}

type TooltipPayloadItem = { value: number; color: string };

function GapTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div
      className="rounded-[14px] px-3 py-2.5 text-xs shadow-2xl"
      style={{
        background: "rgba(5,6,11,0.94)",
        border: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(20px)",
      }}
    >
      <p className="mb-1.5 text-white/40" style={{ letterSpacing: "0.08em" }}>
        {label}
      </p>
      <p className="display-font text-xl text-white">
        {val === 0 ? "Leader" : `+${val.toFixed(val >= 10 ? 1 : 3)}s`}
      </p>
    </div>
  );
}

export function GapTraceChart({ gaps, color = "var(--accent)" }: GapTraceChartProps) {
  const processed = gaps
    .map((s) => {
      const raw = s.gap_to_leader;
      const val = typeof raw === "number" ? raw : 0;
      return { date: s.date, value: val };
    })
    .filter((d) => Number.isFinite(d.value));

  const data = downsample(processed, 60).map((d, i) => ({
    label: d.date.slice(11, 16),
    value: d.value,
    idx: i,
  }));

  if (data.length < 3) {
    return (
      <div className="panel rounded-[28px] p-5">
        <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">Gap to leader</p>
        <div className="mt-6 rounded-[18px] border border-dashed border-white/10 px-4 py-12 text-center text-sm text-white/35">
          Not enough interval samples available.
        </div>
      </div>
    );
  }

  const maxGap = Math.max(...data.map((d) => d.value));
  const avgGap = data.reduce((s, d) => s + d.value, 0) / data.length;

  return (
    <div className="panel rounded-[28px] p-5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">Gap to leader</p>
          <p className="mt-2 text-sm text-white/55">
            Flat = consistent pace; rising = falling behind; drops = pit window or safety car.
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="display-font text-2xl text-white" style={{ lineHeight: 1 }}>
            {avgGap === 0 ? "Leader" : `+${avgGap.toFixed(1)}s`}
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-white/35">avg gap</p>
        </div>
      </div>

      <div style={{ width: "100%", height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="gap-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff5a36" stopOpacity={0.35} />
                <stop offset="60%" stopColor="#4ae38f" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#4ae38f" stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="label"
              tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              tickMargin={6}
            />
            <YAxis
              hide
              domain={[0, Math.ceil(maxGap * 1.15)]}
            />

            <Tooltip
              content={(props) => (
                <GapTooltip
                  active={props.active}
                  payload={props.payload as unknown as TooltipPayloadItem[]}
                  label={props.label as string}
                />
              )}
              cursor={{ stroke: "rgba(255,255,255,0.12)", strokeWidth: 1, strokeDasharray: "4 4" }}
            />

            <ReferenceLine y={0} stroke="#4ae38f" strokeOpacity={0.3} strokeDasharray="3 6" label={{ value: "LEADER", fill: "#4ae38f88", fontSize: 9, position: "insideTopRight" }} />

            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill="url(#gap-grad)"
              dot={false}
              activeDot={{ r: 5, fill: color, stroke: "rgba(5,6,11,0.8)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-white/35">
        <span>{data[0]?.label}</span>
        <span>{data.length} samples</span>
        <span>{data.at(-1)?.label}</span>
      </div>
    </div>
  );
}
