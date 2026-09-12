export default function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-6 bg-[#1a1a1a] border border-[#ff006e]"
      style={{ boxShadow: "0 0 20px rgba(255,0,110,0.15)" }}
    >
      <h3 className="font-grunge text-xl text-[#ff1493] mb-4">{title}</h3>
      <div className="text-[#f5f5f5]">{children}</div>
    </div>
  );
}
