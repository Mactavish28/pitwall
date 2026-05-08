"use client";

import { useState } from "react";
import { RadioTower } from "lucide-react";

import { InlineLoader } from "@/components/inline-loader";

type DriverOption = {
  driverNumber: number;
  label: string;
  teamName: string;
};

type DriverSelectorProps = {
  meetingKey: number;
  drivers: DriverOption[];
  selectedDriverNumber: number | null;
};

export function DriverSelector({
  meetingKey,
  drivers,
  selectedDriverNumber,
}: DriverSelectorProps) {
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <>
      {isNavigating ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05060B]/92 backdrop-blur-sm">
          <InlineLoader
            label="Loading selected driver..."
            className="rounded-[18px] border border-white/10 bg-white/[0.03] px-6"
          />
        </div>
      ) : null}
      <div className="panel rounded-[24px] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">
            Driver Spotlight
          </p>
          <p className="mt-1 text-sm text-white/65">
            Choose who to analyse — spotlight, charts, and sectors switch to that driver. Race
            result, pit list, overtakes, and weather stay full-field.
          </p>
        </div>
        <RadioTower className="size-5 text-[var(--accent)]" />
      </div>
      <select
        aria-label="Select a driver"
        className="select-shell"
        value={selectedDriverNumber ? String(selectedDriverNumber) : ""}
        onChange={(event) => {
          const value = event.target.value;
          const target = value
            ? `/races/${meetingKey}?driver=${value}`
            : `/races/${meetingKey}`;
          setIsNavigating(true);
          window.location.assign(target);
        }}
      >
        {drivers.map((driver) => (
          <option key={driver.driverNumber} value={driver.driverNumber}>
            {driver.label} · {driver.teamName}
          </option>
        ))}
      </select>
      </div>
    </>
  );
}
