type WindRoseProps = {
  degrees: number | null;
  size?: number;
};

export function WindRose({ degrees, size = 48 }: WindRoseProps) {
  if (degrees == null) {
    return (
      <div
        className="flex items-center justify-center rounded-full border border-white/8"
        style={{ width: size, height: size, background: "rgba(255,255,255,0.03)" }}
      >
        <span className="text-[10px] text-white/25">N/A</span>
      </div>
    );
  }

  const r = size / 2;
  const arrowLen = r * 0.55;
  const tailLen = r * 0.25;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={r} cy={r} r={r - 1} fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      {["N", "E", "S", "W"].map((label, i) => {
        const angle = (i * 90 * Math.PI) / 180 - Math.PI / 2;
        const lx = r + Math.cos(angle) * (r - 7);
        const ly = r + Math.sin(angle) * (r - 7);
        return (
          <text
            key={label}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgba(255,255,255,0.25)"
            fontSize="7"
            fontFamily="var(--font-mono, monospace)"
          >
            {label}
          </text>
        );
      })}
      <g transform={`rotate(${degrees}, ${r}, ${r})`}>
        <line x1={r} y1={r + tailLen} x2={r} y2={r - arrowLen} stroke="var(--accent-cool)" strokeWidth="2" strokeLinecap="round" />
        <polygon
          points={`${r},${r - arrowLen - 3} ${r - 3},${r - arrowLen + 3} ${r + 3},${r - arrowLen + 3}`}
          fill="var(--accent-cool)"
        />
      </g>
    </svg>
  );
}
