const SIZES = {
  md: { padding: "p-6", label: "text-sm", value: "text-3xl" },
  lg: { padding: "p-6", label: "text-lg", value: "text-6xl" },
};

export default function StatCard({
  label,
  value,
  accent = false,
  size = "md",
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  size?: keyof typeof SIZES;
}) {
  const { padding, label: labelSize, value: valueSize } = SIZES[size];

  return (
    <div
      className={`rounded-xl ${padding} bg-[#1a1a1a] border`}
      style={{
        borderColor: "#ff006e",
        boxShadow: accent ? "0 0 20px rgba(255,0,110,0.25)" : "0 0 10px rgba(255,0,110,0.1)",
      }}
    >
      <div className={`${labelSize} text-[#ffb3d9] mb-1 tracking-wide`}>
        ✦ {label} ✦
      </div>
      <div className={`${valueSize} font-bold text-[#f5f5f5]`}>{value}</div>
    </div>
  );
}
