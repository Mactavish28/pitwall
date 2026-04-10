import type { MeetingStatus } from "@/lib/openf1";

const shortDateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
});

const longDateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const shortDateTimeFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});

export function formatShortDate(date: string) {
  return shortDateFormatter.format(new Date(date));
}

export function formatLongDate(date: string) {
  return longDateFormatter.format(new Date(date));
}

export function formatUtcDateTime(date: string) {
  return shortDateTimeFormatter.format(new Date(date));
}

export function formatMeetingWindow(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start.getUTCMonth() === end.getUTCMonth()) {
    return `${start.toLocaleString("en", {
      month: "short",
      timeZone: "UTC",
    })} ${start.getUTCDate()}-${end.getUTCDate()}`;
  }

  return `${formatShortDate(startDate)} - ${formatShortDate(endDate)}`;
}

export function formatDuration(
  duration: number | string | null | undefined,
  decimals = 3,
) {
  if (duration === null || duration === undefined) {
    return "—";
  }

  if (typeof duration === "string") {
    return duration;
  }

  if (duration >= 60) {
    const minutes = Math.floor(duration / 60);
    const remainder = duration - minutes * 60;

    return `${minutes}:${remainder.toFixed(decimals).padStart(decimals + 3, "0")}`;
  }

  return `${duration.toFixed(decimals)}s`;
}

export function formatGap(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return "Leader";
  }

  if (typeof value === "string") {
    return value;
  }

  return `+${value.toFixed(value >= 10 ? 1 : 3)}s`;
}

export function formatTemperature(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${value.toFixed(1)}C`;
}

export function formatWindSpeed(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${value.toFixed(1)} m/s`;
}

export function formatPositionChange(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  if (value === 0) {
    return "EVEN";
  }

  return value > 0 ? `+${value}` : `${value}`;
}

export function formatPoints(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${value} pts`;
}

export function formatSectorTime(value: number | null | undefined) {
  if (value === null || value === undefined) return "---";
  return value.toFixed(3);
}

export function formatMeetingStatus(status: MeetingStatus) {
  switch (status) {
    case "completed":
      return "Completed";
    case "live":
      return "Live";
    case "upcoming":
      return "Upcoming";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}
