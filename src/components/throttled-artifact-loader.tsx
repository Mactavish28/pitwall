"use client";

import { InlineLoader } from "@/components/inline-loader";

type ThrottledArtifactLoaderProps = {
  hasData: boolean;
  label: string;
};

export function ThrottledArtifactLoader({
  hasData,
  label,
}: ThrottledArtifactLoaderProps) {
  if (hasData) return null;

  return (
    <InlineLoader
      label={label}
      className="rounded-[18px] border border-white/8 bg-white/[0.02]"
    />
  );
}
