"use client";

import { RadioTower } from "lucide-react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  return (
    <div className="panel rounded-[24px] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="telemetry-kicker text-xs text-[var(--accent-cool)]">
            Driver Spotlight
          </p>
          <p className="mt-1 text-sm text-white/65">
            Switch the telemetry panel to any finisher.
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

          router.replace(
            value ? `/races/${meetingKey}?driver=${value}` : `/races/${meetingKey}`,
          );
        }}
      >
        {drivers.map((driver) => (
          <option key={driver.driverNumber} value={driver.driverNumber}>
            {driver.label} · {driver.teamName}
          </option>
        ))}
      </select>
    </div>
  );
}
