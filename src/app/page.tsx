"use client";
import AnalyticsPanel from "@/components/AnalyticsPanel";
import dynamic from "next/dynamic";

export default function Home() {
  const GridVisualizer = dynamic(() => import("@/components/GridVisualizer"), {
    ssr: false,
  });
  
  return (
    <main className="flex min-h-screen w-full flex-col bg-background xl:h-screen xl:flex-row xl:overflow-hidden">
      {/* Main Interactive Visualizer */}
      <GridVisualizer />

      {/* Right Analytics Panel (Hidden on smaller screens, stacked on mid screens, side-by-side on xl) */}
      <div className="hidden xl:block xl:h-full">
        <AnalyticsPanel />
      </div>
    </main>
  );
}
