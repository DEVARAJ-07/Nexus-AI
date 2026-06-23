"use client";

import { usePathname } from "next/navigation";

export default function TransitionProvider({ children }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  );
}
