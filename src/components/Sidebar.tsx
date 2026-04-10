// src/components/Sidebar.tsx
"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, Map, Settings, SlidersHorizontal, Layers, CheckCircle2 } from "lucide-react";
import { usePlanStore } from "@/store/usePlanStore";

export default function Sidebar() {
  const { gridData, isGenerating } = usePlanStore();
  const hasGridData = Object.keys(gridData).length > 0;
  const hasGeneratedPlan = Object.values(gridData).some((c) => c.type === "amenity");

  // Determine active step based on state
  let currentStep = 1;
  if (hasGridData) currentStep = 2;
  if (hasGeneratedPlan) currentStep = 3;

  return (
    <motion.aside 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-full md:w-[280px] glass-panel-dark h-full flex flex-col relative text-slate-100"
    >
      <div className="p-6 border-b border-slate-800/60">
        <h1 className="text-xl font-extrabold flex items-center gap-2 text-white">
          <Layers className="text-primary-light" fill="currentColor" />
          UrbanPlan AI
        </h1>
        <p className="text-xs text-slate-400 mt-2 uppercase tracking-widest font-semibold font-sans">Municipal Engine</p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto dark-scroll">
        <NavItem 
          icon={<Map size={20} />} 
          label="Topography Importer" 
          active={currentStep === 1}
          completed={currentStep > 1}
        />
        <NavItem 
          icon={<SlidersHorizontal size={20} />} 
          label="Zoning Parameters" 
          active={currentStep === 2}
          completed={currentStep > 2}
        />
        <NavItem 
          icon={<LayoutDashboard size={20} />} 
          label="Analytics & Reports" 
          active={currentStep === 3}
          completed={false}
        />
      </nav>

      <div className="p-4 border-t border-slate-800/60">
        <button className="w-full flex items-center justify-center gap-2 bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white py-3 rounded-xl transition-all font-medium border border-slate-700/50 shadow-inner">
          <Settings size={18} />
          Project Settings
        </button>
      </div>
    </motion.aside>
  );
}

function NavItem({ icon, label, active = false, completed = false }: { icon: React.ReactNode, label: string, active?: boolean, completed?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all border ${
      active 
        ? "bg-primary/20 border-primary/30 text-white shadow-[0_0_15px_rgba(99,102,241,0.1)]" 
        : completed
          ? "bg-transparent border-transparent text-slate-400 hover:bg-slate-800/40"
          : "bg-transparent border-transparent text-slate-500 hover:bg-slate-800/40"
    }`}>
      <div className={`relative ${active ? "text-primary-light" : completed ? "text-success" : ""}`}>
        {completed ? <CheckCircle2 size={20} /> : icon}
      </div>
      <span className={`font-medium text-sm ${active ? "font-semibold" : ""}`}>{label}</span>
    </button>
  );
}