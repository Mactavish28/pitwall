"use client";

import { useState } from "react";
import { ChevronRight, MapPinned } from "lucide-react";
import { useRouter } from "next/navigation";
import type { MeetingStatus } from "@/lib/openf1";

type RaceOption = {
  meetingKey: number;
  label: string;
  detail: string;
  status: MeetingStatus;
};

type RaceNavigatorProps = {
  races: RaceOption[];
  currentMeetingKey: number;
};

export function RaceNavigator({
  races,
  currentMeetingKey,
}: RaceNavigatorProps) {
  const router = useRouter();
  const [selected, setSelected] = useState(String(currentMeetingKey));

  return (
    <div className="panel rounded-[24px] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">
            Race Explorer
          </p>
          <p className="mt-1 text-sm text-white/50">
            Jump to any weekend.
          </p>
        </div>
        <MapPinned className="size-5 text-[var(--accent)]" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          aria-label="Select a race weekend"
          className="select-shell min-w-0 flex-1 truncate text-sm"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {races.map((race) => {
            const suffix =
              race.status === "upcoming"
                ? " — Upcoming"
                : race.status === "cancelled"
                  ? " — Cancelled"
                  : "";
            return (
              <option key={race.meetingKey} value={race.meetingKey}>
                {race.status === "completed" ? "● " : "○ "}
                {race.label}{suffix}
              </option>
            );
          })}
        </select>
        <button
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110 active:scale-95"
          onClick={() => router.push(`/races/${selected}`)}
          type="button"
        >
          Open
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
