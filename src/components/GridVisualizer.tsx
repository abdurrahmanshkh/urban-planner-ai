// src/components/GridVisualizer.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Download, Loader2, Layers } from "lucide-react";

import ZoningWizard from "./ZoningWizard";
import ProjectInit from "./ProjectInit";
import InteractiveGrid from "./InteractiveGrid";
import { usePlanStore } from "@/store/usePlanStore";
import { AMENITY_CONFIG, calculateIdealAmenities, getBlockAreaHectares } from "@/lib/planningMath";
import type { GridCell } from "@/store/usePlanStore";
import { generatePDFReport } from "@/lib/pdfExport";

const getExportCellAppearance = (cell: GridCell) => {
  if (cell.type === "disabled") return { backgroundColor: "#f1f5f9", borderColor: "#e2e8f0", color: "#475569" };
  if (cell.type === "road") return { backgroundColor: "#64748b", borderColor: "#475569", color: "#ffffff" };
  if (cell.type === "residential") return { backgroundColor: "#fef08a", borderColor: "#fde047", color: "#334155" };

  if (cell.type === "amenity" && cell.amenityType) {
    const config = AMENITY_CONFIG[cell.amenityType as keyof typeof AMENITY_CONFIG];
    return { backgroundColor: config?.color || "#cbd5e1", borderColor: "#cbd5e1", color: "#ffffff" };
  }

  return { backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#475569" };
};

export default function GridVisualizer() {
  const {
    gridSize,
    gridData,
    isGenerating,
    population,
    totalLandValue,
    blockSizeMeters,
    landAreaHectares,
    computedDevelopableAreaHectares,
    roadAreaHectares,
    roadNetwork,
    amenities,
  } = usePlanStore();
  const [isExporting, setIsExporting] = useState(false);

  const hasGridData = Object.keys(gridData).length > 0;
  const hasGeneratedPlan = Object.values(gridData).some((c) => c.type === "amenity");
  const sortedCells = Object.values(gridData).sort((a, b) => (a.y - b.y) || (a.x - b.x));
  const cells = Object.values(gridData);
  const activeCells = cells.filter((cell) => cell.type !== "disabled");
  const modeledAreaHectares = activeCells.length * getBlockAreaHectares(blockSizeMeters);
  const totalValue = activeCells.reduce((sum, cell) => sum + (cell.landValue || 0), 0);
  const avgValue = activeCells.length ? totalValue / activeCells.length : 0;
  const avgAccessibility = activeCells.length
    ? activeCells.reduce((sum, cell) => sum + (cell.accessibilityScore || 0), 0) / activeCells.length
    : 0;
  const amenityActualCounts = cells.reduce<Record<string, number>>((acc, cell) => {
    if (cell.type === "amenity" && cell.amenityType) {
      acc[cell.amenityType] = (acc[cell.amenityType] || 0) + 1;
    }
    return acc;
  }, {});
  const idealAmenities = calculateIdealAmenities(population, gridSize);
  const roadRows = Object.values(
    Object.values(roadNetwork).reduce<Record<string, { roadKey: string; className: string; lanes: number; width: number; segments: number }>>((acc, road) => {
      const key = road.lineKey;
      if (!acc[key]) {
        acc[key] = {
          roadKey: key,
          className: road.roadClass,
          lanes: road.laneCount,
          width: road.widthMeters,
          segments: 1,
        };
      } else {
        acc[key].segments += 1;
      }
      return acc;
    }, {})
  ).sort((a, b) => a.roadKey.localeCompare(b.roadKey, undefined, { numeric: true }));

  const exportToPDF = async () => {
    if (!hasGeneratedPlan) return;
    setIsExporting(true);

    try {
      await generatePDFReport({
        elementId: "pdf-export-grid",
        population,
        gridSize,
        modeledAreaHectares,
        computedDevelopableAreaHectares,
        roadAreaHectares,
        avgAccessibility,
        avgValue,
        totalLandValue,
        amenityActualCounts,
        idealAmenities,
        roadRows,
        amenities,
        landAreaHectares,
        blockSizeMeters,
        roadNetwork
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex-1 min-h-0 p-4 md:p-6 flex flex-col relative overflow-y-auto"
    >
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4 md:mb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-blue-700 mb-2">
            <Layers size={14} />
            <span className="text-xs font-semibold tracking-wide uppercase">UrbanPlan AI</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">City Topography</h2>
          <p className="text-slate-500">
            {hasGeneratedPlan
              ? "Interactive municipal zoning complete."
              : "Upload an outline or configure parameters."}
          </p>
        </div>
        <div className="flex gap-3">
          {hasGridData && (
            <button
              onClick={exportToPDF}
              disabled={!hasGeneratedPlan || isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              {isExporting ? "Exporting..." : "Export PDF"}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 relative flex flex-col 2xl:flex-row gap-6 min-h-0">
        {!hasGridData ? (
          <div className="flex-1 min-h-[300px]">
            <ProjectInit />
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-[300px] glass-card rounded-2xl flex flex-col relative overflow-hidden p-0">
              <AnimatePresence>
                {isGenerating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
                  >
                    <Loader2 size={48} className="text-primary animate-spin mb-4" />
                    <h3 className="text-xl font-bold text-slate-800">Crunching Municipal Data...</h3>
                    <p className="text-slate-500">Running constraint satisfaction and A* routing.</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {hasGeneratedPlan ? (
                <div
                  id="export-grid"
                  className="flex-1 w-full h-full flex flex-col items-center justify-center p-4"
                >
                  <InteractiveGrid />
                </div>
              ) : (
                <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-4">
                  <InteractiveGrid editMode />
                </div>
              )}
            </div>

            <div className="w-full 2xl:w-[400px] 2xl:shrink-0 max-h-[72vh] 2xl:max-h-none">
              <ZoningWizard />
            </div>
          </>
        )}
      </div>

      {hasGeneratedPlan && (
        <div
          style={{
            position: "fixed",
            left: "-10000px",
            top: 0,
            width: "1024px",
            padding: "24px",
            backgroundColor: "#ffffff",
            color: "#0f172a",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          <div id="pdf-export-grid" style={{ backgroundColor: "#ffffff" }}>
            <h2 style={{ margin: "0 0 10px", fontSize: "24px", fontWeight: 700 }}>City Topography</h2>
            <p style={{ margin: "0 0 18px", fontSize: "14px", color: "#475569" }}>Generated zoning layout snapshot.</p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${Math.max(1, gridSize)}, minmax(0, 1fr))`,
                gap: "2px",
                backgroundColor: "#e2e8f0",
                padding: "2px",
                borderRadius: "10px",
              }}
            >
              {sortedCells.map((cell) => {
                const cellKey = `${cell.x},${cell.y}`;
                const appearance = getExportCellAppearance(cell);
                const amenityConfig = cell.amenityType
                  ? AMENITY_CONFIG[cell.amenityType as keyof typeof AMENITY_CONFIG]
                  : null;

                return (
                  <div
                    key={cellKey}
                    style={{
                      ...appearance,
                      width: "100%",
                      aspectRatio: "1 / 1",
                      border: `1px solid ${appearance.borderColor}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                    }}
                  >
                    {cell.type === "amenity" && amenityConfig ? amenityConfig.icon : ""}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
