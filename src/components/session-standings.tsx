"use client";

import { useCallback, useState } from "react";
import type { Session } from "@/lib/openf1";
import { formatUtcDateTime } from "@/lib/format";
import { openF1ProxyUrl } from "@/lib/openf1-client-proxy";

type SessionResult = {
  position: number | null;
  driver_number: number;
  duration: number | null;
};

type DriverInfo = {
  driver_number: number;
  name_acronym: string;
  full_name: string;
  team_colour: string | null;
};

type SessionStandingsProps = {
  session: Session;
  isRace: boolean;
};

export function SessionStandings({ session, isRace }: SessionStandingsProps) {
  const [expanded, setExpanded] = useState(false);
  const [results, setResults] = useState<Array<{ name: string; color: string }> | null>(null);
  const [loading, setLoading] = useState(false);

  const canExpand = ["Practice 1", "Practice 2", "Practice 3", "Practice 4", "Qualifying", "Sprint Qualifying", "Sprint"].includes(session.session_name);

  const loadResults = useCallback(async () => {
    if (results) {
      setExpanded(!expanded);
      return;
    }

    setLoading(true);
    setExpanded(true);

    try {
      const [resData, driverData] = await Promise.all([
        fetch(openF1ProxyUrl(`session_result?session_key=${session.session_key}`))
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => []),
        fetch(openF1ProxyUrl(`drivers?session_key=${session.session_key}`))
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => []),
      ]);

      const driverMap = new Map<number, DriverInfo>(
        (driverData as DriverInfo[]).map((d) => [d.driver_number, d]),
      );

      const sorted = (resData as SessionResult[])
        .filter((r) => r.position != null)
        .sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity))
        .slice(0, 4);

      setResults(
        sorted.map((r) => {
          const driver = driverMap.get(r.driver_number);
          return {
            name: driver?.name_acronym ?? `#${r.driver_number}`,
            color: driver?.team_colour ? `#${driver.team_colour}` : "rgba(255,255,255,0.5)",
          };
        }),
      );
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [results, expanded, session.session_key]);

  return (
    <div
      className={`rounded-[20px] px-4 py-3 transition-all ${canExpand ? "cursor-pointer" : ""}`}
      style={{
        border: isRace ? "1px solid rgba(255,90,54,0.25)" : "1px solid rgba(255,255,255,0.07)",
        background: isRace ? "rgba(255,90,54,0.08)" : "rgba(255,255,255,0.03)",
      }}
      onClick={canExpand ? loadResults : undefined}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="telemetry-kicker text-[10px] text-white/38">{session.session_name}</p>
        {canExpand && (
          <span className="text-[9px] text-white/25">{expanded ? "▲" : "▼"}</span>
        )}
      </div>
      <p className="mt-2 text-sm text-white/72">{formatUtcDateTime(session.date_start)}</p>

      {expanded && (
        <div className="mt-3 space-y-1 border-t border-white/6 pt-3">
          {loading ? (
            <p className="text-[10px] text-white/30">Loading...</p>
          ) : results && results.length > 0 ? (
            results.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 text-right font-mono text-[10px] text-white/35">P{i + 1}</span>
                <span
                  className="inline-block size-1.5 rounded-full"
                  style={{ background: r.color }}
                />
                <span className="text-[11px] font-medium text-white/60">{r.name}</span>
              </div>
            ))
          ) : (
            <p className="text-[10px] text-white/30">No results available</p>
          )}
        </div>
      )}
    </div>
  );
}
