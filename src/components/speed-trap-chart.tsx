"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

import type { Lap } from "@/lib/openf1";

type SpeedTrapChartProps = {
  laps: Lap[];
};

const COLORS = {
  i1: "var(--accent)",
  i2: "var(--accent-cool)",
  st: "#ffd84d",
};

type TooltipPayloadItem = { name: string; value: number; color: string };

function SpeedTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-[14px] px-3 py-2.5 text-xs shadow-2xl"
      style={{
        background: "rgba(5,6,11,0.94)",
        border: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(20px)",
      }}
    >
      <p className="mb-1.5 text-white/40" style={{ letterSpacing: "0.08em" }}>{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-2 text-xs">
          <span className="inline-block size-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-white/50">{entry.name}:</span>
          <span className="font-mono font-medium text-white">{entry.value} km/h</span>
        </p>
      ))}
    </div>
  );
}

export function SpeedTrapChart({ laps }: SpeedTrapChartProps) {
  const validLaps = laps.filter(
    (l) => !l.is_pit_out_lap && (l.i1_speed != null || l.i2_speed != null || l.st_speed != null),
  );

  const data = validLaps.map((l) => ({
    lap: `L${l.lap_number}`,
    I1: l.i1_speed ?? 0,
    I2: l.i2_speed ?? 0,
    ST: l.st_speed ?? 0,
  }));

  if (data.length < 2) {
    return (
      <div className="panel rounded-[28px] p-5">
        <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">Speed traps</p>
        <div className="mt-6 rounded-[18px] border border-dashed border-white/10 px-4 py-12 text-center text-sm text-white/35">
          No speed trap data available.
        </div>
      </div>
    );
  }

  const allSpeeds = data.flatMap((d) => [d.I1, d.I2, d.ST]).filter(Boolean);
  const topSpeed = Math.max(...allSpeeds);

  return (
    <div className="panel rounded-[28px] p-5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">Speed traps</p>
          <p className="mt-2 text-sm text-white/55">
            I1, I2 & speed trap readings per lap — tyre deg and fuel effect visible over distance.
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="display-font text-2xl" style={{ color: COLORS.st, lineHeight: 1 }}>
            {topSpeed}
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-white/35">top km/h</p>
        </div>
      </div>

      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barGap={1} barCategoryGap="15%">
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="lap"
              tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              interval={Math.max(0, Math.floor(data.length / 12))}
              tickMargin={6}
            />
            <YAxis hide domain={[0, "auto"]} />
            <Tooltip
              content={(props) => (
                <SpeedTooltip
                  active={props.active}
                  payload={props.payload as unknown as TooltipPayloadItem[]}
                  label={props.label as string}
                />
              )}
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
            />
            <Legend
              iconType="circle"
              iconSize={6}
              wrapperStyle={{ fontSize: 10, color: "rgba(255,255,255,0.4)", paddingTop: 8 }}
            />
            <Bar dataKey="I1" fill={COLORS.i1} radius={[2, 2, 0, 0]} maxBarSize={10} />
            <Bar dataKey="I2" fill={COLORS.i2} radius={[2, 2, 0, 0]} maxBarSize={10} />
            <Bar dataKey="ST" fill={COLORS.st} radius={[2, 2, 0, 0]} maxBarSize={10} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
