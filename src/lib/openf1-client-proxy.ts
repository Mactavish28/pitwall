/**
 * Build a same-origin URL to `/api/openf1/v1/...` so browser fetches hit our proxy
 * (server enforces OpenF1 free-tier rate limits and optional Bearer token).
 *
 * @param pathAndQuery e.g. `location?session_key=1&driver_number=16` (no leading slash)
 */
export function openF1ProxyUrl(pathAndQuery: string): string {
  const trimmed = pathAndQuery.replace(/^\//, "");
  if (trimmed.includes("/")) {
    throw new Error("openF1ProxyUrl: only single-segment OpenF1 paths are supported");
  }
  return `/api/openf1/v1/${trimmed}`;
}
