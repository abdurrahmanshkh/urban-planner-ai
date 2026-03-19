import Sidebar from "@/components/Sidebar";
import GridVisualizer from "@/components/GridVisualizer";
import AnalyticsPanel from "@/components/AnalyticsPanel";

export default function Home() {
  return (
    <main className="flex flex-col md:flex-row h-screen w-full bg-background overflow-hidden">
      {/* Left Sidebar Control Panel */}
      <Sidebar />

      {/* Center Interactive Visualizer */}
      <GridVisualizer />

      {/* Right Analytics Panel (Hidden on smaller screens, stacked on mid screens, side-by-side on xl) */}
      <div className="hidden xl:block h-full">
        <AnalyticsPanel />
      </div>
    </main>
  );
}