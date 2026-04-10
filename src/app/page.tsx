"use client";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import AnalyticsPanel from "@/components/AnalyticsPanel";
import ZoningWizard from "@/components/ZoningWizard";
import dynamic from "next/dynamic";
import { usePlanStore } from "@/store/usePlanStore";

export default function Home() {
  const { initMode } = usePlanStore();
  const GridVisualizer = dynamic(() => import("@/components/GridVisualizer"), {
    ssr: false,
  });
  const ProjectInit = dynamic(() => import("@/components/ProjectInit"), {
    ssr: false,
  });
  
  return (
    <div className="bg-surface text-on-surface selection:bg-primary-fixed selection:text-on-primary-fixed overflow-hidden min-h-screen">
      <TopNav />
      {initMode ? <Sidebar /> : null}

      <main className={`${initMode ? 'lg:ml-64' : ''} pt-16 h-screen flex flex-col md:flex-row bg-surface transition-all duration-300`}>
        {initMode === null ? (
          <div className="w-full h-full overflow-y-auto">
            <ProjectInit />
          </div>
        ) : (
          <>
            <section className="w-full md:w-[22%] h-full bg-surface-container-low overflow-y-auto border-r border-outline-variant/10">
              <ZoningWizard />
            </section>

            <section className="w-full md:w-[56%] h-full relative bg-surface p-4">
              <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative z-10 w-full">
                <GridVisualizer />
              </div>
            </section>

            <section className="w-full md:w-[22%] h-full bg-surface-container-low overflow-y-auto border-l border-outline-variant/10">
              <AnalyticsPanel />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
