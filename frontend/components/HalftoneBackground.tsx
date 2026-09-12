export default function HalftoneBackground({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        backgroundImage: `radial-gradient(circle, #ff006e 1.5px, transparent 1.5px)`,
        backgroundSize: "10px 10px",
        opacity: 0.15,
        maskImage:
          "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        WebkitMaskImage:
          "radial-gradient(ellipse at center, black 40%, transparent 80%)",
      }}
    />
  );
}
