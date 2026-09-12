export default function GrungeDivider() {
  return (
    <svg
      viewBox="0 0 1200 60"
      preserveAspectRatio="none"
      className="w-full h-[60px]"
    >
      <path
        d="M0,20 Q50,0 100,25 T200,15 Q250,40 300,10 T400,30
           Q450,5 500,20 T600,10 Q650,35 700,15 T800,25
           Q850,5 900,20 T1000,15 Q1050,30 1100,10 T1200,20
           L1200,0 L0,0 Z"
        fill="#ff006e"
        opacity="0.9"
      />
      <path
        d="M0,25 Q60,5 120,28 T240,18 Q300,42 360,15 T480,32
           Q540,8 600,22 T720,12 Q780,36 840,18 T960,26
           Q1020,8 1080,22 T1200,18 L1200,0 L0,0 Z"
        fill="#0a0a0a"
        opacity="0.5"
      />
    </svg>
  );
}
