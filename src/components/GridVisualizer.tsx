"use client";

import { motion } from "framer-motion";
import { Maximize2, Download, CheckCircle2 } from "lucide-react";
import MapProcessor from "./MapProcessor";
import { usePlanStore } from "@/store/usePlanStore";

export default function GridVisualizer() {
  // Check if gridData has been populated to switch views
  const hasGridData = usePlanStore((state) => Object.keys(state.gridData).length > 0);

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="flex-1 h-full p-6 flex flex-col"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">City Topography</h2>
          <p className="text-slate-500">
            {hasGridData ? "Grid successfully extracted. Ready for zoning." : "Upload an outline map to extract a usable grid."}
          </p>
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

      {/* Main Container */}
      <div className="flex-1 relative">
        {!hasGridData ? (
          <MapProcessor />
        ) : (
          <div className="flex flex-col h-full bg-surface rounded-2xl border border-slate-200 shadow-soft p-6 items-center justify-center text-center">
            {/* Phase 5 will replace this placeholder with the interactive React visualizer */}
            <div className="text-success mb-4">
              <CheckCircle2 size={48} className="mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Grid Extracted Successfully!</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              The internal state is now holding the extracted, purely active blocks. 
              We are ready to move to Phase 3 to build the Configuration Wizard.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}