"use client";

import { usePlanStore, GridCell } from "@/store/usePlanStore";
import { MIN_BLOCK_SIZE_METERS, MAX_BLOCK_SIZE_METERS, IDEAL_BLOCK_SIZE_METERS, getBlockAreaHectares } from "@/lib/planningMath";
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
    <div className="max-w-6xl mx-auto px-8 py-12 flex flex-col min-h-screen">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-on-surface tracking-tight mb-3 font-headline flex items-center gap-4">
          <span className="material-symbols-outlined text-4xl text-secondary">grid_4x4</span> 
          Manual Grid Configuration
        </h1>
        <p className="text-on-surface-variant text-lg">Define the extents of your city block layout explicitly using our procedural engine.</p>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-10 min-h-0 bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 shadow-sm relative overflow-hidden">
        
        {/* Settings Panel */}
        <div className="w-full md:w-1/2 space-y-8 relative z-10">
          
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-sm font-semibold text-slate-700 font-headline">Grid Resolution</span>
              <span className="text-[12px] px-3 py-1 bg-secondary/10 text-secondary rounded-full font-bold uppercase tracking-tighter shadow-sm">{size} × {size}</span>
            </div>
            <input
              type="range"
              min="10"
              max="30"
              step="1"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full accent-secondary h-2 bg-slate-200 rounded-full appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
              <span>10x10</span>
              <span>20x20</span>
              <span>30x30</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-semibold text-slate-700 font-headline">Block Edge Size (m)</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ideal: {IDEAL_BLOCK_SIZE_METERS}m</span>
            </div>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined transition-colors group-focus-within:text-secondary group-focus-within:font-bold">straighten</span>
              <input
                type="number"
                min={MIN_BLOCK_SIZE_METERS}
                max={MAX_BLOCK_SIZE_METERS}
                step="5"
                value={blockSizeMeters}
                onChange={(e) => setBlockSizeMeters(Math.max(MIN_BLOCK_SIZE_METERS, Math.min(MAX_BLOCK_SIZE_METERS, Number(e.target.value))))}
                className="w-full bg-surface-container-low border-2 border-transparent focus:border-secondary focus:ring-0 rounded-xl pl-12 pr-4 py-4 text-on-surface font-semibold text-lg transition-all"
              />
            </div>
          </div>

          <div className="p-6 bg-surface-container-low rounded-xl border border-outline-variant/20 relative shadow-inner">
             <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Estimated Developable Area</div>
             <div className="text-4xl font-black text-on-surface tracking-tighter">
              {calculateArea(size, blockSizeMeters).toFixed(1)} 
              <span className="text-lg font-bold text-slate-400 ml-2">hectares</span>
            </div>
          </div>

        </div>

        {/* Visualizer Panel */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-surface-container-high/30 rounded-2xl border border-dashed border-outline-variant/30 relative">
          <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-40"></div>
          
          <div className="w-full max-w-sm aspect-square bg-slate-300 grid gap-[1px] p-[2px] shadow-lg rounded-xl relative z-10" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
            {Array.from({ length: size * size }).map((_, i) => (
              <div key={i} className="bg-white/95 w-full h-full rounded-sm transform transition-all hover:scale-125 hover:bg-secondary hover:z-10 relative cursor-crosshair shadow-sm" />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button 
          onClick={handleGenerate}
          className="px-8 py-4 bg-gradient-to-r from-secondary to-[#005236] text-white font-bold rounded-xl shadow-lg shadow-secondary/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-3 text-lg"
        >
          Initialize Layout Canvas <span className="material-symbols-outlined text-xl">architecture</span>
        </button>
      </div>
    </div>
  );
}
