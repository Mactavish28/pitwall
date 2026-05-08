import "server-only";

const OPENF1_BASE_URL = "https://api.openf1.org/v1";
export const OPENF1_USER_AGENT =
  "Pitwall/1.0 (+https://github.com/Mactavish28/pitwall; contact: openf1 client)";

const openF1RequestStartTimes: number[] = [];
let openF1RateLimitChain: Promise<void> = Promise.resolve();

function parseOpenF1RateInt(
  envName: string,
  fallback: number,
  min: number,
  max: number,
) {
  const raw = process.env[envName];
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  if (Number.isFinite(n) && n >= min && n <= max) return n;
  return fallback;
}

function getOpenF1FreeTierLimits() {
  return {
    maxPerSecond: parseOpenF1RateInt("OPENF1_MAX_RPS", 3, 1, 20),
    /**
     * 0 = do not enforce a rolling per-minute cap (still enforces maxPerSecond).
     * OpenF1 documents ~30/min for anonymous use; the Pitwall homepage issues many calls
     * and strict 30/min can exceed Vercel's 60s serverless limit → 504. Set OPENF1_MAX_RPM=30
     * for strict compliance (lighter pages / token) or use OPENF1_ACCESS_TOKEN.
     */
    maxPerMinute: parseOpenF1RateInt("OPENF1_MAX_RPM", 0, 0, 600),
  };
}

function shouldApplyOpenF1FreeRateLimit() {
  if (process.env.OPENF1_RATE_LIMIT_DISABLED === "1") return false;
  if (process.env.OPENF1_ACCESS_TOKEN?.trim()) return false;
  // `next dev`: the homepage issues many OpenF1 calls; 30 RPM makes the first load hang for minutes.
  // Production (`next build` / Vercel) uses NODE_ENV=production — limiter stays on.
  if (process.env.NODE_ENV === "development") return false;
  return true;
}

function pruneOpenF1RequestStarts(now: number, maxAgeMs: number) {
  const cutoff = now - maxAgeMs;
  while (openF1RequestStartTimes.length > 0 && openF1RequestStartTimes[0]! < cutoff) {
    openF1RequestStartTimes.shift();
  }
}

async function acquireOpenF1SlotLocked(): Promise<void> {
  const { maxPerSecond, maxPerMinute } = getOpenF1FreeTierLimits();
  const pruneWindowMs = maxPerMinute > 0 ? 60_000 : 5_000;

  for (;;) {
    const now = Date.now();
    pruneOpenF1RequestStarts(now, pruneWindowMs);

    const startedInLastSecond = openF1RequestStartTimes.filter((t) => t > now - 1000).length;

    const minuteOk =
      maxPerMinute <= 0 || openF1RequestStartTimes.length < maxPerMinute;

    if (minuteOk && startedInLastSecond < maxPerSecond) {
      openF1RequestStartTimes.push(Date.now());
      return;
    }

    let waitMs = 25;
    if (maxPerMinute > 0 && openF1RequestStartTimes.length >= maxPerMinute) {
      waitMs = Math.max(waitMs, openF1RequestStartTimes[0]! + 60_000 - now + 1);
    }
    if (startedInLastSecond >= maxPerSecond) {
      const inSecondSorted = openF1RequestStartTimes
        .filter((t) => t > now - 1000)
        .sort((a, b) => a - b);
      const oldestInSecond = inSecondSorted[0]!;
      waitMs = Math.max(waitMs, oldestInSecond + 1000 - now + 1);
    }
    await new Promise<void>((resolve) =>
      setTimeout(resolve, Math.min(waitMs, 250)),
    );
  }
}

export async function acquireOpenF1SlotForRequest(): Promise<void> {
  if (!shouldApplyOpenF1FreeRateLimit()) {
    return;
  }
  const run = openF1RateLimitChain.then(() => acquireOpenF1SlotLocked());
  openF1RateLimitChain = run.catch(() => {});
  await run;
}

export function getOpenF1RequestHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": OPENF1_USER_AGENT,
  };
  const token = process.env.OPENF1_ACCESS_TOKEN?.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

const UPSTREAM_429_ATTEMPTS = 4;

async function fetchOpenF1UpstreamOnce(
  url: string,
  headers: Record<string, string>,
  attempt: number,
): Promise<Response> {
  await acquireOpenF1SlotForRequest();
  const response = await fetch(url, { headers, cache: "no-store" });

  if (response.status === 429 && attempt < UPSTREAM_429_ATTEMPTS) {
    const retryAfterHeader = Number(response.headers.get("retry-after"));
    const retryDelayMs =
      Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
        ? retryAfterHeader * 1000
        : 1500 + attempt * 800;
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    return fetchOpenF1UpstreamOnce(url, headers, attempt + 1);
  }

  return response;
}

/**
 * GET from OpenF1 with the same rate limit, auth headers, and 429 backoff as fetchOpenF1,
 * but without Next.js fetch caching (for Route Handlers and browser proxy).
 *
 * @param pathAndQuery path under v1/ with query, e.g. `location?session_key=1&driver_number=16`
 */
export async function openF1UpstreamGet(pathAndQuery: string): Promise<Response> {
  const normalized = pathAndQuery.replace(/^\//, "");
  const url = `${OPENF1_BASE_URL}/${normalized}`;
  const headers = getOpenF1RequestHeaders();
  return fetchOpenF1UpstreamOnce(url, headers, 0);
}
