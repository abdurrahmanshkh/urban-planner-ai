// src/components/GridVisualizer.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Download, Map, Loader2, Layers } from "lucide-react";

import ZoningWizard from "./ZoningWizard";
import MapProcessor from "./MapProcessor";
import InteractiveGrid from "./InteractiveGrid";
import { usePlanStore } from "@/store/usePlanStore";
import { AMENITY_CONFIG } from "@/lib/planningMath";
import type { GridCell } from "@/store/usePlanStore";

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
  const { gridSize, gridData, isGenerating, population, totalLandValue } = usePlanStore();
  const [isExporting, setIsExporting] = useState(false);

  const hasGridData = Object.keys(gridData).length > 0;
  const hasGeneratedPlan = Object.values(gridData).some((c) => c.type === "amenity");
  const sortedCells = Object.values(gridData).sort((a, b) => (a.y - b.y) || (a.x - b.x));

  const exportToPDF = async () => {
    if (!hasGeneratedPlan) return;
    setIsExporting(true);

    try {
      // Dynamically import heavy libraries to prevent Next.js SSR build errors
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const gridElement = document.getElementById("pdf-export-grid");
      if (!gridElement) throw new Error("Grid element not found");

      const canvas = await html2canvas(gridElement, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();

      // Header
      pdf.setFontSize(22);
      pdf.setTextColor(30, 41, 59);
      pdf.text("Municipal Urban Plan Report", 15, 20);

      pdf.setFontSize(12);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, 30);

      // Metrics
      pdf.setFontSize(14);
      pdf.setTextColor(30, 41, 59);
      pdf.text(`Target Population: ${population.toLocaleString()}`, 15, 45);
      pdf.text(`Base Land Value: INR ${(totalLandValue / 10000000).toFixed(2)} Cr`, 15, 53);

      // Grid Image
      pdf.addImage(imgData, "PNG", 15, 65, pdfWidth - 30, (pdfWidth - 30) * (canvas.height / canvas.width));

      // Footer
      pdf.setFontSize(10);
      pdf.text("Powered by UrbanPlan AI Engine", 15, 280);

      pdf.save(`UrbanPlan_Report_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error("PDF Export failed:", error);
      alert("Failed to export PDF. Please try again.");
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
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-indigo-700 mb-2">
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
          <button className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 shadow-sm">
            <Maximize2 size={18} />
          </button>
          <button
            onClick={exportToPDF}
            disabled={!hasGeneratedPlan || isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {isExporting ? "Exporting..." : "Export PDF"}
          </button>
        </div>
      </div>

      <div className="flex-1 relative flex flex-col 2xl:flex-row gap-6 min-h-0">
        {!hasGridData ? (
          <div className="flex-1 min-h-[460px]">
            <MapProcessor />
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-[460px] bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6 flex flex-col relative overflow-hidden">
              <AnimatePresence>
                {isGenerating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
                  >
                    <Loader2 size={48} className="text-indigo-600 animate-spin mb-4" />
                    <h3 className="text-xl font-bold text-slate-800">Crunching Municipal Data...</h3>
                    <p className="text-slate-500">Running constraint satisfaction and A* routing.</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {hasGeneratedPlan ? (
                <div
                  id="export-grid"
                  className="flex-1 w-full h-full flex flex-col items-center justify-center bg-white"
                >
                  <InteractiveGrid />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <Map className="mx-auto text-slate-300 mb-4" size={48} />
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Topography Ready</h3>
                  <p className="text-slate-500 max-w-sm mx-auto">
                    Configure your demographic requirements. Once locked, the algorithm will place the infrastructure here.
                  </p>
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
