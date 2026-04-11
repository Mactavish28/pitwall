import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Flag,
  Trophy,
  TrendingUp,
} from "lucide-react";

import { RaceNavigator } from "@/components/race-navigator";
import { SeasonMap } from "@/components/season-map";
import {
  formatDuration,
  formatGap,
  formatMeetingStatus,
  formatMeetingWindow,
  formatPoints,
  formatPositionChange,
  formatShortDate,
  formatTemperature,
} from "@/lib/format";
import {
  getSeasonSnapshot,
  type Driver,
  type DriverStandingView,
  type EnrichedResult,
  type MeetingCard,
  type TeamStandingView,
} from "@/lib/openf1";

/** Vercel / OpenF1: homepage runs many upstream fetches — avoid 10s hobby timeout. */
export const maxDuration = 60;

/** Avoid static prerender at build time (many live OpenF1 calls + rate limits). */
export const dynamic = "force-dynamic";

function getAccent(teamColour?: string | null) {
  return teamColour ? `#${teamColour}` : "var(--accent)";
}

function statusClasses(status: MeetingCard["status"]) {
  if (status === "live") return "badge-live";
  if (status === "completed") return "badge-done";
  if (status === "cancelled") return "badge-cancelled";
  return "badge-upcoming";
}

function DriverAvatar({
  driver,
  size = 48,
}: {
  driver: Driver | null;
  size?: number;
}) {
  const accent = getAccent(driver?.team_colour);

  if (driver?.headshot_url) {
    return (
      <Image
        alt={driver.full_name}
        className="rounded-full object-cover"
        height={size}
        src={driver.headshot_url}
        style={{
          border: `2px solid ${accent}55`,
          boxShadow: `0 0 16px ${accent}25`,
        }}
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

function MetricCard({
  label,
  value,
  detail,
  color = "var(--accent)",
}: {
  label: string;
  value: string;
  detail: string;
  color?: string;
}) {
  return (
    <div className="panel accent-bar-top relative overflow-hidden rounded-[24px] p-5">
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          background: `radial-gradient(circle at top left, ${color}22, transparent 70%)`,
        }}
      />
      <p className="telemetry-kicker relative text-[11px] text-white/40">{label}</p>
      <p
        className="display-font relative mt-4 text-5xl leading-none"
        style={{ color }}
      >
        {value}
      </p>
      <p className="relative mt-3 text-sm leading-6 text-white/48">{detail}</p>
    </div>
  );
}

function ResultRow({ entry }: { entry: EnrichedResult }) {
  const accent = getAccent(entry.driver?.team_colour);
  const positionGained = entry.positionsGained ?? 0;

  return (
    <div
      className="result-row result-row-home"
      style={{ "--team-color": `${accent}bb` } as React.CSSProperties}
    >
      <div
        className="display-font pl-1 text-3xl leading-none"
        style={{
          color: entry.position != null && entry.position <= 3 ? accent : "rgba(255,255,255,0.8)",
        }}
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
        <p className="text-[10px] uppercase tracking-[0.12em] text-white/30">Δ</p>
        <p
          className="mt-0.5 font-mono text-sm font-semibold"
          style={{
            color:
              positionGained > 0
                ? "#4ae38f"
                : positionGained < 0
                  ? "#ff6b6b"
                  : "rgba(255,255,255,0.45)",
          }}
        >
          {formatPositionChange(entry.positionsGained)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-[10px] uppercase tracking-[0.12em] text-white/30">Gap</p>
        <p className="mt-0.5 font-mono text-sm text-white/60">
          {Array.isArray(entry.gap_to_leader) ? "—" : formatGap(entry.gap_to_leader)}
        </p>
      </div>
    </div>
  );
}

function DriverStandingRow({ standing }: { standing: DriverStandingView }) {
  const accent = getAccent(standing.driver?.team_colour);
  const barWidth = Math.min(100, (standing.points_current / 500) * 100);

  return (
    <div
      className="rounded-[20px] border border-white/6 p-4 transition hover:border-white/10"
      style={{ background: "rgba(255,255,255,0.025)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <DriverAvatar driver={standing.driver} size={36} />
            <div
              className="display-font absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full text-[9px] text-black font-bold"
              style={{ background: accent }}
            >
              {standing.position_current}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {standing.driver?.full_name ?? `Car ${standing.driver_number}`}
            </p>
            <p className="text-xs text-white/40">{standing.driver?.team_name ?? "OpenF1"}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-base font-semibold text-white">
            {formatPoints(standing.points_current)}
          </p>
          <p
            className="text-xs font-medium"
            style={{
              color:
                standing.pointsDelta > 0
                  ? "#4ae38f"
                  : standing.pointsDelta < 0
                    ? "#ff6b6b"
                    : "rgba(255,255,255,0.35)",
            }}
          >
            {standing.pointsDelta > 0
              ? `+${standing.pointsDelta}`
              : standing.pointsDelta === 0
                ? "—"
                : standing.pointsDelta}
          </p>
        </div>
      </div>
      <div className="progress-track mt-3">
        <div
          className="progress-fill"
          style={{
            width: `${barWidth}%`,
            background: `linear-gradient(90deg, ${accent}, ${accent}70)`,
          }}
        />
      </div>
    </div>
  );
}

function TeamStandingRow({ standing }: { standing: TeamStandingView }) {
  const accent = getAccent(standing.team_colour);
  const barWidth = Math.min(100, (standing.points_current / 900) * 100);

  return (
    <div
      className="rounded-[20px] border border-white/6 p-4 transition hover:border-white/10"
      style={{ background: "rgba(255,255,255,0.025)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex size-8 items-center justify-center rounded-full text-[10px] font-bold text-black"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accent}aa)`,
              boxShadow: `0 0 12px ${accent}35`,
            }}
          >
            P{standing.position_current}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{standing.team_name}</p>
            <p className="text-xs text-white/40">Constructors</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-base font-semibold text-white">
            {formatPoints(standing.points_current)}
          </p>
          <p className="text-xs text-white/35">pts</p>
        </div>
      </div>
      <div className="progress-track mt-3">
        <div
          className="progress-fill"
          style={{
            width: `${barWidth}%`,
            background: `linear-gradient(90deg, ${accent}, rgba(255,255,255,0.6))`,
          }}
        />
      </div>
    </div>
  );
}

function RaceCalendarCard({ meeting }: { meeting: MeetingCard }) {
  const isCancelled = meeting.status === "cancelled";
  const isUpcoming = meeting.status === "upcoming";
  const dimmed = isCancelled || isUpcoming;

  return (
    <Link
      className={`panel group relative block overflow-hidden rounded-[22px] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/12 hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)] ${dimmed ? "opacity-55" : ""}`}
      href={`/races/${meeting.meeting.meeting_key}`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(circle at top right, rgba(255,90,54,0.06), transparent 65%)" }}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="telemetry-kicker text-[10px] text-white/38">
            {meeting.meeting.country_name}
          </p>
          <h3 className={`mt-1.5 truncate text-base font-semibold ${isCancelled ? "text-white/40 line-through" : isUpcoming ? "text-white/60" : "text-white"}`}>
            {meeting.meeting.meeting_name}
          </h3>
          <p className="mt-0.5 text-xs text-white/42">{meeting.meeting.circuit_short_name}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusClasses(meeting.status)}`}
        >
          {formatMeetingStatus(meeting.status)}
        </span>
      </div>

      {/* Winner for completed, last season podium for upcoming */}
      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-white/42">
          {formatMeetingWindow(meeting.meeting.date_start, meeting.meeting.date_end)}
        </span>
        {meeting.winner ? (
          <span className="flex items-center gap-1 text-white/50">
            <Trophy className="size-3 text-[var(--accent-gold)]" />
            {meeting.winner}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[var(--accent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            Explore <ArrowRight className="size-3" />
          </span>
        )}
      </div>

      {isUpcoming && meeting.lastSeasonTop3 && meeting.lastSeasonTop3.length > 0 && (
        <div className="mt-3 border-t border-white/6 pt-3">
          <p className="mb-1.5 text-[9px] uppercase tracking-[0.15em] text-white/25">
            Last season podium
          </p>
          <div className="space-y-1">
            {meeting.lastSeasonTop3.map((name, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-4 text-right font-mono text-[10px] text-white/30">P{i + 1}</span>
                <span className="truncate text-[11px] text-white/45">{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Link>
  );
}

export default async function Home() {
  const snapshot = await getSeasonSnapshot();
  const completedRaces = snapshot.meetings.filter(
    (meeting) => meeting.status === "completed",
  ).length;
  const featuredWinner = snapshot.podium[0];
  const seasonLeader = snapshot.driverStandings[0] ?? null;
  const constructorsLeader = snapshot.teamStandings[0] ?? null;
  const raceOptions = snapshot.meetings.map((meeting) => ({
    meetingKey: meeting.meeting.meeting_key,
    label: meeting.meeting.meeting_name,
    detail: `${formatShortDate(meeting.race.date_start)} · ${formatMeetingStatus(meeting.status)}`,
    status: meeting.status,
  }));

  return (
    <div className="flex-1">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 lg:px-8 lg:py-8">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <header className="panel-strong relative overflow-hidden rounded-[34px] p-6 lg:p-10">
          {snapshot.featuredMeeting.circuit_image ? (
            <Image
              alt={snapshot.featuredMeeting.circuit_short_name}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.14] mix-blend-screen"
              fill
              priority
              sizes="(min-width: 1280px) 1280px, 100vw"
              src={snapshot.featuredMeeting.circuit_image}
            />
          ) : null}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_top_right,rgba(255,90,54,0.22),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_bottom_left,rgba(122,245,255,0.07),transparent)]" />
          <div className="speed-stripe pointer-events-none absolute right-0 top-0 h-full w-28 opacity-50" />

          <div className="relative grid gap-10 xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="telemetry-kicker text-sm text-[var(--accent-cool)]">
                Pitwall · Season {snapshot.seasonYear}
              </p>
              <h1 className="display-font mt-5 text-6xl leading-[0.92] text-white sm:text-7xl lg:text-[88px]">
                POST-RACE
                <br />
                <span style={{ color: "var(--accent)" }}>INTELLIGENCE</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/55 sm:text-lg">
                A Formula 1 command deck powered by OpenF1. Track the
                championship pulse, revisit the latest race, and dive into
                strategy, tyre life, pit activity, and control messages.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-black transition hover:brightness-110 active:scale-95"
                  href={`/races/${snapshot.featuredMeeting.meeting_key}`}
                  style={{
                    background: "linear-gradient(135deg, var(--accent), #ff3d1a)",
                    boxShadow: "0 0 28px rgba(255,90,54,0.4)",
                  }}
                >
                  Open Latest Race
                  <ArrowRight className="size-4" />
                </Link>
                <a
                  className="inline-flex items-center gap-2 rounded-full border border-white/14 px-6 py-3 text-white/80 transition hover:border-white/22 hover:bg-white/5 hover:text-white"
                  href="#calendar"
                >
                  Browse Calendar
                </a>
              </div>

              {/* Quick stats row */}
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "Latest winner",
                    value: featuredWinner?.driver?.full_name ?? "Pending",
                    sub: snapshot.featuredMeeting.meeting_name,
                    bg: "rgba(255,90,54,0.08)",
                    border: "rgba(255,90,54,0.15)",
                  },
                  {
                    label: "Next race",
                    value:
                      snapshot.nextMeeting?.meeting.meeting_name ?? "TBC",
                    sub: snapshot.nextMeeting
                      ? formatMeetingWindow(
                          snapshot.nextMeeting.meeting.date_start,
                          snapshot.nextMeeting.meeting.date_end,
                        )
                      : "No upcoming round (cancelled weekends skipped)",
                    bg: "rgba(122,245,255,0.05)",
                    border: "rgba(122,245,255,0.12)",
                  },
                  {
                    label: "Constructors lead",
                    value: constructorsLeader?.team_name ?? "Loading",
                    sub: constructorsLeader
                      ? formatPoints(constructorsLeader.points_current)
                      : "Awaiting standings",
                    bg: "rgba(255,207,90,0.05)",
                    border: "rgba(255,207,90,0.12)",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[20px] p-4"
                    style={{
                      background: stat.bg,
                      border: `1px solid ${stat.border}`,
                    }}
                  >
                    <p className="telemetry-kicker text-[10px] text-white/38">{stat.label}</p>
                    <p className="mt-3 text-base font-semibold text-white">{stat.value}</p>
                    <p className="mt-1 text-xs text-white/42">{stat.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured race card */}
            <div className="flex flex-col gap-4">
              <div className="panel relative overflow-hidden rounded-[26px] p-5">
                {snapshot.featuredMeeting.country_flag ? (
                  <Image
                    alt={snapshot.featuredMeeting.country_name}
                    className="absolute right-5 top-5 h-9 w-auto rounded-full border border-white/12 object-cover"
                    height={36}
                    src={snapshot.featuredMeeting.country_flag}
                    width={36}
                  />
                ) : null}
                <div className="max-w-[80%]">
                  <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">
                    Featured race deck
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">
                    {snapshot.featuredMeeting.meeting_name}
                  </h2>
                  <p className="mt-1.5 text-sm text-white/48">
                    {snapshot.featuredMeeting.location} ·{" "}
                    {snapshot.featuredMeeting.circuit_short_name}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="chip text-sm text-white/65">
                    <CalendarDays className="size-3.5 text-[var(--accent)]" />
                    {formatMeetingWindow(
                      snapshot.featuredMeeting.date_start,
                      snapshot.featuredMeeting.date_end,
                    )}
                  </span>
                  <span className="chip text-sm text-white/65">
                    <Trophy className="size-3.5 text-[var(--accent-gold)]" />
                    {featuredWinner?.driver?.name_acronym ?? "TBD"} won
                  </span>
                  <span className="chip text-sm text-white/65">
                    <Flag className="size-3.5 text-[var(--accent-cool)]" />
                    {snapshot.totalOvertakes} overtakes
                  </span>
                </div>

                <div className="mt-5 space-y-2">
                  {snapshot.podium.map((entry, index) => {
                    const accent = getAccent(entry.driver?.team_colour);
                    const medals = ["🥇", "🥈", "🥉"];
                    return (
                      <div
                        key={entry.driver_number}
                        className="flex items-center justify-between rounded-[18px] border px-4 py-3"
                        style={{
                          borderColor:
                            index === 0 ? `${accent}35` : "rgba(255,255,255,0.06)",
                          background:
                            index === 0
                              ? `linear-gradient(135deg, ${accent}14, rgba(0,0,0,0.18))`
                              : "rgba(0,0,0,0.18)",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg leading-none">{medals[index]}</span>
                          <DriverAvatar driver={entry.driver} size={36} />
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {entry.driver?.full_name ?? `Car ${entry.driver_number}`}
                            </p>
                            <p className="text-xs text-white/42">
                              {entry.driver?.team_name ?? "OpenF1"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="display-font text-2xl text-white">
                            {entry.position != null ? `P${entry.position}` : "DNF"}
                          </p>
                          <p className="text-[10px] text-white/32">
                            {entry.gridPosition ? `from P${entry.gridPosition}` : "—"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <RaceNavigator
                currentMeetingKey={snapshot.featuredMeeting.meeting_key}
                races={raceOptions}
              />
            </div>
          </div>
        </header>

        {/* ── Metric strip ─────────────────────────────────────── */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Weekends complete"
            value={`${completedRaces}/${snapshot.meetings.length}`}
            detail="Races locked into the season archive."
            color="var(--accent)"
          />
          <MetricCard
            label="Fastest pit stop"
            value={formatDuration(
              snapshot.fastestPitStop.stop?.stop_duration ??
                snapshot.fastestPitStop.stop?.lane_duration,
              2,
            )}
            detail={
              snapshot.fastestPitStop.stop && snapshot.fastestPitStop.driver
                ? `${snapshot.fastestPitStop.driver.team_name} · ${snapshot.fastestPitStop.driver.full_name} · lap ${snapshot.fastestPitStop.stop.lap_number} · ${snapshot.featuredMeeting.meeting_name}`
                : snapshot.fastestPitStop.stop
                  ? `Lap ${snapshot.fastestPitStop.stop.lap_number} · ${snapshot.featuredMeeting.meeting_name}`
                  : "No timed pit stops in the featured race."
            }
            color="var(--accent-cool)"
          />
          <MetricCard
            label="Track temperature"
            value={formatTemperature(snapshot.weatherSummary.averageTrackTemperature)}
            detail="Average surface heat over the featured race weekend."
            color="var(--accent-gold)"
          />
          <MetricCard
            label="Season leader"
            value={seasonLeader?.driver?.name_acronym ?? "TBD"}
            detail={
              seasonLeader
                ? `${formatPoints(seasonLeader.points_current)} after the latest race.`
                : "Standings update after each classified race."
            }
            color="var(--accent)"
          />
        </section>

        {/* ── Results + Standings ───────────────────────────────── */}
        <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="panel rounded-[30px] p-5 lg:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">
                  Latest race order
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Grid-to-flag snapshot
                </h2>
              </div>
              <Link
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm text-white/55 transition hover:border-white/18 hover:text-white"
                href={`/races/${snapshot.featuredMeeting.meeting_key}`}
              >
                Full deck <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <div className="mt-5 space-y-2">
              {snapshot.resultTable.map((entry) => (
                <ResultRow entry={entry} key={entry.driver_number} />
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="panel rounded-[30px] p-5 lg:p-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-[var(--accent-cool)]" />
                <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">
                  Drivers championship
                </p>
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-white">Points pressure</h2>
              <div className="mt-5 space-y-3">
                {snapshot.driverStandings.length > 0 ? (
                  snapshot.driverStandings.slice(0, 5).map((standing) => (
                    <DriverStandingRow key={standing.driver_number} standing={standing} />
                  ))
                ) : (
                  <div className="rounded-[18px] border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/38">
                    Championship data updates after each classified race.
                  </div>
                )}
              </div>
            </div>

            <div className="panel rounded-[30px] p-5 lg:p-6">
              <div className="flex items-center gap-2">
                <Trophy className="size-4 text-[var(--accent-cool)]" />
                <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">
                  Constructors championship
                </p>
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-white">Team momentum</h2>
              <div className="mt-5 space-y-3">
                {snapshot.teamStandings.length > 0 ? (
                  snapshot.teamStandings.slice(0, 5).map((standing) => (
                    <TeamStandingRow key={standing.team_name} standing={standing} />
                  ))
                ) : (
                  <div className="rounded-[18px] border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/38">
                    Constructors standings appear once the endpoint is live.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Season Map ────────────────────────────────────────── */}
        <SeasonMap meetings={snapshot.meetings} />

        {/* ── Calendar grid ──────────────────────────────────────── */}
        <section className="panel rounded-[30px] p-5 lg:p-6" id="calendar">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">
                Full calendar
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Race-by-race archive
              </h2>
            </div>
            <div className="rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm text-white/50">
              {snapshot.meetings.length} rounds
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {snapshot.meetings.map((meeting) => (
              <RaceCalendarCard key={meeting.meeting.meeting_key} meeting={meeting} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
