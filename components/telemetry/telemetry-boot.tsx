"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initTelemetry } from "@/lib/telemetry/client";

/** Renders nothing. Mounted in the root layout so every route records its visit and picks up a tester mark. */
export default function TelemetryBoot() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname?.startsWith("/inspector")) return;
    initTelemetry();
  }, [pathname]);
  return null;
}
