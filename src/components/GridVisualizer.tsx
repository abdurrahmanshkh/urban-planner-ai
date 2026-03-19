// src/components/GridVisualizer.tsx
"use client";

import { motion } from "framer-motion";
import { Maximize2, Download, Map } from "lucide-react";

export default function GridVisualizer() {
  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="flex-1 h-full p-6 flex flex-col"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Interactive City Grid</h2>
          <p className="text-slate-500">Upload an outline or define parameters to generate zoning.</p>
        </div>
        <div className="flex gap-3">
          <button className="p-2 bg-surface border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
            <Maximize2 size={18} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors shadow-md shadow-primary/20 font-medium">
            <Download size={18} />
            Export Plan
          </button>
        </div>
      </div>

      {/* Main Visualizer Container */}
      <div className="flex-1 bg-surface rounded-2xl border border-slate-200 shadow-soft overflow-hidden flex items-center justify-center relative">
        <div className="text-center">
          <Map className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-400 font-medium">Grid workspace is empty.</p>
          <p className="text-sm text-slate-400 mt-1">Proceed to Phase 2 to implement the map processor.</p>
        </div>
        
        {/* Placeholder for the future HTML5 Canvas Grid */}
        <canvas id="city-canvas" className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"></canvas>
      </div>
    </motion.div>
  );
}