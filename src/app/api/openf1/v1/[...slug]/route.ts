import { NextRequest, NextResponse } from "next/server";

import { openF1UpstreamGet } from "@/lib/openf1-rate-limit";

export const dynamic = "force-dynamic";

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

  const search = request.nextUrl.searchParams.toString();
  const pathAndQuery = search ? `${endpoint}?${search}` : endpoint;

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
