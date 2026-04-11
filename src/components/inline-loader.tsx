type InlineLoaderProps = {
  label: string;
  className?: string;
};

export function InlineLoader({ label, className = "" }: InlineLoaderProps) {
  return (
    <div
      className={`flex items-center justify-center gap-3 py-8 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="size-5 shrink-0 animate-spin rounded-full border-2 border-white/15 border-t-[var(--accent)]"
        aria-hidden
      />
      <span className="text-sm text-white/45">{label}</span>
    </div>
  );
}
