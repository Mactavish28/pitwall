import "server-only";

const OPENF1_BASE_URL = "https://api.openf1.org/v1";
const OPENF1_DEFAULT_REVALIDATE = 60 * 60;
const MIN_F1_YEAR = 2023;

type Primitive = string | number | boolean;
type QueryValue = Primitive | Primitive[] | null | undefined;
type QueryParams = Record<string, QueryValue>;

type CacheOptions = {
  revalidate?: number;
  tags?: string[];
  allowFailure?: boolean;
};

export interface Meeting {
  circuit_key: number;
  circuit_image: string | null;
  circuit_info_url: string | null;
  circuit_short_name: string;
  circuit_type: string | null;
  country_code: string;
  country_flag: string | null;
  country_key: number;
  country_name: string;
  date_end: string;
  date_start: string;
  gmt_offset: string;
  location: string;
  meeting_key: number;
  meeting_name: string;
  meeting_official_name: string;
  year: number;
}

export interface Session {
  session_key: number;
  session_type: string;
  session_name: string;
  date_start: string;
  date_end: string;
  meeting_key: number;
  circuit_key: number;
  circuit_short_name: string;
  country_key: number;
  country_code: string;
  country_name: string;
  location: string;
  gmt_offset: string;
  year: number;
}

export interface Driver {
  broadcast_name: string;
  driver_number: number;
  first_name: string;
  full_name: string;
  headshot_url: string | null;
  last_name: string;
  meeting_key: number;
  name_acronym: string;
  session_key: number;
  team_colour: string | null;
  team_name: string;
}

export interface SessionResult {
  dnf: boolean;
  dns: boolean;
  dsq: boolean;
  driver_number: number;
  duration: number | number[] | null;
  gap_to_leader: number | string | (number | string | null)[] | null;
  number_of_laps: number;
  meeting_key: number;
  position: number | null;
  session_key: number;
}

export interface StartingGridEntry {
  position: number;
  driver_number: number;
  lap_duration: number | null;
  meeting_key: number;
  session_key: number;
}

export interface Stint {
  compound: string;
  driver_number: number;
  lap_end: number;
  lap_start: number;
  meeting_key: number;
  session_key: number;
  stint_number: number;
  tyre_age_at_start: number;
}

export interface PitStop {
  date: string;
  driver_number: number;
  lane_duration: number;
  lap_number: number;
  meeting_key: number;
  pit_duration?: number | null;
  session_key: number;
  stop_duration?: number | null;
}

export interface Overtake {
  date: string;
  meeting_key: number;
  overtaken_driver_number: number;
  overtaking_driver_number: number;
  position: number;
  session_key: number;
}

export interface RaceControlMessage {
  category: string;
  date: string;
  driver_number?: number | null;
  flag?: string | null;
  lap_number?: number | null;
  meeting_key: number;
  message: string;
  qualifying_phase?: number | null;
  scope: string;
  sector?: number | null;
  session_key: number;
}

export interface WeatherSample {
  air_temperature: number;
  date: string;
  humidity: number;
  meeting_key: number;
  pressure: number;
  rainfall: number;
  session_key: number;
  track_temperature: number;
  wind_direction: number;
  wind_speed: number;
}

export interface ChampionshipDriver {
  driver_number: number;
  meeting_key: number;
  points_current: number;
  points_start: number;
  position_current: number;
  position_start: number;
  session_key: number;
}

export interface ChampionshipTeam {
  meeting_key: number;
  points_current: number;
  points_start: number;
  position_current: number;
  position_start: number;
  session_key: number;
  team_name: string;
}

export interface TeamRadioClip {
  date: string;
  driver_number: number;
  meeting_key: number;
  recording_url: string;
  session_key: number;
}

export interface Lap {
  date_start: string;
  driver_number: number;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  i1_speed: number | null;
  i2_speed: number | null;
  is_pit_out_lap: boolean;
  lap_duration: number | null;
  lap_number: number;
  meeting_key: number;
  session_key: number;
  st_speed: number | null;
}

export interface PositionSample {
  date: string;
  driver_number: number;
  meeting_key: number;
  position: number;
  session_key: number;
}

export interface IntervalSample {
  date: string;
  driver_number: number;
  gap_to_leader: number | string | null;
  interval: number | string | null;
  meeting_key: number;
  session_key: number;
}

export type MeetingStatus = "completed" | "upcoming" | "live" | "cancelled";

export interface MeetingCard {
  meeting: Meeting;
  race: Session;
  status: MeetingStatus;
  winner: string | null;
  lastSeasonTop3: string[] | null;
}

export interface EnrichedResult extends SessionResult {
  driver: Driver | null;
  gridPosition: number | null;
  positionsGained: number | null;
}

export interface StrategyHighlight extends Stint {
  driver: Driver | null;
  stintLength: number;
}

export interface WeatherSummary {
  averageTrackTemperature: number | null;
  averageAirTemperature: number | null;
  maxWindSpeed: number | null;
  rainfallMoments: number;
  averageWindDirection: number | null;
}

export interface EnrichedOvertake extends Overtake {
  overtakingDriverName: string;
  overtakenDriverName: string;
  overtakingTeamColour: string | null;
  overtakenTeamColour: string | null;
  lap_number: number | null;
}

export interface CarDataSample {
  date: string;
  driver_number: number;
  speed: number;
  throttle: number;
  brake: number;
  n_gear: number;
  rpm: number;
  drs: number;
}

export interface LocationSample {
  date: string;
  driver_number: number;
  meeting_key: number;
  session_key: number;
  x: number;
  y: number;
  z: number;
}

export interface DriverStandingView extends ChampionshipDriver {
  driver: Driver | null;
  pointsDelta: number;
}

export interface TeamStandingView extends ChampionshipTeam {
  team_colour: string | null;
  pointsDelta: number;
}

export interface FastestPitStopInfo {
  stop: PitStop | null;
  driver: Driver | null;
}

export interface SeasonSnapshot {
  seasonYear: number;
  meetings: MeetingCard[];
  featuredMeeting: Meeting;
  featuredRace: Session;
  nextMeeting: MeetingCard | null;
  resultTable: EnrichedResult[];
  podium: EnrichedResult[];
  movers: EnrichedResult[];
  pitHighlights: PitStop[];
  strategyHighlights: StrategyHighlight[];
  weatherSummary: WeatherSummary;
  raceControlHighlights: RaceControlMessage[];
  driverStandings: DriverStandingView[];
  teamStandings: TeamStandingView[];
  selectedDrivers: Driver[];
  totalOvertakes: number;
  fastestPitStop: FastestPitStopInfo;
}

export interface RaceDetailSnapshot {
  meeting: Meeting;
  sessions: Session[];
  race: Session;
  drivers: Driver[];
  resultTable: EnrichedResult[];
  selectedDriver: Driver | null;
  selectedDriverNumber: number | null;
  selectedDriverLaps: Lap[];
  selectedDriverPositions: PositionSample[];
  selectedDriverGaps: IntervalSample[];
  selectedDriverStints: Stint[];
  selectedDriverRadio: TeamRadioClip[];
  pitStops: PitStop[];
  overtakes: Overtake[];
  enrichedOvertakes: EnrichedOvertake[];
  raceControl: RaceControlMessage[];
  weatherSummary: WeatherSummary;
  startingGrid: StartingGridEntry[];
}

function uniqueTags(tags?: string[]) {
  return Array.from(new Set(["openf1", ...(tags ?? [])]));
}

/** Limits parallel OpenF1 calls so serverless hosts (many reqs from one IP) avoid 429 storms. */
async function runPool<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function spawn() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await worker(items[index]!, index);
    }
  }

  const poolSize = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: poolSize }, () => spawn()));
  return results;
}

function buildUrl(endpoint: string, params: QueryParams = {}) {
  const url = new URL(`${OPENF1_BASE_URL}/${endpoint}`);

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        url.searchParams.append(key, String(entry));
      }

      continue;
    }

    url.searchParams.append(key, String(value));
  }

  return url;
}

const OPENF1_USER_AGENT =
  "Pitwall/1.0 (+https://github.com/Mactavish28/pitwall; contact: openf1 client)";

async function fetchOpenF1<T>(
  endpoint: string,
  params: QueryParams = {},
  options: CacheOptions = {},
  attempt = 0,
) {
  const response = await fetch(buildUrl(endpoint, params), {
    headers: {
      Accept: "application/json",
      "User-Agent": OPENF1_USER_AGENT,
    },
    next: {
      revalidate: options.revalidate ?? OPENF1_DEFAULT_REVALIDATE,
      tags: uniqueTags(options.tags),
    },
  });

  if (response.status === 404) {
    return [] as T[];
  }

  const max429Attempts = 4;
  if (response.status === 429 && attempt < max429Attempts) {
    const retryAfterHeader = Number(response.headers.get("retry-after"));
    const retryDelayMs =
      Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
        ? retryAfterHeader * 1000
        : 1500 + attempt * 800;

    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));

    return fetchOpenF1(endpoint, params, options, attempt + 1);
  }

  if (!response.ok) {
    if (options.allowFailure) {
      return [] as T[];
    }

    throw new Error(
      `OpenF1 request failed for ${endpoint}: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as T[];
}

function sortByDateStart<T extends { date_start: string }>(items: T[]) {
  return [...items].sort(
    (left, right) =>
      new Date(left.date_start).getTime() - new Date(right.date_start).getTime(),
  );
}

function sortByDate<T extends { date: string }>(items: T[]) {
  return [...items].sort(
    (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime(),
  );
}

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function createFallbackMeeting(session: Session): Meeting {
  return {
    circuit_key: session.circuit_key,
    circuit_image: null,
    circuit_info_url: null,
    circuit_short_name: session.circuit_short_name,
    circuit_type: null,
    country_code: session.country_code,
    country_flag: null,
    country_key: session.country_key,
    country_name: session.country_name,
    date_end: session.date_end,
    date_start: session.date_start,
    gmt_offset: session.gmt_offset,
    location: session.location,
    meeting_key: session.meeting_key,
    meeting_name: `${session.country_name} Grand Prix`,
    meeting_official_name: `${session.country_name} Grand Prix ${session.year}`,
    year: session.year,
  };
}

function getSessionStatus(session: Session): MeetingStatus {
  const now = Date.now();
  const start = new Date(session.date_start).getTime();
  const end = new Date(session.date_end).getTime();

  if (now < start) {
    return "upcoming";
  }

  if (now > end) {
    return "completed";
  }

  return "live";
}

function buildDriverMap(drivers: Driver[]) {
  return new Map(drivers.map((driver) => [driver.driver_number, driver]));
}

function enrichResults(
  results: SessionResult[],
  grid: StartingGridEntry[],
  driverMap: Map<number, Driver>,
) {
  const gridMap = new Map(grid.map((entry) => [entry.driver_number, entry.position]));

  return [...results]
    .sort((left, right) => {
      const lp = left.position ?? Infinity;
      const rp = right.position ?? Infinity;
      return lp - rp;
    })
    .map<EnrichedResult>((result) => {
      const gridPosition = gridMap.get(result.driver_number) ?? null;

      return {
        ...result,
        driver: driverMap.get(result.driver_number) ?? null,
        gridPosition,
        positionsGained:
          gridPosition === null || result.position === null
            ? null
            : gridPosition - result.position,
      };
    });
}

function circularMeanDegrees(values: number[]): number | null {
  if (values.length === 0) return null;
  let sinSum = 0;
  let cosSum = 0;
  for (const deg of values) {
    const rad = (deg * Math.PI) / 180;
    sinSum += Math.sin(rad);
    cosSum += Math.cos(rad);
  }
  const meanRad = Math.atan2(sinSum / values.length, cosSum / values.length);
  return ((meanRad * 180) / Math.PI + 360) % 360;
}

function buildWeatherSummary(samples: WeatherSample[]): WeatherSummary {
  const windDirs = samples
    .map((s) => s.wind_direction)
    .filter((v) => Number.isFinite(v));

  return {
    averageTrackTemperature: average(
      samples
        .map((sample) => sample.track_temperature)
        .filter((value) => Number.isFinite(value)),
    ),
    averageAirTemperature: average(
      samples
        .map((sample) => sample.air_temperature)
        .filter((value) => Number.isFinite(value)),
    ),
    maxWindSpeed:
      samples.length > 0
        ? Math.max(...samples.map((sample) => sample.wind_speed))
        : null,
    rainfallMoments: samples.filter((sample) => sample.rainfall > 0).length,
    averageWindDirection: circularMeanDegrees(windDirs),
  };
}

function buildStrategyHighlights(
  stints: Stint[],
  driverMap: Map<number, Driver>,
) {
  return [...stints]
    .map<StrategyHighlight>((stint) => ({
      ...stint,
      driver: driverMap.get(stint.driver_number) ?? null,
      stintLength: Math.max(0, stint.lap_end - stint.lap_start + 1),
    }))
    .sort((left, right) => right.stintLength - left.stintLength);
}

function buildDriverStandings(
  standings: ChampionshipDriver[],
  driverMap: Map<number, Driver>,
) {
  return [...standings]
    .sort((left, right) => left.position_current - right.position_current)
    .map<DriverStandingView>((entry) => ({
      ...entry,
      driver: driverMap.get(entry.driver_number) ?? null,
      pointsDelta: entry.points_current - entry.points_start,
    }));
}

function buildTeamStandings(
  standings: ChampionshipTeam[],
  driverMap: Map<number, Driver>,
) {
  const teamColours = new Map<string, string | null>();

  for (const driver of driverMap.values()) {
    if (!teamColours.has(driver.team_name)) {
      teamColours.set(driver.team_name, driver.team_colour);
    }
  }

  return [...standings]
    .sort((left, right) => left.position_current - right.position_current)
    .map<TeamStandingView>((entry) => ({
      ...entry,
      team_colour: teamColours.get(entry.team_name) ?? null,
      pointsDelta: entry.points_current - entry.points_start,
    }));
}

function getFastestPitStop(pitStops: PitStop[]) {
  return [...pitStops]
    .filter((stop) =>
      Number.isFinite(stop.stop_duration ?? stop.lane_duration),
    )
    .sort(
      (left, right) =>
        (left.stop_duration ?? left.lane_duration) -
        (right.stop_duration ?? right.lane_duration),
    )[0] ?? null;
}

async function resolveSeasonData(preferredYear = new Date().getUTCFullYear()) {
  const candidateYears = Array.from(
    new Set([preferredYear, preferredYear - 1, 2026, 2025, 2024, 2023]),
  ).filter((year) => year >= MIN_F1_YEAR);

  const sessionsPerYear = await Promise.all(
    candidateYears.map((year) =>
      fetchOpenF1<Session>(
        "sessions",
        { year, session_name: "Race" },
        { revalidate: 60 * 60 * 6, tags: [`season-${year}`] },
      ).then((rows) => ({ year, races: sortByDateStart(rows) })),
    ),
  );

  for (const { year, races } of sessionsPerYear) {
    if (races.length === 0) {
      continue;
    }

    const meetings = sortByDateStart(
      await fetchOpenF1<Meeting>(
        "meetings",
        { year },
        { revalidate: 60 * 60 * 6, tags: [`season-${year}`] },
      ),
    );

    return { year, races, meetings };
  }

  throw new Error("OpenF1 returned no race sessions for the supported seasons.");
}

function getFeaturedMeetingCard(meetings: MeetingCard[]) {
  const completed = meetings.filter((meeting) => meeting.status === "completed");

  if (completed.length > 0) {
    return completed.at(-1) ?? meetings[0];
  }

  const live = meetings.find((meeting) => meeting.status === "live");

  if (live) {
    return live;
  }

  return meetings[0];
}

const CANCELLED_MEETING_KEYS = new Set([1282, 1283]);

export async function getSeasonSnapshot(
  preferredYear = new Date().getUTCFullYear(),
): Promise<SeasonSnapshot> {
  const { year, races, meetings } = await resolveSeasonData(preferredYear);
  const meetingMap = new Map(meetings.map((meeting) => [meeting.meeting_key, meeting]));

  const completedRaces = races.filter(
    (r) => !CANCELLED_MEETING_KEYS.has(r.meeting_key) && getSessionStatus(r) === "completed",
  );
  const winnerResults = await runPool(completedRaces, 5, async (race) => {
    const results = await fetchOpenF1<SessionResult>(
      "session_result",
      { session_key: race.session_key, position: 1 },
      { tags: [`season-${year}`], allowFailure: true },
    );
    const winner = results[0];
    if (!winner) return { meetingKey: race.meeting_key, name: null };
    const drivers = await fetchOpenF1<Driver>(
      "drivers",
      { session_key: race.session_key, driver_number: winner.driver_number },
      { tags: [`season-${year}`], allowFailure: true },
    );
    return {
      meetingKey: race.meeting_key,
      name: drivers[0]?.full_name ?? null,
    };
  });
  const winnerMap = new Map(winnerResults.map((w) => [w.meetingKey, w.name]));

  const upcomingCircuitKeys = races
    .filter((r) => !CANCELLED_MEETING_KEYS.has(r.meeting_key) && getSessionStatus(r) === "upcoming")
    .map((r) => ({
      circuitKey: (meetingMap.get(r.meeting_key) ?? createFallbackMeeting(r)).circuit_key,
      meetingKey: r.meeting_key,
    }));

  let lastSeasonTop3Map = new Map<number, string[]>();
  if (upcomingCircuitKeys.length > 0 && year >= 2024) {
    const prevYear = year - 1;
    const [prevRaces, prevMeetings] = await Promise.all([
      fetchOpenF1<Session>(
        "sessions",
        { year: prevYear, session_name: "Race" },
        { tags: [`season-${prevYear}`], allowFailure: true },
      ),
      fetchOpenF1<Meeting>(
        "meetings",
        { year: prevYear },
        { tags: [`season-${prevYear}`], allowFailure: true },
      ),
    ]);

    const prevMeetingMap = new Map(prevMeetings.map((m) => [m.meeting_key, m]));
    const prevCircuitToSession = new Map<number, Session>();
    for (const r of prevRaces) {
      const m = prevMeetingMap.get(r.meeting_key);
      if (m) prevCircuitToSession.set(m.circuit_key, r);
    }

    const firstPrevRace = prevRaces[0];
    let prevDriverMap = new Map<number, Driver>();
    if (firstPrevRace) {
      const prevDrivers = await fetchOpenF1<Driver>(
        "drivers",
        { session_key: firstPrevRace.session_key },
        { tags: [`season-${prevYear}`], allowFailure: true },
      );
      prevDriverMap = new Map(prevDrivers.map((d) => [d.driver_number, d]));
    }

    const matchedUpcoming = upcomingCircuitKeys.filter((u) =>
      prevCircuitToSession.has(u.circuitKey),
    );

    const resultsBatch = await runPool(matchedUpcoming, 5, async (u) => {
      const prevRace = prevCircuitToSession.get(u.circuitKey)!;
      const results = await fetchOpenF1<SessionResult>(
        "session_result",
        { session_key: prevRace.session_key },
        { tags: [`season-${prevYear}`], allowFailure: true },
      );
      return { meetingKey: u.meetingKey, results };
    });

    for (const { meetingKey, results } of resultsBatch) {
      const top3 = results
        .filter((r) => r.position != null && r.position <= 3)
        .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
        .slice(0, 3)
        .map((r) => prevDriverMap.get(r.driver_number)?.full_name ?? null)
        .filter((name): name is string => name !== null);
      if (top3.length > 0) {
        lastSeasonTop3Map.set(meetingKey, top3);
      }
    }
  }

  const meetingCards = races.map<MeetingCard>((race) => ({
    meeting: meetingMap.get(race.meeting_key) ?? createFallbackMeeting(race),
    race,
    status: CANCELLED_MEETING_KEYS.has(race.meeting_key)
      ? "cancelled"
      : getSessionStatus(race),
    winner: winnerMap.get(race.meeting_key) ?? null,
    lastSeasonTop3: lastSeasonTop3Map.get(race.meeting_key) ?? null,
  }));

  const featured = getFeaturedMeetingCard(meetingCards);

  if (!featured) {
    throw new Error("Unable to determine a featured Grand Prix.");
  }

  const tags = [`season-${year}`, `meeting-${featured.meeting.meeting_key}`];

  const [
    drivers,
    resultTableRaw,
    startingGrid,
    stints,
    pitStops,
    overtakes,
    raceControl,
    weather,
    driverStandingsRaw,
    teamStandingsRaw,
  ] = await Promise.all([
    fetchOpenF1<Driver>(
      "drivers",
      { session_key: featured.race.session_key },
      { tags, allowFailure: true },
    ),
    fetchOpenF1<SessionResult>(
      "session_result",
      { session_key: featured.race.session_key },
      { tags, allowFailure: true },
    ),
    fetchOpenF1<StartingGridEntry>(
      "starting_grid",
      { meeting_key: featured.meeting.meeting_key },
      { tags, allowFailure: true },
    ),
    fetchOpenF1<Stint>(
      "stints",
      { session_key: featured.race.session_key },
      { tags, allowFailure: true },
    ),
    fetchOpenF1<PitStop>(
      "pit",
      { session_key: featured.race.session_key },
      { tags, allowFailure: true },
    ),
    fetchOpenF1<Overtake>(
      "overtakes",
      { session_key: featured.race.session_key },
      { tags, allowFailure: true },
    ),
    fetchOpenF1<RaceControlMessage>(
      "race_control",
      { session_key: featured.race.session_key },
      { tags, allowFailure: true },
    ),
    fetchOpenF1<WeatherSample>(
      "weather",
      { session_key: featured.race.session_key },
      { tags, allowFailure: true },
    ),
    fetchOpenF1<ChampionshipDriver>(
      "championship_drivers",
      { session_key: featured.race.session_key },
      { tags, allowFailure: true },
    ),
    fetchOpenF1<ChampionshipTeam>(
      "championship_teams",
      { session_key: featured.race.session_key },
      { tags, allowFailure: true },
    ),
  ]);

  const driverMap = buildDriverMap(drivers);
  const resultTable = enrichResults(resultTableRaw, startingGrid, driverMap);
  const pitHighlights = [...pitStops]
    .sort((left, right) => left.lap_number - right.lap_number)
    .slice(0, 6);
  const podium = resultTable.slice(0, 3);
  const movers = [...resultTable]
    .filter((entry) => entry.positionsGained !== null)
    .sort(
      (left, right) =>
        (right.positionsGained ?? Number.NEGATIVE_INFINITY) -
        (left.positionsGained ?? Number.NEGATIVE_INFINITY),
    )
    .slice(0, 5);
  const selectedDrivers =
    podium
      .map((entry) => entry.driver)
      .filter((driver): driver is Driver => Boolean(driver)) ??
    drivers.slice(0, 3);
  const nextMeeting =
    meetingCards.find(
      (meeting) =>
        meeting.status !== "cancelled" &&
        new Date(meeting.race.date_start).getTime() > Date.now(),
    ) ?? null;

  const fastestStop = getFastestPitStop(pitStops);

  return {
    seasonYear: year,
    meetings: meetingCards,
    featuredMeeting: featured.meeting,
    featuredRace: featured.race,
    nextMeeting,
    resultTable,
    podium,
    movers,
    pitHighlights,
    strategyHighlights: buildStrategyHighlights(stints, driverMap).slice(0, 6),
    weatherSummary: buildWeatherSummary(weather),
    raceControlHighlights: sortByDate(raceControl).reverse().slice(0, 6),
    driverStandings: buildDriverStandings(driverStandingsRaw, driverMap),
    teamStandings: buildTeamStandings(teamStandingsRaw, driverMap),
    selectedDrivers,
    totalOvertakes: overtakes.length,
    fastestPitStop: {
      stop: fastestStop,
      driver: fastestStop ? driverMap.get(fastestStop.driver_number) ?? null : null,
    },
  };
}

export async function getRaceDetailSnapshot(
  meetingKeyInput: number | string,
  selectedDriverNumber?: number,
): Promise<RaceDetailSnapshot | null> {
  const meetingKey = Number(meetingKeyInput);
  const baseTags = [`meeting-${meetingKey}`];

  const [meetingRecords, sessionsRaw] = await Promise.all([
    fetchOpenF1<Meeting>("meetings", { meeting_key: meetingKey }, { tags: baseTags }),
    fetchOpenF1<Session>("sessions", { meeting_key: meetingKey }, { tags: baseTags }),
  ]);

  if (sessionsRaw.length === 0) {
    return null;
  }

  const sessions = sortByDateStart(sessionsRaw);
  const race =
    sessions.find((session) => session.session_name === "Race") ??
    sessions.find((session) => session.session_type === "Race") ??
    sessions.at(-1);

  if (!race) {
    return null;
  }

  const meeting = meetingRecords[0] ?? createFallbackMeeting(race);
  const tags = [...baseTags, `season-${meeting.year}`];

  const [
    drivers,
    resultTableRaw,
    startingGrid,
    stints,
    pitStops,
    overtakes,
    raceControl,
    weather,
  ] = await Promise.all([
    fetchOpenF1<Driver>("drivers", { session_key: race.session_key }, {
      tags,
      allowFailure: true,
    }),
    fetchOpenF1<SessionResult>(
      "session_result",
      { session_key: race.session_key },
      { tags, allowFailure: true },
    ),
    fetchOpenF1<StartingGridEntry>(
      "starting_grid",
      { meeting_key: meetingKey },
      { tags, allowFailure: true },
    ),
    fetchOpenF1<Stint>("stints", { session_key: race.session_key }, { tags, allowFailure: true }),
    fetchOpenF1<PitStop>("pit", { session_key: race.session_key }, { tags, allowFailure: true }),
    fetchOpenF1<Overtake>("overtakes", { session_key: race.session_key }, { tags, allowFailure: true }),
    fetchOpenF1<RaceControlMessage>(
      "race_control",
      { session_key: race.session_key },
      { tags, allowFailure: true },
    ),
    fetchOpenF1<WeatherSample>(
      "weather",
      { session_key: race.session_key },
      { tags, allowFailure: true },
    ),
  ]);

  const driverMap = buildDriverMap(drivers);
  const resultTable = enrichResults(resultTableRaw, startingGrid, driverMap);
  const driverInResults =
    selectedDriverNumber != null &&
    resultTable.some((row) => row.driver_number === selectedDriverNumber);
  const resolvedDriverNumber =
    (driverInResults ? selectedDriverNumber : undefined) ??
    resultTable[0]?.driver_number ??
    drivers[0]?.driver_number ??
    null;

  let selectedDriverLaps: Lap[] = [];
  let selectedDriverPositions: PositionSample[] = [];
  let selectedDriverGaps: IntervalSample[] = [];
  let selectedDriverRadio: TeamRadioClip[] = [];

  if (resolvedDriverNumber !== null) {
    const driverTags = [...tags, `driver-${resolvedDriverNumber}`];

    [
      selectedDriverLaps,
      selectedDriverPositions,
      selectedDriverGaps,
      selectedDriverRadio,
    ] = await Promise.all([
      fetchOpenF1<Lap>(
        "laps",
        { session_key: race.session_key, driver_number: resolvedDriverNumber },
        { tags: driverTags, allowFailure: true },
      ),
      fetchOpenF1<PositionSample>(
        "position",
        { session_key: race.session_key, driver_number: resolvedDriverNumber },
        { tags: driverTags, allowFailure: true },
      ),
      fetchOpenF1<IntervalSample>(
        "intervals",
        { session_key: race.session_key, driver_number: resolvedDriverNumber },
        { tags: driverTags, allowFailure: true },
      ),
      fetchOpenF1<TeamRadioClip>(
        "team_radio",
        { session_key: race.session_key, driver_number: resolvedDriverNumber },
        { tags: driverTags, allowFailure: true },
      ),
    ]);
  }

  const sortedRc = sortByDate(raceControl);
  const rcWithLap = sortedRc.filter((rc) => rc.lap_number != null);

  const enrichedOvertakes: EnrichedOvertake[] = overtakes.map((ov) => {
    const overtaking = driverMap.get(ov.overtaking_driver_number);
    const overtaken = driverMap.get(ov.overtaken_driver_number);
    let lapNum: number | null = null;
    for (let i = rcWithLap.length - 1; i >= 0; i--) {
      if (rcWithLap[i].date <= ov.date) {
        lapNum = rcWithLap[i].lap_number!;
        break;
      }
    }
    return {
      ...ov,
      overtakingDriverName: overtaking?.full_name ?? `Car ${ov.overtaking_driver_number}`,
      overtakenDriverName: overtaken?.full_name ?? `Car ${ov.overtaken_driver_number}`,
      overtakingTeamColour: overtaking?.team_colour ?? null,
      overtakenTeamColour: overtaken?.team_colour ?? null,
      lap_number: lapNum,
    };
  });

  return {
    meeting,
    sessions,
    race,
    drivers,
    resultTable,
    selectedDriver: resolvedDriverNumber
      ? driverMap.get(resolvedDriverNumber) ?? null
      : null,
    selectedDriverNumber: resolvedDriverNumber,
    selectedDriverLaps: [...selectedDriverLaps].sort(
      (left, right) => left.lap_number - right.lap_number,
    ),
    selectedDriverPositions: sortByDate(selectedDriverPositions),
    selectedDriverGaps: sortByDate(selectedDriverGaps),
    selectedDriverStints: [...stints]
      .filter((stint) => stint.driver_number === resolvedDriverNumber)
      .sort((left, right) => left.stint_number - right.stint_number),
    selectedDriverRadio: sortByDate(selectedDriverRadio).reverse(),
    pitStops: [...pitStops].sort((left, right) => left.lap_number - right.lap_number),
    overtakes: sortByDate(overtakes).reverse(),
    enrichedOvertakes: sortByDate(enrichedOvertakes),
    raceControl: sortByDate(raceControl).reverse(),
    weatherSummary: buildWeatherSummary(weather),
    startingGrid: [...startingGrid].sort((left, right) => left.position - right.position),
  };
}

export async function getCarDataForLap(
  sessionKey: number,
  driverNumber: number,
  dateStart: string,
  dateEnd: string,
): Promise<CarDataSample[]> {
  return fetchOpenF1<CarDataSample>(
    "car_data",
    {
      session_key: sessionKey,
      driver_number: driverNumber,
      "date>=": dateStart,
      "date<=": dateEnd,
    },
    { allowFailure: true, revalidate: 60 * 60 * 24 },
  );
}

export async function getLocationForLap(
  sessionKey: number,
  driverNumber: number,
  dateStart: string,
  dateEnd: string,
): Promise<LocationSample[]> {
  return fetchOpenF1<LocationSample>(
    "location",
    {
      session_key: sessionKey,
      driver_number: driverNumber,
      "date>=": dateStart,
      "date<=": dateEnd,
    },
    { allowFailure: true, revalidate: 60 * 60 * 24 },
  );
}
