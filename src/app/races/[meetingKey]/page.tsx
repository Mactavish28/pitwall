import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CloudRainWind,
  Flag,
  Radio,
  TimerReset,
  Trophy,
  Wind,
  Thermometer,
} from "lucide-react";

import { DriverSelector } from "@/components/driver-selector";
import { GapTraceChart } from "@/components/gap-trace-chart";
import { LapTelemetryPanel } from "@/components/lap-telemetry-panel";
import { LineChart } from "@/components/line-chart";
import { OvertakeTimeline } from "@/components/overtake-timeline";
import { SectorTimeTable } from "@/components/sector-time-table";
import { SessionStandings } from "@/components/session-standings";
import { SpeedTrapChart } from "@/components/speed-trap-chart";
import { TeamRadioPlayer } from "@/components/team-radio-player";
import { TrackMap } from "@/components/track-map";
import { WindRose } from "@/components/wind-rose";
import {
  formatDuration,
  formatGap,
  formatLongDate,
  formatMeetingWindow,
  formatPositionChange,
  formatTemperature,
  formatUtcDateTime,
  formatWindSpeed,
} from "@/lib/format";
import {
  getRaceDetailSnapshot,
  type Driver,
  type EnrichedResult,
  type Stint,
} from "@/lib/openf1";

type RacePageProps = {
  params: Promise<{ meetingKey: string }>;
  searchParams: Promise<{ driver?: string }>;
};

function getAccent(teamColour?: string | null) {
  return teamColour ? `#${teamColour}` : "var(--accent)";
}

function compoundColors(compound: string) {
  const c = compound.toUpperCase();
  if (c.includes("SOFT")) return { fill: "#ff5555", text: "SOFT", cls: "tyre-soft" };
  if (c.includes("MEDIUM")) return { fill: "#ffd84d", text: "MEDIUM", cls: "tyre-medium" };
  if (c.includes("HARD")) return { fill: "#e0e0e0", text: "HARD", cls: "tyre-hard" };
  if (c.includes("INTER")) return { fill: "#4ae38f", text: "INTER", cls: "tyre-inter" };
  if (c.includes("WET")) return { fill: "#4aa7ff", text: "WET", cls: "tyre-wet" };
  return { fill: "#ff8c69", text: compound, cls: "tyre-hard" };
}

function DriverAvatar({ driver, size = 48 }: { driver: Driver | null; size?: number }) {
  const accent = getAccent(driver?.team_colour);
  if (driver?.headshot_url) {
    return (
      <Image
        alt={driver.full_name}
        className="rounded-full object-cover"
        height={size}
        src={driver.headshot_url}
        style={{ border: `2px solid ${accent}55`, boxShadow: `0 0 16px ${accent}25` }}
        width={size}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full text-xs font-semibold text-white/90"
      style={{
        border: `2px solid ${accent}55`,
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${accent}22, rgba(255,255,255,0.04))`,
      }}
    >
      {driver?.name_acronym ?? "F1"}
    </div>
  );
}

function downsample<T>(items: T[], maxPoints: number) {
  if (items.length <= maxPoints) return items;
  return Array.from({ length: maxPoints }, (_, index) => {
    const sourceIndex = Math.round((index * (items.length - 1)) / (maxPoints - 1));
    return items[sourceIndex];
  });
}

function ResultRow({ entry }: { entry: EnrichedResult }) {
  const accent = getAccent(entry.driver?.team_colour);
  const positionGained = entry.positionsGained ?? 0;

  return (
    <div
      className="result-row"
      style={{ "--team-color": `${accent}bb` } as React.CSSProperties}
    >
      <div
        className="display-font pl-1 text-3xl leading-none"
        style={{ color: entry.position != null && entry.position <= 3 ? accent : "rgba(255,255,255,0.8)" }}
      >
        {entry.position ?? "—"}
      </div>
      <div className="flex min-w-0 items-center gap-3">
        <DriverAvatar driver={entry.driver} size={34} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {entry.driver?.full_name ?? `Car ${entry.driver_number}`}
          </p>
          <p className="truncate text-xs text-white/40">{entry.driver?.team_name ?? "OpenF1"}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-[10px] uppercase tracking-[0.12em] text-white/30">Grid</p>
        <p className="mt-0.5 font-mono text-sm text-white/60">
          {entry.gridPosition ? `P${entry.gridPosition}` : "—"}
        </p>
      </div>
      <div className="text-right">
        <p className="text-[10px] uppercase tracking-[0.12em] text-white/30">Gain</p>
        <p
          className="mt-0.5 font-mono text-sm font-semibold"
          style={{
            color:
              positionGained > 0 ? "#4ae38f" : positionGained < 0 ? "#ff6b6b" : "rgba(255,255,255,0.45)",
          }}
        >
          {formatPositionChange(entry.positionsGained)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-[10px] uppercase tracking-[0.12em] text-white/30">Time</p>
        <p className="mt-0.5 font-mono text-sm text-white/60">
          {Array.isArray(entry.duration) ? "—" : formatDuration(entry.duration)}
        </p>
      </div>
    </div>
  );
}

function StrategyStrip({ stints, totalLaps }: { stints: Stint[]; totalLaps: number }) {
  if (stints.length === 0 || totalLaps === 0) {
    return (
      <div className="rounded-[18px] border border-dashed border-white/10 px-4 py-6 text-center text-sm text-white/38">
        Stint data will appear once OpenF1 publishes records.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {stints.map((stint) => {
        const width = ((stint.lap_end - stint.lap_start + 1) / totalLaps) * 100;
        const compound = compoundColors(stint.compound);

        return (
          <div key={`${stint.driver_number}-${stint.stint_number}`}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`tyre ${compound.cls}`}>{compound.text.slice(0, 4)}</span>
                <span className="text-xs text-white/50">
                  Laps {stint.lap_start}–{stint.lap_end}
                </span>
              </div>
              <span className="font-mono text-xs text-white/50">
                {stint.lap_end - stint.lap_start + 1}L
              </span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${Math.max(width, 4)}%`, background: compound.fill }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeatherStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[20px] border border-white/6 p-4"
      style={{ background: "rgba(122,245,255,0.04)" }}
    >
      <div className="flex items-center gap-2 text-xs text-white/42">
        {icon}
        <span className="uppercase tracking-[0.18em]">{label}</span>
      </div>
      <p className="display-font mt-3 text-4xl text-white">{value}</p>
    </div>
  );
}

export default async function RacePage({ params, searchParams }: RacePageProps) {
  const { meetingKey } = await params;
  const resolvedSearchParams = await searchParams;
  const parsedDriverNumber = resolvedSearchParams.driver
    ? Number(resolvedSearchParams.driver)
    : undefined;
  const selectedDriverNumber =
    typeof parsedDriverNumber === "number" && Number.isFinite(parsedDriverNumber)
      ? parsedDriverNumber
      : undefined;

  if (Number.isNaN(Number(meetingKey))) notFound();

  const detail = await getRaceDetailSnapshot(meetingKey, selectedDriverNumber);
  if (!detail) notFound();

  const selectedResult =
    detail.resultTable.find((e) => e.driver_number === detail.selectedDriverNumber) ?? null;
  const selectedPitStops = detail.pitStops.filter(
    (s) => s.driver_number === detail.selectedDriverNumber,
  );
  const lapPoints = detail.selectedDriverLaps
    .filter((lap) => !lap.is_pit_out_lap && typeof lap.lap_duration === "number")
    .map((lap) => ({ label: `L${lap.lap_number}`, value: lap.lap_duration }));
  const positionPoints = downsample(detail.selectedDriverPositions, 32).map((sample) => ({
    label: sample.date.slice(11, 16),
    value: sample.position,
  }));
  const bestLap =
    lapPoints.length > 0 ? Math.min(...lapPoints.map((l) => l.value ?? Infinity)) : null;
  const totalRaceLaps =
    detail.resultTable[0]?.number_of_laps ??
    detail.selectedDriverLaps.at(-1)?.lap_number ??
    0;
  const finalGap =
    detail.selectedDriverGaps.at(-1)?.gap_to_leader ?? selectedResult?.gap_to_leader ?? null;

  const fastestLap = detail.selectedDriverLaps
    .filter((l) => !l.is_pit_out_lap && typeof l.lap_duration === "number")
    .sort((a, b) => (a.lap_duration ?? Infinity) - (b.lap_duration ?? Infinity))[0] ?? null;

  const fastestLapStart = fastestLap?.date_start ?? null;
  const fastestLapEnd = (() => {
    if (!fastestLap) return null;
    const nextLap = detail.selectedDriverLaps.find(
      (l) => l.lap_number === fastestLap.lap_number + 1,
    );
    return nextLap?.date_start ?? null;
  })();

  const driverMapForRadio = new Map(
    detail.drivers.map((d) => [d.driver_number, { full_name: d.full_name, team_colour: d.team_colour }]),
  );

  const driverAccent = getAccent(detail.selectedDriver?.team_colour);

  return (
    <div className="flex-1">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 lg:px-8 lg:py-8">

        {/* ── Race Hero ─────────────────────────────────────────── */}
        <header className="panel-strong relative overflow-hidden rounded-[34px] p-6 lg:p-10">
          {detail.meeting.circuit_image ? (
            <Image
              alt={detail.meeting.circuit_short_name}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.14] mix-blend-screen"
              fill
              priority
              sizes="(min-width: 1280px) 1280px, 100vw"
              src={detail.meeting.circuit_image}
            />
          ) : null}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_top_right,rgba(122,245,255,0.16),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_bottom_left,rgba(255,90,54,0.08),transparent)]" />
          <div className="speed-stripe pointer-events-none absolute right-0 top-0 h-full w-28 opacity-40" />

          <div className="relative">
            <Link
              className="inline-flex items-center gap-2 text-sm text-white/48 transition hover:text-white"
              href="/"
            >
              <ArrowLeft className="size-4" />
              Back to season
            </Link>

            <div className="mt-6 grid gap-10 xl:grid-cols-[1.1fr_0.9fr]">
              {/* Left: race info */}
              <div>
                <p className="telemetry-kicker text-sm text-[var(--accent-cool)]">
                  Race deck · {detail.meeting.country_name}
                </p>
                <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">
                  {detail.meeting.meeting_name}
                </h1>
                <p className="mt-3 text-base text-white/50">
                  {detail.meeting.location} · {detail.meeting.circuit_short_name} ·{" "}
                  {formatMeetingWindow(detail.meeting.date_start, detail.meeting.date_end)}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="chip text-sm text-white/65">
                    <Trophy className="size-3.5 text-[var(--accent-gold)]" />
                    {detail.resultTable[0]?.driver?.name_acronym ?? "TBD"} won
                  </span>
                  <span className="chip text-sm text-white/65">
                    <TimerReset className="size-3.5 text-[var(--accent)]" />
                    {detail.pitStops.length} pit events
                  </span>
                  <span className="chip text-sm text-white/65">
                    <Flag className="size-3.5 text-[var(--accent-cool)]" />
                    {detail.overtakes.length} overtakes
                  </span>
                </div>
              </div>

              {/* Right: driver selector */}
              <div>
                <DriverSelector
                  drivers={detail.resultTable.map((entry) => ({
                    driverNumber: entry.driver_number,
                    label: entry.driver?.full_name ?? `Car ${entry.driver_number}`,
                    teamName: entry.driver?.team_name ?? "OpenF1",
                  }))}
                  meetingKey={detail.meeting.meeting_key}
                  selectedDriverNumber={detail.selectedDriverNumber}
                />
              </div>
            </div>

            {/* Session chips */}
            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {detail.sessions.map((session) => (
                <SessionStandings
                  key={session.session_key}
                  session={session}
                  isRace={session.session_key === detail.race.session_key}
                />
              ))}
            </div>
          </div>
        </header>

        {/* ── Driver Spotlight ──────────────────────────────────── */}
        <section className="panel relative overflow-hidden rounded-[30px] p-5 lg:p-6">
          <div
            className="absolute inset-x-0 top-0 h-1"
            style={{ background: `linear-gradient(90deg, ${driverAccent}, transparent)` }}
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-15"
            style={{ background: `radial-gradient(circle at top left, ${driverAccent}25, transparent 60%)` }}
          />

          <div className="relative">
            <div className="flex items-center gap-4">
              <DriverAvatar driver={detail.selectedDriver} size={68} />
              <div>
                <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">
                  Driver spotlight
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  {detail.selectedDriver?.full_name ?? `Car ${detail.selectedDriverNumber}`}
                </h2>
                <p className="mt-0.5 text-sm text-white/45">
                  {detail.selectedDriver?.team_name ?? "OpenF1"} ·{" "}
                  <span style={{ color: driverAccent }}>#{detail.selectedDriverNumber}</span>
                </p>
              </div>
            </div>

            {/* Key stats */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Finish",
                  value: selectedResult?.position != null ? `P${selectedResult.position}` : "—",
                  color: driverAccent,
                },
                {
                  label: "Grid Δ",
                  value: formatPositionChange(selectedResult?.positionsGained),
                  color:
                    (selectedResult?.positionsGained ?? 0) > 0
                      ? "#4ae38f"
                      : (selectedResult?.positionsGained ?? 0) < 0
                        ? "#ff6b6b"
                        : "rgba(255,255,255,0.8)",
                },
                {
                  label: "Best lap",
                  value: formatDuration(bestLap),
                  color: "var(--accent-cool)",
                },
                {
                  label: "Final gap",
                  value: Array.isArray(finalGap) ? "—" : formatGap(finalGap),
                  color: "rgba(255,255,255,0.8)",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[20px] border border-white/8 p-4"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <p className="telemetry-kicker text-[10px] text-white/35">{stat.label}</p>
                  <p className="display-font mt-3 text-4xl leading-none" style={{ color: stat.color }}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Tyre strategy + pit visits */}
            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_auto]">
              <div>
                <p className="telemetry-kicker text-[10px] text-white/35">Tyre strategy</p>
                <div className="mt-3">
                  <StrategyStrip stints={detail.selectedDriverStints} totalLaps={totalRaceLaps} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-1">
                <div className="rounded-[18px] border border-white/6 p-3" style={{ background: "rgba(255,255,255,0.025)" }}>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/32">Pit visits</p>
                  <p className="display-font mt-2 text-4xl text-white">{selectedPitStops.length}</p>
                </div>
                <div className="rounded-[18px] border border-white/6 p-3" style={{ background: "rgba(255,255,255,0.025)" }}>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/32">Laps</p>
                  <p className="display-font mt-2 text-4xl text-white">{totalRaceLaps}</p>
                </div>
              </div>
            </div>

            {/* Charts inside spotlight */}
            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <LineChart
                color={driverAccent}
                formatType="duration"
                points={lapPoints}
                subtitle="Timed flying laps — pit-out laps excluded."
                title="Lap pace trace"
              />
              <LineChart
                color="var(--accent-cool)"
                formatType="position"
                invert
                points={positionPoints}
                subtitle="Position samples across the race distance."
                title="Position trace"
              />
            </div>

            {/* Gap to leader */}
            <div className="mt-6">
              <GapTraceChart gaps={detail.selectedDriverGaps} color={driverAccent} />
            </div>

            {/* Telemetry + Track map */}
            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_auto]">
              <LapTelemetryPanel
                sessionKey={detail.race.session_key}
                driverNumber={detail.selectedDriverNumber ?? 0}
                lapDateStart={fastestLapStart}
                lapDateEnd={fastestLapEnd}
              />
              <TrackMap
                sessionKey={detail.race.session_key}
                driverNumber={detail.selectedDriverNumber ?? 0}
                lapDateStart={fastestLapStart}
                lapDateEnd={fastestLapEnd}
              />
            </div>
          </div>
        </section>

        {/* ── Sector splits + Speed traps ──────────────────────── */}
        <section className="grid gap-6 xl:grid-cols-2">
          <SectorTimeTable
            laps={detail.selectedDriverLaps}
            stints={detail.selectedDriverStints}
          />
          <SpeedTrapChart laps={detail.selectedDriverLaps} />
        </section>

        {/* ── Results + Pit log ─────────────────────────────────── */}
        <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="panel flex flex-col rounded-[30px] p-5 lg:p-6" style={{ maxHeight: 640 }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">Classification</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Race finish order</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm text-white/50">
                {detail.resultTable.length} classified
              </div>
            </div>
            <div className="mt-5 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {detail.resultTable.map((entry) => (
                <ResultRow entry={entry} key={entry.driver_number} />
              ))}
            </div>
          </div>

          <div className="panel flex flex-col rounded-[30px] p-5 lg:p-6" style={{ maxHeight: 640 }}>
            <div className="flex items-center gap-2">
              <TimerReset className="size-4 text-[var(--accent)]" />
              <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">Pit lane ledger</p>
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Stop timeline</h2>
            <div className="mt-5 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {detail.pitStops.length > 0 ? (
                detail.pitStops.map((stop) => {
                  const entry =
                    detail.resultTable.find((r) => r.driver_number === stop.driver_number) ?? null;
                  const stopAccent = getAccent(entry?.driver?.team_colour);
                  const duration = stop.stop_duration ?? stop.lane_duration;

                  return (
                    <div
                      key={`${stop.driver_number}-${stop.lap_number}-${stop.date}`}
                      className="flex items-center gap-3 rounded-[18px] border border-white/6 px-4 py-3"
                      style={{ background: "rgba(255,255,255,0.025)" }}
                    >
                      <DriverAvatar driver={entry?.driver ?? null} size={34} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">
                          {entry?.driver?.full_name ?? `Car ${stop.driver_number}`}
                        </p>
                        <p className="text-xs text-white/38">Lap {stop.lap_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="display-font text-xl" style={{ color: stopAccent }}>
                          {formatDuration(duration, 2)}
                        </p>
                        <p className="text-[10px] text-white/32">stationary</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[18px] border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/38">
                  Pit lane data is not available for this meeting yet.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Overtake timeline ──────────────────────────────────── */}
        <OvertakeTimeline overtakes={detail.enrichedOvertakes} totalLaps={totalRaceLaps} />

        {/* ── Team radio ───────────────────────────────────────── */}
        <TeamRadioPlayer clips={detail.selectedDriverRadio} driverMap={driverMapForRadio} />

        {/* ── Race control + Weather ─────────────────────────────── */}
        <section className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
          {/* Race control - scrollable */}
          <div className="panel rounded-[30px] p-5 lg:p-6">
            <div className="flex items-center gap-2">
              <Radio className="size-4 text-[var(--accent)]" />
              <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">Race control</p>
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Steward & flag timeline</h2>
            <div className="mt-5 max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {detail.raceControl.length > 0 ? (
                detail.raceControl.map((message) => (
                  <div
                    key={`${message.date}-${message.message}`}
                    className="rounded-[18px] border border-white/6 px-4 py-3"
                    style={{ background: "rgba(255,255,255,0.022)" }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-white/32">
                        {message.category}
                      </span>
                      <span className="text-xs text-white/38">
                        {message.lap_number
                          ? `Lap ${message.lap_number}`
                          : formatLongDate(message.date)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/70">{message.message}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-[18px] border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/38">
                  No race control messages available.
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6">
            {/* Weather */}
            <div className="panel rounded-[30px] p-5 lg:p-6">
              <div className="flex items-center gap-2">
                <CloudRainWind className="size-4 text-[var(--accent-cool)]" />
                <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">Conditions</p>
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-white">Weather profile</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <WeatherStat
                  label="Track temp"
                  value={formatTemperature(detail.weatherSummary.averageTrackTemperature)}
                  icon={<Thermometer className="size-3.5 text-[var(--accent)]" />}
                />
                <WeatherStat
                  label="Air temp"
                  value={formatTemperature(detail.weatherSummary.averageAirTemperature)}
                  icon={<Thermometer className="size-3.5 text-[var(--accent-cool)]" />}
                />
                <WeatherStat
                  label="Max wind"
                  value={formatWindSpeed(detail.weatherSummary.maxWindSpeed)}
                  icon={<Wind className="size-3.5 text-[var(--accent-cool)]" />}
                />
                <div
                  className="rounded-[20px] border border-white/6 p-4"
                  style={{ background: "rgba(122,245,255,0.04)" }}
                >
                  <div className="flex items-center gap-2 text-xs text-white/42">
                    <CloudRainWind className="size-3.5 text-[var(--accent-cool)]" />
                    <span className="uppercase tracking-[0.18em]">Rainfall</span>
                  </div>
                  <p className="display-font mt-3 text-4xl text-white">
                    {detail.weatherSummary.rainfallMoments}
                  </p>
                  <p className="mt-1 text-xs text-white/35">moments</p>
                </div>
                <div
                  className="rounded-[20px] border border-white/6 p-4 sm:col-span-2"
                  style={{ background: "rgba(122,245,255,0.04)" }}
                >
                  <div className="flex items-center gap-2 text-xs text-white/42">
                    <Wind className="size-3.5 text-[var(--accent-cool)]" />
                    <span className="uppercase tracking-[0.18em]">Wind direction</span>
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    <WindRose degrees={detail.weatherSummary.averageWindDirection} />
                    <div>
                      <p className="display-font text-3xl text-white">
                        {detail.weatherSummary.averageWindDirection != null
                          ? `${Math.round(detail.weatherSummary.averageWindDirection)}°`
                          : "—"}
                      </p>
                      <p className="mt-0.5 text-xs text-white/35">avg bearing</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
