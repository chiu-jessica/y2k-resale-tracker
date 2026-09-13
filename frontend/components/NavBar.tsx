"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Trends", href: "/trends" },
  { label: "Predictor", href: "/predictor" },
  { label: "Deals", href: "/deals" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a] border-b border-[#ff006e]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-grunge text-xl text-[#f5f5f5] tracking-wide">
          Y2K TRACKER
        </Link>

        <div className="flex items-center gap-6 text-sm font-medium">
          {LINKS.map(({ label, href }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={
                  isActive
                    ? "text-[#ff006e]"
                    : "text-[#ffb3d9] hover:underline hover:decoration-[#ff006e] hover:decoration-2 underline-offset-8"
                }
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
