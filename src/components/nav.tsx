import Link from "next/link";
import { Activity, ChevronRight } from "lucide-react";

export function Nav() {
  return (
    <header className="nav-header">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex items-center gap-1">
            <span
              className="display-font text-2xl tracking-widest text-white leading-none"
              style={{ letterSpacing: "0.14em" }}
            >
              PIT
            </span>
            <span
              className="display-font text-2xl tracking-widest leading-none"
              style={{ color: "var(--accent)", letterSpacing: "0.14em" }}
            >
              WALL
            </span>
          </div>
          <div className="hidden h-4 w-px bg-white/15 sm:block" />
          <span className="hidden text-xs text-white/40 sm:block">
            OpenF1 Intelligence
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Live indicator dot */}
          <div className="hidden items-center gap-2 sm:flex">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-[var(--accent)]" />
            </span>
            <span className="text-xs text-white/45">F1 Season</span>
          </div>

          <div className="hidden h-4 w-px bg-white/12 sm:block" />

          {/* Browse CTA */}
          <Link
            href="/#calendar"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/65 transition hover:border-white/18 hover:bg-white/8 hover:text-white"
          >
            Season Map
            <ChevronRight className="size-3.5" />
          </Link>
        </div>
      </div>

      {/* Accent gradient speed line */}
      <div className="nav-accent-line" />
    </header>
  );
}
