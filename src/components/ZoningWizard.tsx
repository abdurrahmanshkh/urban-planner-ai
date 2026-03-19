"use client";

import { useEffect, useState } from "react";
import { Users, IndianRupee, ShieldCheck, AlertTriangle } from "lucide-react";
import { usePlanStore } from "@/store/usePlanStore";
import { AMENITY_CONFIG, calculateIdealAmenities } from "@/lib/planningMath";

export default function ZoningWizard() {
  const { 
    gridSize, population, totalLandValue, amenities, 
    setPopulation, setTotalLandValue, setAmenityCount, 
    setGridLocked, isGridLocked, generateCityPlan
  } = usePlanStore();

  const [idealAmenities, setIdealAmenities] = useState<Record<string, number>>({});

  useEffect(() => {
    const ideals = calculateIdealAmenities(population, gridSize);
    setIdealAmenities(ideals);
    
    if (Object.values(amenities).every(v => v === 0)) {
      Object.entries(ideals).forEach(([key, val]) => setAmenityCount(key, val));
    }
  }, [population, gridSize]);

  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  };

  const activeCellsCount = Object.values(usePlanStore.getState().gridData).filter(c => c.type !== 'disabled').length;
  const usableCells = activeCellsCount > 0 ? activeCellsCount : gridSize * gridSize; 
  const MAX_POPULATION = usableCells * 1500;
  const isOverpopulated = population > MAX_POPULATION;

  // BUG FIX: Added max-h-full and ensured the parent div is a flex column
  return (
    <div className="flex flex-col h-full max-h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
      <div className="mb-6 shrink-0">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ShieldCheck className="text-indigo-600" />
          Zoning Parameters
        </h2>
        <p className="text-slate-500 text-sm mt-1">Define demographics to generate algorithmic recommendations.</p>
      </div>

      {/* BUG FIX: Added min-h-0 to allow flex scrolling */}
      <div className="space-y-6 flex-1 overflow-y-auto pr-2 min-h-0 pb-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Users size={16} className="text-slate-400" /> Expected Population
          </label>
          <input
            type="number"
            min="1000"
            step="1000"
            value={population}
            disabled={isGridLocked}
            onChange={(e) => setPopulation(Number(e.target.value))}
            className={`w-full px-4 py-3 rounded-xl border outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400 ${
              isOverpopulated ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
            }`}
          />
          {isOverpopulated && (
            <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1">
              <AlertTriangle size={12} /> Exceeds maximum density! Max allowed is {MAX_POPULATION.toLocaleString()}.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <IndianRupee size={16} className="text-slate-400" /> Total Base Land Value (₹)
          </label>
          <input
            type="number"
            min="1000000"
            step="1000000"
            value={totalLandValue}
            disabled={isGridLocked}
            onChange={(e) => setTotalLandValue(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
          />
          <p className="text-xs text-slate-500 mt-2 font-medium">Formatted: {formatINR(totalLandValue)}</p>
        </div>

        <hr className="border-slate-100" />

        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Infrastructure Requirements</h3>
          <div className="space-y-5">
            {Object.values(AMENITY_CONFIG).map((amenity) => {
              const ideal = idealAmenities[amenity.id] || 0;
              const current = amenities[amenity.id] || 0;
              const deficit = current < ideal;

              return (
                <div key={amenity.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-slate-700 flex items-center gap-2">
                      <span>{amenity.icon}</span> {amenity.name}
                    </span>
                    <span className={`text-sm font-bold px-2 py-1 rounded-md ${deficit ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {current} / {ideal} Ideal
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(10, ideal * 2)}
                    value={current}
                    disabled={isGridLocked}
                    onChange={(e) => setAmenityCount(amenity.id, Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 shrink-0">
        <button 
          disabled={isOverpopulated}
          onClick={async () => {
            if (isGridLocked) {
              setGridLocked(false);
            } else {
              setGridLocked(true);
              await generateCityPlan();
            }
          }}
          // BUG FIX: Removed reliance on custom config, explicitly declared bg-indigo-600 and text-white
          className={`w-full py-3 rounded-xl font-bold transition-all flex justify-center items-center gap-2 ${
            isOverpopulated 
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : isGridLocked 
                ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20'
          }`}
        >
          {isGridLocked ? "Unlock Parameters" : "Lock & Generate Plan ⚡"}
        </button>
      </div>
    </div>
  );
}