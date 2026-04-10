import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";

import { getRaceDetailSnapshot, getSeasonSnapshot } from "@/lib/openf1";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  revalidateTag("openf1", "max");

  const season = await getSeasonSnapshot();
  const race = await getRaceDetailSnapshot(season.featuredMeeting.meeting_key);

  return Response.json({
    ok: true,
    refreshedAt: new Date().toISOString(),
    season: season.seasonYear,
    meeting: season.featuredMeeting.meeting_name,
    warmedRacePage: Boolean(race),
  });
}
