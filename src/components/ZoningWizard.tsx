"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Users, IndianRupee, ShieldCheck, AlertTriangle } from "lucide-react";
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
    setGridLocked,
    isGridLocked,
    generateCityPlan,
  } = usePlanStore();

  const idealAmenities = useMemo(() => calculateIdealAmenities(population, gridSize), [population, gridSize]);

  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  };

  const effectiveLandAreaHectares = computedDevelopableAreaHectares > 0 ? computedDevelopableAreaHectares : landAreaHectares;
  const MAX_POPULATION = Math.round(effectiveLandAreaHectares * TARGET_MAX_PEOPLE_PER_HECTARE);
  const isOverpopulated = population > MAX_POPULATION;

  // BUG FIX: Added max-h-full and ensured the parent div is a flex column
  return (
    <div className="flex flex-col h-full max-h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
      <div className="mb-6 shrink-0">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ShieldCheck className="text-primary" />
          Zoning Parameters
        </h2>
        <p className="text-slate-500 text-sm mt-1">Define demographics to generate algorithmic recommendations.</p>
      </div>

      {/* BUG FIX: Added min-h-0 to allow flex scrolling */}
      <div className="space-y-6 flex-1 overflow-y-auto pr-2 min-h-0 pb-4 custom-scroll">
        <div>
          <Tooltip content="The target demographic size for this development. Cannot exceed maximum density constraints." position="top">
            <label className="block w-max text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2 cursor-help">
              <Users size={16} className="text-slate-400" /> Expected Population
            </label>
          </Tooltip>
          <input
            type="number"
            min="1000"
            step="1000"
            value={population}
            disabled={isGridLocked}
            onChange={(e) => setPopulation(Number(e.target.value))}
            className={`w-full px-4 py-3 rounded-xl border outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400 ${
              isOverpopulated ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary-light'
            }`}
          />
          {isOverpopulated && (
            <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1">
              <AlertTriangle size={12} /> Exceeds density cap of {TARGET_MAX_PEOPLE_PER_HECTARE} people/hectare. Max allowed is {MAX_POPULATION.toLocaleString()}.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Tooltip content="Calculated or manual bounds of the municipality in hectares. Validates limits." position="top">
              <label className="block w-max text-sm font-semibold text-slate-700 mb-2 cursor-help">Total Land Area (ha)</label>
            </Tooltip>
            <input
              type="number"
              min="1"
              step="1"
              value={landAreaHectares}
              disabled={isGridLocked}
              onChange={(e) => setLandAreaHectares(Math.max(1, Number(e.target.value)))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
            />
            <p className="text-xs text-slate-500 mt-2">Grid count auto-scales from this area after map extraction.</p>
          </div>

          <div>
            <Tooltip content={`Length of one side of a generic city block.\nRecommended: ${IDEAL_BLOCK_SIZE_METERS}m for walkability.\nMax: ${MAX_BLOCK_SIZE_METERS}m`} position="top">
              <label className="block w-max text-sm font-semibold text-slate-700 mb-2 cursor-help">Block Size (meters)</label>
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
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
            />
            <p className="text-xs text-slate-500 mt-2">Recommended default: {IDEAL_BLOCK_SIZE_METERS}m (walkable urban block range).</p>
          </div>
        </div>

        <div>
          <Tooltip content="Current total baseline land value. Determines plot-level algorithmic valuation." position="top">
            <label className="block w-max text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2 cursor-help">
              <IndianRupee size={16} className="text-slate-400" /> Total Base Land Value (₹)
            </label>
          </Tooltip>
          <input
            type="number"
            min="1000000"
            step="1000000"
            value={totalLandValue}
            disabled={isGridLocked}
            onChange={(e) => setTotalLandValue(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
          />
          <p className="text-xs text-slate-500 mt-2 font-medium">Formatted: {formatINR(totalLandValue)}</p>
        </div>

        <hr className="border-slate-100" />

        <div>
          <Tooltip content="The minimum count of civic amenities needed based on the URDPFI guidelines for the set population." position="top">
            <h3 className="text-sm w-max font-bold text-slate-800 uppercase tracking-wider mb-4 cursor-help">Infrastructure Requirements</h3>
          </Tooltip>
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
                    className="w-full accent-primary"
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
                : 'bg-primary text-white hover:bg-primary-hover shadow-md shadow-primary/20'
          }`}
        >
          {isGridLocked ? "Unlock Parameters" : "Lock & Generate Plan ⚡"}
        </button>
      </div>
    </div>
  );
}
