import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { openF1UpstreamGet } from "@/lib/openf1-rate-limit";

export const dynamic = "force-dynamic";

/**
 * OpenF1 uses awkward query keys `date>=` / `date<=`. URL parsers (and searchParams.toString())
 * break those, so the browser calls this proxy with `date_start` / `date_end` and we rewrite.
 */
function buildOpenF1ProxyPath(
  endpoint: string,
  sp: URLSearchParams,
): string | null {
  if (endpoint === "location" || endpoint === "car_data") {
    const sessionKey = sp.get("session_key");
    const driverNumber = sp.get("driver_number");
    const dateStart = sp.get("date_start");
    const dateEnd = sp.get("date_end");
    if (!sessionKey || !driverNumber || !dateStart || !dateEnd) {
      return null;
    }
    const q = [
      `session_key=${encodeURIComponent(sessionKey)}`,
      `driver_number=${encodeURIComponent(driverNumber)}`,
      `date>=${encodeURIComponent(dateStart)}`,
      `date<=${encodeURIComponent(dateEnd)}`,
    ].join("&");
    return `${endpoint}?${q}`;
  }

  const search = sp.toString();
  return search ? `${endpoint}?${search}` : endpoint;
}

const ALLOWED_ENDPOINTS = new Set([
  "location",
  "car_data",
  "session_result",
  "drivers",
]);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await context.params;
  if (!slug?.length || slug.length !== 1) {
    return NextResponse.json(
      { error: "Only single-segment OpenF1 paths are allowed" },
      { status: 400 },
    );
  }

  const endpoint = slug[0]!;
  if (!ALLOWED_ENDPOINTS.has(endpoint)) {
    return NextResponse.json({ error: "Unsupported OpenF1 endpoint" }, { status: 400 });
  }

  const pathAndQuery = buildOpenF1ProxyPath(endpoint, request.nextUrl.searchParams);
  if (!pathAndQuery) {
    return NextResponse.json({ error: "Invalid or incomplete query parameters" }, { status: 400 });
  }

  const upstream = await openF1UpstreamGet(pathAndQuery);
  const contentType = upstream.headers.get("content-type") ?? "application/json";

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type": contentType,
      "cache-control": "private, no-store, max-age=0",
    },
  });
}
