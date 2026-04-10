"use client";

import { usePlanStore, GridCell } from "@/store/usePlanStore";
import { MIN_BLOCK_SIZE_METERS, MAX_BLOCK_SIZE_METERS, IDEAL_BLOCK_SIZE_METERS, getBlockAreaHectares } from "@/lib/planningMath";
import { CheckCircle2, LayoutGrid, Ruler, Maximize } from "lucide-react";
import { useState } from "react";

export default function ManualGridBuilder() {
  const { setGridData, blockSizeMeters, setBlockSizeMeters, setLandAreaHectares } = usePlanStore();
  const [size, setSize] = useState(15);

  const calculateArea = (gridSize: number, blockMeters: number) => {
    return gridSize * gridSize * getBlockAreaHectares(blockMeters);
  };

  const handleGenerate = () => {
    const newGrid: Record<string, GridCell> = {};
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        newGrid[`${x},${y}`] = { x, y, type: 'residential' };
      }
    }
    const computedArea = calculateArea(size, blockSizeMeters);
    setLandAreaHectares(Math.round(computedArea));
    setGridData(size, newGrid, computedArea);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-white/50 p-6 shadow-soft overflow-hidden min-h-[460px]">
      <div className="mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
          <LayoutGrid className="text-indigo-500" />
          Manual Grid Configuration
        </h2>
        <p className="text-slate-500 text-sm mt-1">Define the extents of your city block layout explicitly.</p>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-8 min-h-0">
        <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scroll">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Maximize size={16} className="text-slate-400" /> Grid Resolution
              <span className="text-indigo-600 ml-auto bg-indigo-50 px-2 py-0.5 rounded-md text-xs">{size} × {size}</span>
            </label>
            <input
              type="range"
              min="10"
              max="30"
              step="1"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
              <span>10x10</span>
              <span>20x20</span>
              <span>30x30</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Ruler size={16} className="text-slate-400" /> Block Edge Size
            </label>
            <input
              type="number"
              min={MIN_BLOCK_SIZE_METERS}
              max={MAX_BLOCK_SIZE_METERS}
              step="5"
              value={blockSizeMeters}
              onChange={(e) => setBlockSizeMeters(Math.max(MIN_BLOCK_SIZE_METERS, Math.min(MAX_BLOCK_SIZE_METERS, Number(e.target.value))))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-700 font-medium"
            />
            <p className="text-xs text-slate-500 mt-2">Recommended: {IDEAL_BLOCK_SIZE_METERS}m.</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-100 rounded-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100/50 rounded-bl-full -mr-4 -mt-4 opacity-50 pointer-events-none" />
             <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 relative z-10">Estimated Area</div>
             <div className="text-2xl font-bold text-slate-800 relative z-10">{calculateArea(size, blockSizeMeters).toFixed(1)} <span className="text-sm font-medium text-slate-500">hectares</span></div>
          </div>
        </div>

        <div className="flex-1 hidden md:flex items-center justify-center p-4 bg-slate-50/50 rounded-xl border border-slate-100 relative">
          <div className="w-full max-w-[240px] aspect-square rounded-lg bg-slate-200 grid gap-[1px] p-[2px] shadow-inner" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
            {Array.from({ length: size * size }).map((_, i) => (
              <div key={i} className="bg-white/90 w-full h-full rounded-[1px] shadow-sm transform transition-all hover:scale-110 hover:bg-emerald-200 hover:z-10 relative cursor-crosshair" />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100">
        <button 
          onClick={handleGenerate}
          className="w-full md:w-auto px-6 py-3 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] md:ml-auto"
        >
          <CheckCircle2 size={18} /> Initialize Layout Canvas
        </button>
      </div>
    </div>
  );
}
