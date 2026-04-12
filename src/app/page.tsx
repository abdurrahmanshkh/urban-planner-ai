"use client";
import Sidebar from "@/components/Sidebar";
import AnalyticsPanel from "@/components/AnalyticsPanel";
import dynamic from "next/dynamic";

export default function Home() {
  const GridVisualizer = dynamic(() => import("@/components/GridVisualizer"), {
    ssr: false,
  });
  
  return (
    <main className="flex h-screen w-full bg-slate-100 overflow-hidden relative">
      {/* Left Sidebar */}
      <div className="hidden md:block shrink-0">
        <Sidebar />
      </div>

      {/* Main Interactive Visualizer */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative z-10">
        <GridVisualizer />
      </div>

      {/* Right Analytics Panel */}
      <div className="hidden lg:block h-full shrink-0 z-20">
        <AnalyticsPanel />
      </div>
    </main>
  );
}
