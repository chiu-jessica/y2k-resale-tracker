export default function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-6 bg-[#1a1a1a] border"
      style={{
        borderColor: "#ff006e",
        boxShadow: accent ? "0 0 20px rgba(255,0,110,0.25)" : "0 0 10px rgba(255,0,110,0.1)",
      }}
    >
      <div className="text-sm text-[#ffb3d9] mb-1 tracking-wide">
        ✦ {label} ✦
      </div>
      <div className="text-3xl font-bold text-[#f5f5f5]">{value}</div>
    </div>
  );
}
