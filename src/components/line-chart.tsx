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

import { formatDuration } from "@/lib/format";

type ChartPoint = {
  label: string;
  value: number | null;
};

type FormatType = "duration" | "position" | "number";

type LineChartProps = {
  title: string;
  subtitle: string;
  color?: string;
  points: ChartPoint[];
  invert?: boolean;
  formatType?: FormatType;
};

function applyFormat(type: FormatType, value: number): string {
  if (type === "duration") return formatDuration(value) ?? "—";
  if (type === "position") return `P${Math.round(value)}`;
  return value.toFixed(1);
}

type TooltipPayloadItem = {
  value: number;
  color: string;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  formatter: (value: number) => string;
  color: string;
};

function CustomTooltip({
  active,
  payload,
  label,
  formatter,
  color,
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-[14px] px-3 py-2.5 text-xs shadow-2xl"
      style={{
        background: "rgba(5, 6, 11, 0.94)",
        border: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(20px)",
        minWidth: 100,
      }}
    >
      <p className="mb-1.5 text-white/40" style={{ letterSpacing: "0.08em" }}>
        {label}
      </p>
      <p
        className="display-font text-xl"
        style={{ color, letterSpacing: "0.04em" }}
      >
        {formatter(payload[0].value)}
      </p>
    </div>
  );
}

export function LineChart({
  title,
  subtitle,
  color = "var(--accent)",
  points,
  invert = false,
  formatType = "number",
}: LineChartProps) {
  const formatter = (value: number) => applyFormat(formatType, value);
  const validPoints = points.filter(
    (point): point is ChartPoint & { value: number } =>
      typeof point.value === "number" && Number.isFinite(point.value),
  );

  if (validPoints.length < 2) {
    return (
      <div className="panel rounded-[28px] p-5">
        <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">
          {title}
        </p>
        <p className="mt-2 text-sm text-white/55">{subtitle}</p>
        <div className="mt-8 rounded-[18px] border border-dashed border-white/10 px-4 py-12 text-center text-sm text-white/35">
          Not enough timing samples available yet.
        </div>
      </div>
    );
  }

  const values = validPoints.map((p) => p.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const gradientId = `grad-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  const data = validPoints.map((p) => ({ label: p.label, value: p.value }));

  // For inverted charts (position), best value is lowest number
  const bestValue = invert ? minValue : maxValue;
  const worstValue = invert ? maxValue : minValue;

  return (
    <div className="panel rounded-[28px] p-5">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">
            {title}
          </p>
          <p className="mt-2 text-sm text-white/55">{subtitle}</p>
        </div>
        <div className="shrink-0 text-right">
          <div
            className="display-font text-2xl"
            style={{ color, lineHeight: 1 }}
          >
            {formatter(bestValue)}
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-white/35">
            {invert ? "best pos" : "peak"}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: "100%", height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
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
              reversed={invert}
              domain={["auto", "auto"]}
            />

            <Tooltip
              content={(props) => (
                <CustomTooltip
                  active={props.active}
                  payload={props.payload as unknown as TooltipPayloadItem[]}
                  label={props.label as string}
                  formatter={formatter}
                  color={color}
                />
              )}
              cursor={{
                stroke: "rgba(255,255,255,0.12)",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />

            {/* Best lap reference line */}
            <ReferenceLine
              y={bestValue}
              stroke={color}
              strokeOpacity={0.25}
              strokeDasharray="3 6"
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{
                r: 5,
                fill: color,
                stroke: "rgba(5,6,11,0.8)",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer labels */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs text-white/35">
          <span
            className="inline-block size-1.5 rounded-full"
            style={{ background: color }}
          />
          {validPoints[0].label}
        </span>
        <div className="text-center text-[10px] text-white/25">
          {validPoints.length} data points
        </div>
        <span className="text-xs text-white/35">
          {validPoints[validPoints.length - 1].label}
        </span>
      </div>

      {/* Min/Max row */}
      <div className="mt-3 flex items-center justify-between rounded-[12px] border border-white/5 bg-white/2 px-3 py-2 text-xs">
        <div>
          <span className="text-white/35">
            {invert ? "front" : "low"}&nbsp;
          </span>
          <span className="font-medium text-white/65">{formatter(worstValue)}</span>
        </div>
        <div
          className="h-px flex-1 mx-3"
          style={{
            background: `linear-gradient(90deg, rgba(255,255,255,0.05), ${color}40, rgba(255,255,255,0.05))`,
          }}
        />
        <div>
          <span className="text-white/35">
            {invert ? "lead" : "peak"}&nbsp;
          </span>
          <span className="font-medium" style={{ color }}>
            {formatter(bestValue)}
          </span>
        </div>
      </div>
    </div>
  );
}
