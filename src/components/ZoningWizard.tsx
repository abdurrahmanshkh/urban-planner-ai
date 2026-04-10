"use client";

import { useEffect, useMemo, useRef } from "react";
import Tooltip from "./ui/Tooltip";
import { usePlanStore } from "@/store/usePlanStore";
import {
  AMENITY_CONFIG,
  calculateIdealAmenities,
  IDEAL_BLOCK_SIZE_METERS,
  MAX_BLOCK_SIZE_METERS,
  MIN_BLOCK_SIZE_METERS,
  TARGET_MAX_PEOPLE_PER_HECTARE,
} from "@/lib/planningMath";

export default function ZoningWizard() {
  const { 
    gridSize,
    population,
    totalLandValue,
    amenities,
    landAreaHectares,
    blockSizeMeters,
    computedDevelopableAreaHectares,
    setPopulation,
    setTotalLandValue,
    setLandAreaHectares,
    setBlockSizeMeters,
    setAmenityCount,
    isGridLocked,
  } = usePlanStore();

  const didSeedAmenities = useRef(false);

  const idealAmenities = useMemo(() => calculateIdealAmenities(population, gridSize), [population, gridSize]);

  useEffect(() => {
    if (!didSeedAmenities.current && Object.values(amenities).every(v => v === 0)) {
      Object.entries(idealAmenities).forEach(([key, val]) => setAmenityCount(key, val));
      didSeedAmenities.current = true;
    }
  }, [amenities, idealAmenities, setAmenityCount]);


  const effectiveLandAreaHectares = computedDevelopableAreaHectares > 0 ? computedDevelopableAreaHectares : landAreaHectares;
  const MAX_POPULATION = Math.round(effectiveLandAreaHectares * TARGET_MAX_PEOPLE_PER_HECTARE);
  const isOverpopulated = population > MAX_POPULATION;

  return (
    <div className="flex flex-col h-full bg-surface-container-low p-6">
      <h2 className="text-xl font-semibold text-on-surface mb-6 flex items-center gap-2 font-headline shrink-0">
        <span className="material-symbols-outlined text-primary">auto_fix</span> Zoning Wizard
      </h2>

      <div className="space-y-8 flex-1 overflow-y-auto pr-2 custom-scroll min-h-0">
        
        {/* Inputs Section */}
        <div className="space-y-4">
          <div className="group">
            <Tooltip content="The target demographic size for this development. Cannot exceed maximum density constraints." position="top">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1 cursor-help">Population Target</label>
            </Tooltip>
            <div className="relative">
              <input
                type="number"
                min="1000"
                step="1000"
                value={population}
                disabled={isGridLocked}
                onChange={(e) => setPopulation(Number(e.target.value))}
                className={`w-full bg-surface-container-lowest border-2 rounded-xl px-4 py-3.5 text-on-surface font-medium transition-all ${
                  isOverpopulated ? 'border-error focus:border-error focus:ring-1 focus:ring-error focus:bg-error-container/20' : 'border-transparent focus:border-primary/40 focus:ring-0 focus:bg-white'
                } disabled:opacity-50`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined">group</span>
            </div>
            {isOverpopulated && (
              <p className="text-[10px] text-error mt-2 font-bold uppercase tracking-wider">
                Exceeds Cap ({MAX_POPULATION.toLocaleString()})
              </p>
            )}
          </div>

          <div className="group">
            <Tooltip content="Current total baseline land value. Determines algorithmic plot valuation." position="top">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1 cursor-help">Total Base Value</label>
            </Tooltip>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">₹</span>
              <input
                type="number"
                min="1000000"
                step="1000000"
                value={totalLandValue}
                disabled={isGridLocked}
                onChange={(e) => setTotalLandValue(Number(e.target.value))}
                className="w-full bg-surface-container-lowest border-2 border-transparent focus:border-primary/40 focus:ring-0 rounded-xl pl-9 pr-4 py-3.5 text-on-surface font-medium transition-all focus:bg-white disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="group">
              <Tooltip content="Calculated or manual bounds of the municipality in hectares. Validates limits." position="top">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 cursor-help">Total Area (ha)</label>
              </Tooltip>
              <input
                type="number"
                min="1"
                step="1"
                value={landAreaHectares}
                disabled={isGridLocked}
                onChange={(e) => setLandAreaHectares(Math.max(1, Number(e.target.value)))}
                className="w-full bg-surface-container-lowest border-transparent focus:border-primary/40 focus:ring-0 rounded-xl px-3 py-2 text-on-surface text-sm font-medium transition-all disabled:opacity-50"
              />
            </div>
            <div className="group">
              <Tooltip content={`Length of one side of a generic city block.\nRec: ${IDEAL_BLOCK_SIZE_METERS}m\nMax: ${MAX_BLOCK_SIZE_METERS}m`} position="top">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 cursor-help">Block Size (m)</label>
              </Tooltip>
              <input
                type="number"
                min={MIN_BLOCK_SIZE_METERS}
                max={MAX_BLOCK_SIZE_METERS}
                step="5"
                value={blockSizeMeters}
                disabled={isGridLocked}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setBlockSizeMeters(Math.max(MIN_BLOCK_SIZE_METERS, Math.min(MAX_BLOCK_SIZE_METERS, value)));
                }}
                className="w-full bg-surface-container-lowest border-transparent focus:border-primary/40 focus:ring-0 rounded-xl px-3 py-2 text-on-surface text-sm font-medium transition-all disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Amenity Sliders */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-4 border-b border-outline-variant/30 pb-2 font-headline">Amenity Distribution</h3>
          <div className="space-y-6">
            {Object.values(AMENITY_CONFIG).map((amenity) => {
              const ideal = idealAmenities[amenity.id] || 0;
              const current = amenities[amenity.id] || 0;
              const deficit = current < ideal;
              const exact = current === ideal;
              
              let pillClass = "bg-surface-container-highest text-slate-600";
              let pillText = "Neutral";
              let sliderClass = "accent-primary";
              
              if (deficit) {
                pillClass = "bg-error-container text-on-error-container";
                pillText = "Deficit";
                sliderClass = "accent-error";
              } else if (!exact && current > ideal) {
                pillClass = "bg-secondary-container text-on-secondary-container";
                pillText = "Surplus";
                sliderClass = "accent-secondary";
              } else if (exact) {
                pillClass = "bg-primary-container text-white";
                pillText = "Ideal";
              }

              return (
                <div key={amenity.id} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5"><span className="text-base">{amenity.icon}</span> {amenity.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${pillClass}`}>
                      {pillText}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(10, ideal * 2, current + 5)}
                    value={current}
                    disabled={isGridLocked}
                    onChange={(e) => setAmenityCount(amenity.id, Number(e.target.value))}
                    className={`w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer ${sliderClass}`}
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                    <span>Count: {current}</span>
                    <span>Ideal: {ideal}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
