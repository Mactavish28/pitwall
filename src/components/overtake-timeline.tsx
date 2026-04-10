"use client";

import { useState } from "react";
import type { EnrichedOvertake } from "@/lib/openf1";

type OvertakeTimelineProps = {
  overtakes: EnrichedOvertake[];
  totalLaps: number;
};

function teamColor(colour: string | null) {
  return colour ? `#${colour}` : "var(--accent)";
}

export function OvertakeTimeline({ overtakes, totalLaps }: OvertakeTimelineProps) {
  const [selectedLap, setSelectedLap] = useState<number | null>(null);

  if (overtakes.length === 0) {
    return (
      <div className="panel rounded-[30px] p-5 lg:p-6">
        <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">Overtakes</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Battle timeline</h2>
        <div className="mt-5 rounded-[18px] border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/38">
          No overtake data available for this race.
        </div>
      </div>
    );
  }

  const lapBins = new Map<number, EnrichedOvertake[]>();
  for (const ov of overtakes) {
    const lap = ov.lap_number ?? 0;
    if (!lapBins.has(lap)) lapBins.set(lap, []);
    lapBins.get(lap)!.push(ov);
  }

  const maxPerLap = Math.max(...Array.from(lapBins.values()).map((v) => v.length));
  const laps = totalLaps > 0 ? totalLaps : Math.max(...Array.from(lapBins.keys()), 1);

  const filtered = selectedLap != null ? lapBins.get(selectedLap) ?? [] : overtakes;

  return (
    <div className="panel rounded-[30px] p-5 lg:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">Overtakes</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Battle timeline</h2>
        </div>
        <span className="rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs text-white/45">
          {overtakes.length} moves
        </span>
      </div>

      {/* Race strip */}
      <div className="mt-5 flex items-end gap-px" style={{ height: 48 }}>
        {Array.from({ length: laps }, (_, i) => {
          const lap = i + 1;
          const count = lapBins.get(lap)?.length ?? 0;
          const height = count > 0 ? Math.max((count / maxPerLap) * 100, 12) : 4;
          const isSelected = selectedLap === lap;
          return (
            <button
              key={lap}
              onClick={() => setSelectedLap(isSelected ? null : lap)}
              className="flex-1 transition-opacity"
              style={{ height: "100%", minWidth: 0 }}
              title={`Lap ${lap}: ${count} overtake${count !== 1 ? "s" : ""}`}
            >
              <div
                className="mx-auto w-full rounded-t transition-all"
                style={{
                  height: `${height}%`,
                  background: count > 0
                    ? isSelected ? "var(--accent)" : "rgba(122,245,255,0.35)"
                    : "rgba(255,255,255,0.06)",
                  marginTop: "auto",
                }}
              />
            </button>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-white/25">
        <span>Lap 1</span>
        {selectedLap != null && (
          <button onClick={() => setSelectedLap(null)} className="text-[var(--accent)] hover:underline">
            Clear filter
          </button>
        )}
        <span>Lap {laps}</span>
      </div>

      {/* Detail table */}
      <div className="mt-4 max-h-[320px] overflow-y-auto pr-1">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/8 text-[10px] uppercase tracking-widest text-white/30">
              <th className="pb-2 text-left font-normal">Lap</th>
              <th className="pb-2 text-left font-normal">Overtaking</th>
              <th className="pb-2 text-left font-normal">Overtaken</th>
              <th className="pb-2 text-right font-normal">Pos</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ov, i) => (
              <tr key={`${ov.date}-${i}`} className="border-b border-white/5">
                <td className="py-1.5 font-mono text-white/50">
                  {ov.lap_number ?? "—"}
                </td>
                <td className="py-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block size-2 rounded-full" style={{ background: teamColor(ov.overtakingTeamColour) }} />
                    <span className="text-white/70">{ov.overtakingDriverName}</span>
                  </span>
                </td>
                <td className="py-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block size-2 rounded-full" style={{ background: teamColor(ov.overtakenTeamColour) }} />
                    <span className="text-white/45">{ov.overtakenDriverName}</span>
                  </span>
                </td>
                <td className="py-1.5 text-right font-mono text-white/50">
                  P{ov.position}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
