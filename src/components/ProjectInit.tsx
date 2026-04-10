"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud, LayoutGrid, Layers, ArrowRight } from "lucide-react";
import MapProcessor from "./MapProcessor";
import ManualGridBuilder from "./ManualGridBuilder";

export default function ProjectInit() {
  const [selectedMode, setSelectedMode] = useState<"map" | "manual" | null>(null);

  if (selectedMode === "map") return <MapProcessor />;
  if (selectedMode === "manual") return <ManualGridBuilder />;

  return (
    <div className="flex flex-col h-full min-h-[500px] bg-slate-50 items-center justify-center p-6 relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-4xl w-full relative z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-soft mb-5">
            <Layers size={32} className="text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-4">Initialize City Project</h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Choose how you want to start building your municipal zoning layout.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 relative">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-400 z-20 border border-white shadow-sm hidden md:flex">OR</div>
          <ModeCard 
            title="Topology Extractor"
            description="Upload a sketch or image of your city bounds. The AI will extract the buildable footprint."
            icon={<UploadCloud size={40} className="text-indigo-500" />}
            color="indigo"
            onClick={() => setSelectedMode("map")}
          />
          <ModeCard 
            title="Manual Layout"
            description="Explicitly define block sizes and grid resolution to build a symmetrical city."
            icon={<LayoutGrid size={40} className="text-emerald-500" />}
            color="emerald"
            onClick={() => setSelectedMode("manual")}
          />
        </div>
      </motion.div>
    </div>
  );
}

function ModeCard({ title, description, icon, color, onClick }: any) {
  const colorMap = {
    indigo: "hover:border-indigo-300 hover:ring-indigo-100",
    emerald: "hover:border-emerald-300 hover:ring-emerald-100",
  };
  
  return (
    <button 
      onClick={onClick}
      className={`group bg-white p-8 rounded-3xl border border-slate-200 shadow-soft text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-4 ${colorMap[color as keyof typeof colorMap]} flex flex-col h-full relative overflow-hidden`}
    >
      <div className={`p-4 rounded-2xl inline-flex mb-6 transition-colors duration-300 ${color === 'indigo' ? 'bg-indigo-50 group-hover:bg-indigo-100' : 'bg-emerald-50 group-hover:bg-emerald-100'}`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-slate-800 mb-3">{title}</h3>
      <p className="text-slate-500 mb-8 leading-relaxed flex-1">{description}</p>
      
      <div className={`inline-flex items-center gap-2 font-bold transition-all duration-300 ${color === 'indigo' ? 'text-indigo-600' : 'text-emerald-600'}`}>
        Get Started <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  );
}
