// src/components/ZoningWizard.tsx
"use client";

import { useEffect, useState } from "react";
import { Users, IndianRupee, Map as MapIcon, ShieldCheck } from "lucide-react";
import { usePlanStore } from "@/store/usePlanStore";
import { AMENITY_CONFIG, calculateIdealAmenities } from "@/lib/planningMath";

export default function ZoningWizard() {
  const { 
    gridSize, population, totalLandValue, amenities, 
    setPopulation, setTotalLandValue, setAmenityCount, 
    setGridLocked, isGridLocked, generateCityPlan
  } = usePlanStore();

  const [idealAmenities, setIdealAmenities] = useState<Record<string, number>>({});

  // Instantly recalculate ideal amenities when population or grid size changes
  useEffect(() => {
    const ideals = calculateIdealAmenities(population, gridSize);
    setIdealAmenities(ideals);
    
    // Auto-fill the user's selected amenities if they haven't touched them yet
    if (Object.values(amenities).every(v => v === 0)) {
      Object.entries(ideals).forEach(([key, val]) => setAmenityCount(key, val));
    }
  }, [population, gridSize]);

  // Format INR nicely
  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="flex flex-col h-full bg-surface rounded-2xl border border-slate-200 shadow-soft overflow-hidden p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ShieldCheck className="text-primary" />
          Zoning Parameters
        </h2>
        <p className="text-slate-500 text-sm mt-1">Define demographics to generate algorithmic recommendations.</p>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto pr-2">
        {/* Input: Expected Population */}
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
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
          />
        </div>

        {/* Input: Total Land Value */}
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
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
          />
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Formatted: {formatINR(totalLandValue)}
          </p>
        </div>

        <hr className="border-slate-100" />

        {/* Dynamic Sliders */}
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
                    <span className={`text-sm font-bold px-2 py-1 rounded-md ${deficit ? 'bg-red-100 text-red-700' : 'bg-success-light text-success'}`}>
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
                    className="w-full accent-primary"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lock Action */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <button 
          onClick={() => {
            const newLockedState = !isGridLocked;
            setGridLocked(newLockedState);
            if (newLockedState) {
              // Trigger the pure JS algorithm instantly!
              generateCityPlan();
            }
          }}
          className={`w-full py-3 rounded-xl font-bold transition-all shadow-md flex justify-center items-center gap-2 ${
            isGridLocked 
              ? 'bg-slate-200 text-slate-700 hover:bg-slate-300 shadow-none' 
              : 'bg-primary text-white hover:bg-primary-hover shadow-primary/20'
          }`}
        >
          {isGridLocked ? "Unlock Parameters" : "Lock & Generate Plan ⚡"}
        </button>
      </div>
    </div>
  );
}