// src/components/InteractiveGrid.tsx
"use client";

import { useState } from "react";
import { usePlanStore, GridCell } from "@/store/usePlanStore";
import { AMENITY_CONFIG } from "@/lib/planningMath";
import { Map, TrendingUp } from "lucide-react";

export default function InteractiveGrid() {
  const { gridSize, gridData, moveAmenity } = usePlanStore();
  const [viewMode, setViewMode] = useState<"zoning" | "heatmap">("zoning");

  const cells = Object.values(gridData);
  if (cells.length === 0) return null;

  // Find max land value for heatmap scaling
  const maxLandValue = Math.max(...cells.map(c => c.landValue || 0));

  const handleDragStart = (e: React.DragEvent, cellKey: string) => {
    e.dataTransfer.setData("cellKey", cellKey);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    const sourceKey = e.dataTransfer.getData("cellKey");
    if (sourceKey && sourceKey !== targetKey) {
      moveAmenity(sourceKey, targetKey);
    }
  };

  const getCellAppearance = (cell: GridCell) => {
    // Heatmap Mode
    if (viewMode === "heatmap" && cell.type !== "disabled") {
      const intensity = cell.landValue ? cell.landValue / maxLandValue : 0;
      // Interpolate from light yellow to deep red based on land value
      return {
        backgroundColor: `rgba(239, 68, 68, ${intensity})`,
        borderColor: `rgba(239, 68, 68, ${intensity + 0.2})`,
      };
    }

    // Zoning Mode
    if (cell.type === "disabled") return { backgroundColor: "#f1f5f9", borderColor: "#e2e8f0" };
    if (cell.type === "road") return { backgroundColor: "#64748b", borderColor: "#475569" }; // Slate for roads
    if (cell.type === "residential") return { backgroundColor: "#fef08a", borderColor: "#fde047" }; // Yellow for residential
    
    if (cell.type === "amenity" && cell.amenityType) {
      const config = AMENITY_CONFIG[cell.amenityType as keyof typeof AMENITY_CONFIG];
      return { backgroundColor: config?.color || "#cbd5e1", borderColor: "rgba(0,0,0,0.1)", color: "white" };
    }
    
    return { backgroundColor: "#ffffff", borderColor: "#e2e8f0" };
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* View Toggle Controls */}
      <div className="flex justify-between items-center mb-4 bg-slate-50 p-2 rounded-xl border border-slate-200">
        <span className="text-sm font-bold text-slate-600 px-2 uppercase tracking-wide">Visualization</span>
        <div className="flex gap-2">
          <button 
            onClick={() => setViewMode("zoning")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === "zoning" ? "bg-white shadow-sm text-primary border border-slate-200" : "text-slate-500 hover:bg-slate-200/50 border border-transparent"}`}
          >
            <Map size={16} /> Zoning Map
          </button>
          <button 
            onClick={() => setViewMode("heatmap")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === "heatmap" ? "bg-white shadow-sm text-red-500 border border-slate-200" : "text-slate-500 hover:bg-slate-200/50 border border-transparent"}`}
          >
            <TrendingUp size={16} /> Economics Heatmap
          </button>
        </div>
      </div>

      {/* The Grid */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-2">
        <div 
          className="grid gap-[2px] bg-slate-200 p-[2px] rounded-lg shadow-inner w-full max-w-[600px] aspect-square"
          style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
        >
          {cells.map((cell) => {
            const cellKey = `${cell.x},${cell.y}`;
            const isDraggable = cell.type === "amenity";
            const appearance = getCellAppearance(cell);
            const amenityConfig = cell.amenityType ? AMENITY_CONFIG[cell.amenityType as keyof typeof AMENITY_CONFIG] : null;

            return (
              <div
                key={cellKey}
                draggable={isDraggable}
                onDragStart={(e) => handleDragStart(e, cellKey)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, cellKey)}
                className={`relative flex items-center justify-center border aspect-square transition-all 
                  ${isDraggable ? "cursor-grab active:cursor-grabbing hover:brightness-110 shadow-sm z-10" : ""}
                  ${cell.type === "residential" ? "hover:bg-yellow-200/80 transition-colors" : ""}
                `}
                style={appearance}
                title={cell.type === "amenity" ? amenityConfig?.name : `${cell.type.toUpperCase()} | Value: ₹${cell.landValue?.toLocaleString() || 0}`}
              >
                {/* Icon rendering for amenities */}
                {viewMode === "zoning" && cell.type === "amenity" && amenityConfig && (
                  <span className="text-sm md:text-xl drop-shadow-md select-none pointer-events-none">
                    {amenityConfig.icon}
                  </span>
                )}
                
                {/* Heatmap tooltip overlay */}
                {viewMode === "heatmap" && cell.type !== "disabled" && cell.type !== "road" && (
                  <span className="text-[8px] md:text-[10px] font-bold text-slate-900/50 select-none pointer-events-none">
                    {(cell.accessibilityScore || 0).toFixed(1)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}