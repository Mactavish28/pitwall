"use client";

import { useState, useRef, useCallback } from "react";
import { Radio, AlertCircle, Play, Pause } from "lucide-react";
import type { TeamRadioClip } from "@/lib/openf1";

type RadioItemProps = {
  clip: TeamRadioClip;
  driverLabel: string;
  accent: string;
};

function RadioItem({ clip, driverLabel, accent }: RadioItemProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<"idle" | "playing" | "error">("idle");
  const [progress, setProgress] = useState(0);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (state === "playing") {
      el.pause();
      setState("idle");
    } else {
      el.play().catch(() => setState("error"));
    }
  }, [state]);

  const onTimeUpdate = useCallback(() => {
    const el = audioRef.current;
    if (el && el.duration) setProgress((el.currentTime / el.duration) * 100);
  }, []);

  const time = clip.date?.slice(11, 19) ?? "";

  if (state === "error") {
    return (
      <div className="flex items-center gap-3 rounded-[16px] border border-white/6 px-4 py-3" style={{ background: "rgba(255,80,80,0.04)" }}>
        <AlertCircle className="size-4 shrink-0 text-red-400/60" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-white/50">{driverLabel}</p>
          <p className="text-xs text-red-400/50">Clip unavailable</p>
        </div>
        <span className="font-mono text-xs text-white/25">{time}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-[16px] border border-white/6 px-4 py-3" style={{ background: "rgba(255,255,255,0.025)" }}>
      <audio
        ref={audioRef}
        src={clip.recording_url}
        preload="none"
        onPlay={() => setState("playing")}
        onPause={() => setState("idle")}
        onEnded={() => { setState("idle"); setProgress(0); }}
        onError={() => setState("error")}
        onTimeUpdate={onTimeUpdate}
      />
      <button
        onClick={toggle}
        className="flex size-8 shrink-0 items-center justify-center rounded-full transition"
        style={{ background: `${accent}22`, border: `1px solid ${accent}44` }}
        aria-label={state === "playing" ? "Pause" : "Play"}
      >
        {state === "playing" ? (
          <Pause className="size-3.5" style={{ color: accent }} />
        ) : (
          <Play className="size-3.5 ml-0.5" style={{ color: accent }} />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{driverLabel}</p>
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/8">
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: accent }} />
        </div>
      </div>
      <span className="font-mono text-xs text-white/30">{time}</span>
    </div>
  );
}

type TeamRadioPlayerProps = {
  clips: TeamRadioClip[];
  driverMap: Map<number, { full_name: string; team_colour: string | null }>;
};

export function TeamRadioPlayer({ clips, driverMap }: TeamRadioPlayerProps) {
  const sorted = [...clips].sort((a, b) => b.date.localeCompare(a.date));

  if (sorted.length === 0) {
    return (
      <div className="panel rounded-[30px] p-5 lg:p-6">
        <div className="flex items-center gap-2">
          <Radio className="size-4 text-[var(--accent)]" />
          <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">Team radio</p>
        </div>
        <h2 className="mt-2 text-2xl font-semibold text-white">Radio chatter</h2>
        <div className="mt-5 rounded-[18px] border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/38">
          No team radio clips available for this session.
        </div>
      </div>
    );
  }

  return (
    <div className="panel rounded-[30px] p-5 lg:p-6">
      <div className="flex items-center gap-2">
        <Radio className="size-4 text-[var(--accent)]" />
        <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">Team radio</p>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">Radio chatter</h2>
        <span className="rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs text-white/45">
          {sorted.length} clips
        </span>
      </div>
      <div className="mt-5 max-h-[480px] space-y-2 overflow-y-auto pr-1">
        {sorted.map((clip) => {
          const driver = driverMap.get(clip.driver_number);
          const accent = driver?.team_colour ? `#${driver.team_colour}` : "var(--accent)";
          return (
            <RadioItem
              key={`${clip.driver_number}-${clip.date}`}
              clip={clip}
              driverLabel={driver?.full_name ?? `Car ${clip.driver_number}`}
              accent={accent}
            />
          );
        })}
      </div>
    </div>
  );
}
