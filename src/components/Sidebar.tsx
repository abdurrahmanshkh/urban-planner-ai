// src/components/Sidebar.tsx
"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, Map, Settings, SlidersHorizontal, Layers } from "lucide-react";

export default function Sidebar() {
  return (
    <motion.aside 
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-full md:w-72 bg-surface h-full border-r border-slate-200 shadow-soft flex flex-col"
    >
      <div className="p-6 border-b border-slate-100">
        <h1 className="text-xl font-bold flex items-center gap-2 text-slate-800">
          <Layers className="text-primary" />
          UrbanPlan AI
        </h1>
        <p className="text-sm text-slate-500 mt-1">Municipal Planning Engine</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <NavItem icon={<Map size={20} />} label="Topography Importer" active />
        <NavItem icon={<SlidersHorizontal size={20} />} label="Zoning Parameters" />
        <NavItem icon={<LayoutDashboard size={20} />} label="Grid Editor" />
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg transition-colors font-medium">
          <Settings size={18} />
          Project Settings
        </button>
      </div>
    </motion.aside>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active ? "bg-primary-light text-primary font-semibold" : "text-slate-600 hover:bg-slate-50"
    }`}>
      {icon}
      {label}
    </button>
  );
}