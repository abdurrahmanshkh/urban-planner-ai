// src/components/Sidebar.tsx
"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, Map, Settings, SlidersHorizontal, Layers, CheckCircle2 } from "lucide-react";
import { usePlanStore } from "@/store/usePlanStore";
import Tooltip from "./ui/Tooltip";

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
      className="w-20 glass-panel-dark h-full flex flex-col items-center relative text-slate-100 py-6"
    >
      <div className="mb-6 flex flex-col items-center">
        <Tooltip content="UrbanPlan AI" position="right">
          <div className="bg-primary/20 p-2.5 rounded-xl border border-primary/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Layers className="text-primary-light" fill="currentColor" size={28} />
          </div>
        </Tooltip>
      </div>

      <nav className="flex-1 w-full space-y-4 overflow-y-auto dark-scroll flex flex-col items-center mt-4">
        <NavItem
          icon={<Map size={22} />}
          label="Topography Importer"
          active={currentStep === 1}
          completed={currentStep > 1}
        />
        <NavItem
          icon={<SlidersHorizontal size={22} />}
          label="Zoning Parameters"
          active={currentStep === 2}
          completed={currentStep > 2}
        />
        <NavItem
          icon={<LayoutDashboard size={22} />}
          label="Analytics & Reports"
          active={currentStep === 3}
          completed={false}
        />
      </nav>
    </motion.aside>
  );
}

function NavItem({ icon, label, active = false, completed = false }: { icon: React.ReactNode, label: string, active?: boolean, completed?: boolean }) {
  return (
    <Tooltip content={label} position="right">
      <button className={`flex items-center justify-center p-3 rounded-xl transition-all border ${active
          ? "bg-primary/20 border-primary/30 text-white shadow-[0_0_15px_rgba(99,102,241,0.1)]"
          : completed
            ? "bg-transparent border-transparent text-slate-400 hover:bg-slate-800/40"
            : "bg-transparent border-transparent text-slate-500 hover:bg-slate-800/40"
        }`}>
        <div className={`relative ${active ? "text-primary-light" : completed ? "text-success" : ""}`}>
          {completed ? <CheckCircle2 size={22} /> : icon}
        </div>
      </button>
    </Tooltip>
  );
}