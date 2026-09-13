// A handful of diagonal streaks crossing the page at different angles —
// like glitched scan lines rather than uniform speed lines. Each fades out
// at both ends so it feels like it continues past the frame instead of
// stopping short.

type Streak = {
  yLeft: number;
  yRight: number;
  thickness: number;
  color: string;
  opacity?: number;
};

// Deliberately mixed slopes — one falls, one climbs steeply (the "main"
// hot-pink one), one barely tilts — so they cross rather than read as a
// single motion repeated three times.
const STREAKS: Streak[] = [
  { yLeft: 6, yRight: 40, thickness: 6, color: "#ffb3d9", opacity: 0.45 },
  { yLeft: 64, yRight: 12, thickness: 24, color: "#ff006e" },
  { yLeft: 80, yRight: 70, thickness: 8, color: "#f5f5f5", opacity: 0.3 },
];

function band(yLeft: number, yRight: number, thickness: number): string {
  const half = thickness / 2;
  return `0,${yLeft - half} 1200,${yRight - half} 1200,${yRight + half} 0,${yLeft + half}`;
}

function fadeGradientId(i: number) {
  return `grunge-slash-fade-${i}`;
}

export default function GrungeDivider() {
  return (
    <svg viewBox="0 0 1200 100" preserveAspectRatio="none" className="w-full h-[100px]">
      <defs>
        {STREAKS.map((s, i) => (
          <linearGradient key={i} id={fadeGradientId(i)} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={s.color} stopOpacity="0" />
            <stop offset="12%" stopColor={s.color} stopOpacity={s.opacity ?? 1} />
            <stop offset="88%" stopColor={s.color} stopOpacity={s.opacity ?? 1} />
            <stop offset="100%" stopColor={s.color} stopOpacity="0" />
          </linearGradient>
        ))}
        <filter id="grunge-slash-blur" x="-20%" y="-100%" width="140%" height="300%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* soft trailing glow behind the main slash for a sense of motion */}
      <polygon points={band(76, 24, 16)} fill="#ff006e" opacity="0.22" filter="url(#grunge-slash-blur)" />

      {STREAKS.map((s, i) => (
        <polygon key={i} points={band(s.yLeft, s.yRight, s.thickness)} fill={`url(#${fadeGradientId(i)})`} />
      ))}

      {/* bright edge along the top of the main slash for definition */}
      <polygon points={band(50, 2, 3)} fill="#ffb3d9" opacity="0.8" />
    </svg>
  );
}
