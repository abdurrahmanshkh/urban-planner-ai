// src/components/Sidebar.tsx
"use client";

import { usePlanStore } from "@/store/usePlanStore";

export default function Sidebar() {
  const { gridData, isGenerating, generateCityPlan, initMode } = usePlanStore();
  const hasGridData = Object.keys(gridData).length > 0;
  const hasGeneratedPlan = Object.values(gridData).some((c) => c.type === "amenity");

  // Determine active step based on state
  let currentStep = 1;
  if (hasGridData) currentStep = 2;
  if (hasGeneratedPlan) currentStep = 3;

  const handleGenerate = async () => {
    if (!hasGridData || isGenerating) return;
    await generateCityPlan();
  };

  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col p-4 bg-slate-100 w-64 hidden lg:flex border-r-0 pt-20 z-40">
      <div className="mb-8 px-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-primary rounded-lg text-white flex items-center justify-center">
            <span className="material-symbols-outlined">location_city</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-none">City of Metropol</h2>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">Urban Planning Dept</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 font-headline text-sm font-medium">
        <NavItem 
          icon="dashboard" 
          label="Dashboard" 
          active={currentStep === 1}
        />
        <NavItem 
          icon="architecture" 
          label="Zoning Wizard" 
          active={currentStep === 2}
        />
        <NavItem 
          icon="grid_view" 
          label="Grid Visualizer" 
          active={currentStep === 3}
        />
        <NavItem 
          icon="analytics" 
          label="Analytics" 
          active={currentStep > 1}
        />
        <NavItem 
          icon="inventory_2" 
          label="Project Archive" 
          active={false}
        />
      </nav>

      <div className="mt-auto space-y-1 pt-4 border-t border-slate-200">
        {(initMode === 'manual' || initMode === 'map') && hasGridData && (
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`w-full bg-gradient-to-br from-primary to-primary-container text-white py-3 rounded-lg font-semibold text-sm mb-4 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 active:scale-95'}`}
          >
            {isGenerating ? (
              <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
            ) : (
              <span className="material-symbols-outlined text-sm">bolt</span>
            )}
            {isGenerating ? "Generating..." : "Generate Plan"}
          </button>
        )}
        <a className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-200 rounded-lg transition-all text-sm font-medium" href="#">
          <span className="material-symbols-outlined text-[20px]">help</span> Support
        </a>
        <a className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-200 rounded-lg transition-all text-sm font-medium" href="#">
          <span className="material-symbols-outlined text-[20px]">logout</span> Sign Out
        </a>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active = false }: { icon: string, label: string, active?: boolean }) {
  return (
    <a href="#" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
      active 
        ? "bg-white text-primary border border-slate-200/60 shadow-sm font-semibold" 
        : "bg-transparent text-slate-600 hover:bg-slate-200/70"
    }`}>
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      <span>{label}</span>
    </a>
  );
}