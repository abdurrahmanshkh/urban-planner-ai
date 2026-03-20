// src/components/GridVisualizer.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Download, Loader2, Layers } from "lucide-react";

import ZoningWizard from "./ZoningWizard";
import MapProcessor from "./MapProcessor";
import InteractiveGrid from "./InteractiveGrid";
import { usePlanStore } from "@/store/usePlanStore";
import { AMENITY_CONFIG, calculateIdealAmenities, getBlockAreaHectares } from "@/lib/planningMath";
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
      // Dynamically import heavy libraries to prevent Next.js SSR build errors
      const html2canvas = (await import("html2canvas")).default;
      const { default: jsPDF } = await import("jspdf");

      const gridElement = document.getElementById("pdf-export-grid");
      if (!gridElement) throw new Error("Grid element not found");

      const canvas = await html2canvas(gridElement, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;
      const fullDate = new Date().toLocaleString();
      const formatINR = (value: number) => {
        if (value > 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
        if (value > 100000) return `₹${(value / 100000).toFixed(2)} L`;
        return `₹${Math.round(value).toLocaleString()}`;
      };

      // Cover + executive summary
      pdf.setFillColor(37, 99, 235);
      pdf.rect(0, 0, pdfWidth, 38, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.text("UrbanPlan AI Report", margin, 18);
      pdf.setFontSize(11);
      pdf.text("Advanced municipal zoning and infrastructure summary", margin, 27);
      pdf.text(`Generated: ${fullDate}`, margin, 33);

      pdf.setTextColor(30, 41, 59);
      pdf.setFontSize(13);
      pdf.text("Executive Metrics", margin, 48);
      const metricCards = [
        ["Population", population.toLocaleString()],
        ["Grid", `${gridSize} × ${gridSize}`],
        ["Modeled Area", `${modeledAreaHectares.toFixed(1)} ha`],
        ["Developable Area", `${computedDevelopableAreaHectares.toFixed(1)} ha`],
        ["Road Land Use", `${roadAreaHectares.toFixed(1)} ha`],
        ["Avg Accessibility", `${avgAccessibility.toFixed(2)} / 10`],
        ["Avg Plot Value", formatINR(avgValue)],
        ["Base Land Value", formatINR(totalLandValue)],
      ];
      const cardW = (pdfWidth - margin * 2 - 8) / 2;
      metricCards.forEach(([label, value], index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const x = margin + col * (cardW + 8);
        const y = 53 + row * 16;
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(x, y, cardW, 13, 2, 2, "F");
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        pdf.text(label, x + 3, y + 5);
        pdf.setFontSize(10.5);
        pdf.setTextColor(30, 41, 59);
        pdf.text(value, x + 3, y + 10);
      });

      const mapY = 122;
      const mapW = 125;
      const mapH = 125 * (canvas.height / canvas.width);
      pdf.setFontSize(12);
      pdf.setTextColor(15, 23, 42);
      pdf.text("Zoning Map Snapshot", margin, mapY - 4);
      pdf.addImage(imgData, "PNG", margin, mapY, mapW, Math.min(130, mapH));

      const legendX = margin + mapW + 8;
      pdf.setFontSize(12);
      pdf.text("Legend", legendX, mapY - 4);
      const legendRows: Array<{ label: string; icon: string; color: [number, number, number] }> = [
        { label: "Residential Block", icon: "■", color: [254, 240, 138] },
        { label: "Unavailable / Outside Boundary", icon: "■", color: [241, 245, 249] },
        ...Object.values(AMENITY_CONFIG).map((config) => ({
          label: config.name,
          icon: config.icon,
          color: [
            parseInt(config.color.slice(1, 3), 16),
            parseInt(config.color.slice(3, 5), 16),
            parseInt(config.color.slice(5, 7), 16),
          ] as [number, number, number],
        })),
      ];

      legendRows.forEach((item, index) => {
        const y = mapY + 5 + index * 9;
        pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
        pdf.roundedRect(legendX, y - 3, 5, 5, 1, 1, "F");
        pdf.setTextColor(15, 23, 42);
        pdf.setFontSize(9);
        pdf.text(`${item.icon} ${item.label}`, legendX + 8, y + 1);
      });

      pdf.setFontSize(8.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text(
        [`Inputs: ${landAreaHectares} ha land area, ${blockSizeMeters}m blocks.`,
          `Amenity sliders configured: ${Object.entries(amenities).map(([key, value]) => `${key}:${value}`).join(" | ")}`],
        margin,
        pdfHeight - 12
      );

      // Page 2: infrastructure and coverage detail
      pdf.addPage();
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, pdfWidth, 20, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.text("Infrastructure & Coverage Detail", margin, 13);

      pdf.setTextColor(30, 41, 59);
      pdf.setFontSize(12);
      pdf.text("Amenity Adequacy", margin, 30);
      pdf.setFontSize(9);
      let rowY = 36;
      pdf.setFillColor(241, 245, 249);
      pdf.rect(margin, rowY - 5, pdfWidth - margin * 2, 7, "F");
      pdf.text("Amenity", margin + 2, rowY);
      pdf.text("Placed", margin + 60, rowY);
      pdf.text("Ideal", margin + 80, rowY);
      pdf.text("Coverage", margin + 100, rowY);
      rowY += 7;

      Object.values(AMENITY_CONFIG).forEach((config, index) => {
        const placed = amenityActualCounts[config.id] || 0;
        const ideal = idealAmenities[config.id] || 1;
        const pct = Math.min(100, Math.round((placed / ideal) * 100));
        if (index % 2 === 0) {
          pdf.setFillColor(248, 250, 252);
          pdf.rect(margin, rowY - 5, pdfWidth - margin * 2, 7, "F");
        }
        pdf.setTextColor(30, 41, 59);
        pdf.text(`${config.icon} ${config.name}`, margin + 2, rowY);
        pdf.text(String(placed), margin + 62, rowY);
        pdf.text(String(ideal), margin + 82, rowY);
        pdf.text(`${pct}%`, margin + 103, rowY);
        rowY += 7;
      });

      rowY += 8;
      pdf.setFontSize(12);
      pdf.text("Road Recommendation Mix", margin, rowY);
      rowY += 7;
      pdf.setFontSize(9);
      pdf.setFillColor(241, 245, 249);
      pdf.rect(margin, rowY - 5, pdfWidth - margin * 2, 7, "F");
      pdf.text("Road", margin + 2, rowY);
      pdf.text("Class", margin + 26, rowY);
      pdf.text("Lanes", margin + 52, rowY);
      pdf.text("Width", margin + 70, rowY);
      pdf.text("Segments", margin + 92, rowY);
      rowY += 7;

      roadRows.slice(0, 20).forEach((road, index) => {
        if (rowY > pdfHeight - 18) return;
        if (index % 2 === 0) {
          pdf.setFillColor(248, 250, 252);
          pdf.rect(margin, rowY - 5, pdfWidth - margin * 2, 7, "F");
        }
        pdf.text(road.roadKey, margin + 2, rowY);
        pdf.text(road.className, margin + 26, rowY);
        pdf.text(String(road.lanes), margin + 53, rowY);
        pdf.text(`${road.width}m`, margin + 70, rowY);
        pdf.text(String(road.segments), margin + 94, rowY);
        rowY += 7;
      });

      pdf.setFontSize(8.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text("Powered by UrbanPlan AI • Suitable for academic planning review", margin, pdfHeight - 8);

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
                <div className="flex-1 w-full h-full flex flex-col items-center justify-center bg-white">
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
