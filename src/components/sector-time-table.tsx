"use client";

import type { Lap, Stint } from "@/lib/openf1";
import { formatSectorTime } from "@/lib/format";

type SectorTimeTableProps = {
  laps: Lap[];
  stints: Stint[];
};

function compoundTag(compound: string) {
  const c = compound.toUpperCase();
  if (c.includes("SOFT")) return { text: "S", cls: "tyre-soft" };
  if (c.includes("MEDIUM")) return { text: "M", cls: "tyre-medium" };
  if (c.includes("HARD")) return { text: "H", cls: "tyre-hard" };
  if (c.includes("INTER")) return { text: "I", cls: "tyre-inter" };
  if (c.includes("WET")) return { text: "W", cls: "tyre-wet" };
  return { text: "?", cls: "tyre-hard" };
}

function getCompoundForLap(lapNumber: number, stints: Stint[]): string | null {
  for (const stint of stints) {
    if (lapNumber >= stint.lap_start && lapNumber <= stint.lap_end) return stint.compound;
  }
  return null;
}

type SectorClass = "sector-purple" | "sector-green" | "sector-yellow";

function sectorClass(
  value: number | null,
  sessionBest: number | null,
  personalBest: number | null,
): SectorClass {
  if (value == null) return "sector-yellow";
  if (sessionBest != null && Math.abs(value - sessionBest) < 0.001) return "sector-purple";
  if (personalBest != null && Math.abs(value - personalBest) < 0.001) return "sector-green";
  return "sector-yellow";
}

const SECTOR_COLORS: Record<SectorClass, string> = {
  "sector-purple": "#c060ff",
  "sector-green": "#4ae38f",
  "sector-yellow": "#ffd84d",
};

export function SectorTimeTable({ laps, stints }: SectorTimeTableProps) {
  const validLaps = laps.filter((l) => !l.is_pit_out_lap);

  const s1Values = validLaps.map((l) => l.duration_sector_1).filter((v): v is number => v != null);
  const s2Values = validLaps.map((l) => l.duration_sector_2).filter((v): v is number => v != null);
  const s3Values = validLaps.map((l) => l.duration_sector_3).filter((v): v is number => v != null);

  const sessionBestS1 = s1Values.length > 0 ? Math.min(...s1Values) : null;
  const sessionBestS2 = s2Values.length > 0 ? Math.min(...s2Values) : null;
  const sessionBestS3 = s3Values.length > 0 ? Math.min(...s3Values) : null;

  const personalBests = new Map<string, number>();
  for (const lap of validLaps) {
    for (const [key, val] of [
      ["s1", lap.duration_sector_1],
      ["s2", lap.duration_sector_2],
      ["s3", lap.duration_sector_3],
    ] as [string, number | null][]) {
      if (val == null) continue;
      const prev = personalBests.get(key);
      if (prev == null || val < prev) personalBests.set(key, val);
    }
  }

  if (validLaps.length === 0) {
    return (
      <div className="panel rounded-[28px] p-5">
        <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">Sector splits</p>
        <div className="mt-6 rounded-[18px] border border-dashed border-white/10 px-4 py-12 text-center text-sm text-white/35">
          No sector data available.
        </div>
      </div>
    );
  }

  return (
    <div className="panel rounded-[28px] p-5">
      <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">Sector splits</p>
      <p className="mt-2 text-sm text-white/55">
        Where time was gained or lost each lap.
      </p>

      <div className="mt-3 flex items-center gap-4 text-[10px]">
        {(["sector-purple", "sector-green", "sector-yellow"] as SectorClass[]).map((cls) => (
          <span key={cls} className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full" style={{ background: SECTOR_COLORS[cls] }} />
            <span className="uppercase tracking-widest text-white/40">
              {cls === "sector-purple" ? "session best" : cls === "sector-green" ? "personal best" : "slower"}
            </span>
          </span>
        ))}
      </div>

      <div className="mt-4 max-h-[420px] overflow-y-auto pr-1">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/8 text-[10px] uppercase tracking-widest text-white/30">
              <th className="pb-2 text-left font-normal">Lap</th>
              <th className="pb-2 text-center font-normal">Tyre</th>
              <th className="pb-2 text-right font-normal">S1</th>
              <th className="pb-2 text-right font-normal">S2</th>
              <th className="pb-2 text-right font-normal">S3</th>
              <th className="pb-2 text-right font-normal">Total</th>
            </tr>
          </thead>
          <tbody>
            {validLaps.map((lap) => {
              const compound = getCompoundForLap(lap.lap_number, stints);
              const tag = compound ? compoundTag(compound) : null;
              const s1Cls = sectorClass(lap.duration_sector_1, sessionBestS1, personalBests.get("s1") ?? null);
              const s2Cls = sectorClass(lap.duration_sector_2, sessionBestS2, personalBests.get("s2") ?? null);
              const s3Cls = sectorClass(lap.duration_sector_3, sessionBestS3, personalBests.get("s3") ?? null);
              const total =
                lap.duration_sector_1 != null && lap.duration_sector_2 != null && lap.duration_sector_3 != null
                  ? lap.duration_sector_1 + lap.duration_sector_2 + lap.duration_sector_3
                  : lap.lap_duration;

              return (
                <tr key={lap.lap_number} className="border-b border-white/5">
                  <td className="py-1.5 font-mono text-white/60">L{lap.lap_number}</td>
                  <td className="py-1.5 text-center">
                    {tag ? <span className={`tyre ${tag.cls} inline-flex !text-[9px] !px-1.5 !py-0`}>{tag.text}</span> : <span className="text-white/20">—</span>}
                  </td>
                  <td className="py-1.5 text-right font-mono" style={{ color: SECTOR_COLORS[s1Cls] }}>
                    {formatSectorTime(lap.duration_sector_1)}
                  </td>
                  <td className="py-1.5 text-right font-mono" style={{ color: SECTOR_COLORS[s2Cls] }}>
                    {formatSectorTime(lap.duration_sector_2)}
                  </td>
                  <td className="py-1.5 text-right font-mono" style={{ color: SECTOR_COLORS[s3Cls] }}>
                    {formatSectorTime(lap.duration_sector_3)}
                  </td>
                  <td className="py-1.5 text-right font-mono text-white/55">
                    {formatSectorTime(total)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
