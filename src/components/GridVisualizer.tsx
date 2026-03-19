"use client";

import { motion } from "framer-motion";
import { Maximize2, Download, Map } from "lucide-react";
import MapProcessor from "./MapProcessor";
import { usePlanStore } from "@/store/usePlanStore";
import InteractiveGrid from "./InteractiveGrid";
import ZoningWizard from "./ZoningWizard";

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
      <div className="flex-1 relative flex gap-6">
        {!hasGridData ? (
          <div className="flex-1">
            <MapProcessor />
          </div>
        ) : (
          <>
            {/* The Visual Grid goes here */}
            <div className="flex-1 bg-surface rounded-2xl border border-slate-200 shadow-soft p-6 flex flex-col">
               {/* Check if amenities have been placed yet to decide what to show */}
               {Object.values(usePlanStore.getState().gridData).some(c => c.type === 'amenity') ? (
                 <InteractiveGrid />
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <Map className="mx-auto text-slate-300 mb-4" size={48} />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Topography Ready</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                      Configure your demographic requirements in the panel on the right. Once locked, the algorithm will place the infrastructure here.
                    </p>
                 </div>
               )}
            </div>

            {/* The Configuration Wizard */}
            <div className="w-[400px] shrink-0">
              <ZoningWizard />
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}