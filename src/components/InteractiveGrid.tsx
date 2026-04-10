// src/components/InteractiveGrid.tsx
"use client";

import { useState } from "react";
import { usePlanStore, GridCell } from "@/store/usePlanStore";
import { AMENITY_CONFIG, getBlockAreaHectares } from "@/lib/planningMath";
import { Map, TrendingUp } from "lucide-react";

export default function InteractiveGrid({ editMode = false }: { editMode?: boolean }) {
  const { gridSize, gridData, moveAmenity, blockSizeMeters, toggleBlockAvailability, isGridLocked } = usePlanStore();
  const [viewMode, setViewMode] = useState<"zoning" | "heatmap">("zoning");
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const cells = Object.values(gridData);
  if (cells.length === 0) return null;
  const activeCellCount = cells.filter((c) => c.type !== "disabled").length;
  const modeledAreaHectares = activeCellCount * getBlockAreaHectares(blockSizeMeters);

  // Find max land value for heatmap scaling
  const maxLandValue = Math.max(1, ...cells.map(c => c.landValue || 0));

  const handleDragStart = (e: React.DragEvent, cellKey: string) => {
    setDraggedKey(cellKey);
    e.dataTransfer.setData("cellKey", cellKey);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedKey(null);
    setDragOverKey(null);
  };

  const handleDragEnter = (e: React.DragEvent, cellKey: string, type: string) => {
    e.preventDefault();
    if (draggedKey) setDragOverKey(cellKey);
  };

  const handleDragOver = (e: React.DragEvent, type: string) => {
    e.preventDefault(); // Necessary to allow dropping
    if (type !== "residential") {
      e.dataTransfer.dropEffect = "none";
    } else {
      e.dataTransfer.dropEffect = "move";
    }
  };

  const handleDragLeave = (e: React.DragEvent, cellKey: string) => {
    if (dragOverKey === cellKey) setDragOverKey(null);
  };

  const handleDrop = (e: React.DragEvent, targetKey: string, type: string) => {
    e.preventDefault();
    setDraggedKey(null);
    setDragOverKey(null);

    if (type !== "residential") return;

    const sourceKey = e.dataTransfer.getData("cellKey");
    if (sourceKey && sourceKey !== targetKey) {
      moveAmenity(sourceKey, targetKey);
    }
  };

  const handleCellClick = (cellKey: string) => {
    if (!editMode || isGridLocked) return;
    toggleBlockAvailability(cellKey);
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
    if (cell.type === "residential") return { backgroundColor: "#fef08a", borderColor: "#fde047" }; // Yellow for residential

    if (cell.type === "amenity" && cell.amenityType) {
      const config = AMENITY_CONFIG[cell.amenityType as keyof typeof AMENITY_CONFIG];
      return { backgroundColor: config?.color || "#cbd5e1", borderColor: "rgba(0,0,0,0.1)", color: "white" };
    }

    return { backgroundColor: "#ffffff", borderColor: "#e2e8f0" };
  };

  return (
    <div className="flex flex-col h-full w-full relative z-10 w-full">
      <div className="flex-1 flex items-center justify-center p-2 relative h-full w-full">
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center bg-white/90 backdrop-blur-md rounded-full shadow-xl shadow-slate-200/50 p-1.5 border border-white/50 z-30 pointer-events-auto">
          <button
            onClick={() => setViewMode("zoning")}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${viewMode === "zoning" ? "bg-primary text-white shadow-md" : "text-slate-500 hover:bg-slate-100"}`}
          >
            Zoning Map
          </button>
          {!editMode && (
            <button
              onClick={() => setViewMode("heatmap")}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${viewMode === "heatmap" ? "bg-error text-white shadow-md" : "text-slate-500 hover:bg-slate-100"}`}
            >
              Economics Heatmap
            </button>
          )}
        </div>

        <div className="relative w-full max-w-3xl aspect-square z-10 pointer-events-auto">
          <div
            className="grid gap-0 bg-slate-200 p-0 rounded-lg shadow-inner w-full h-full"
            style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
          >
            {cells.map((cell) => {
              const cellKey = `${cell.x},${cell.y}`;
              const isDraggable = !editMode && cell.type === "amenity";
              const appearance = getCellAppearance(cell);
              const amenityConfig = cell.amenityType ? AMENITY_CONFIG[cell.amenityType as keyof typeof AMENITY_CONFIG] : null;

              return (
                <div
                  key={cellKey}
                  draggable={isDraggable}
                  onDragStart={(e) => handleDragStart(e, cellKey)}
                  onDragEnd={handleDragEnd}
                  onDragEnter={(e) => handleDragEnter(e, cellKey, cell.type)}
                  onDragOver={(e) => handleDragOver(e, cell.type)}
                  onDragLeave={(e) => handleDragLeave(e, cellKey)}
                  onDrop={(e) => handleDrop(e, cellKey, cell.type)}
                  onClick={() => handleCellClick(cellKey)}
                  className={`relative flex items-center justify-center aspect-square transition-colors
                  ${isDraggable ? "cursor-grab active:cursor-grabbing shadow-sm z-20" : ""}
                  ${editMode && !isGridLocked && (cell.type === "residential" || cell.type === "disabled") ? "cursor-pointer" : ""}
                  ${draggedKey === cellKey ? "opacity-40" : ""}
                  ${dragOverKey === cellKey && cell.type === "residential" ? "bg-secondary-fixed/80 scale-105 z-30 shadow-lg" : ""}
                  ${dragOverKey === cellKey && cell.type !== "residential" ? "bg-error-container/80 z-30" : ""}
                `}
                  style={dragOverKey === cellKey ? {} : appearance}
                  title={cell.type === "amenity" ? amenityConfig?.name : `${cell.type.toUpperCase()} | Value: ₹${cell.landValue?.toLocaleString() || 0}`}
                >
                  {/* Icon rendering for amenities */}
                  {viewMode === "zoning" && cell.type === "amenity" && amenityConfig && (
                    <span className="text-[10px] md:text-xl drop-shadow-md select-none pointer-events-none">
                      {amenityConfig.icon}
                    </span>
                  )}

                  {editMode && cell.type === "disabled" && (
                    <span className="text-[9px] text-slate-400 font-bold select-none">❌</span>
                  )}

                  {/* Heatmap tooltip overlay */}
                  {viewMode === "heatmap" && cell.type !== "disabled" && (
                    <span className="text-[8px] md:text-[10px] font-bold text-slate-900/50 select-none pointer-events-none">
                      {(cell.accessibilityScore || 0).toFixed(1)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {editMode && (
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-slate-500 font-semibold bg-white/80 px-4 py-2 rounded-full shadow-sm z-30">
            Click any residential/blocked cell to toggle availability
          </p>
        )}
      </div>
    </div>
  );
}
