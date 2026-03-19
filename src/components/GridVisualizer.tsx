// src/components/GridVisualizer.tsx

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Download, Map, CheckCircle2, Loader2 } from "lucide-react";
// ❌ REMOVED: Static imports for html2canvas and jspdf

import ZoningWizard from "./ZoningWizard";
import MapProcessor from "./MapProcessor";
import InteractiveGrid from "./InteractiveGrid";
import { usePlanStore } from "@/store/usePlanStore";

export default function GridVisualizer() {
  const { gridData, isGenerating, population, totalLandValue } = usePlanStore();
  const [isExporting, setIsExporting] = useState(false);

  const hasGridData = Object.keys(gridData).length > 0;
  const hasGeneratedPlan = Object.values(gridData).some(c => c.type === 'amenity');

  const exportToPDF = async () => {
    if (!hasGeneratedPlan) return;
    setIsExporting(true);
    
    try {
      // ✅ FIX: Dynamically import the heavy browser-only libraries 
      // This prevents the Next.js SSR build error
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      // Target the grid container
      const gridElement = document.getElementById("export-grid");
      if (!gridElement) throw new Error("Grid element not found");

      const canvas = await html2canvas(gridElement, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Header
      pdf.setFontSize(22);
      pdf.setTextColor(30, 41, 59); // slate-800
      pdf.text("Municipal Urban Plan Report", 15, 20);
      
      pdf.setFontSize(12);
      pdf.setTextColor(100, 116, 139); // slate-500
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
      className="flex-1 h-full p-6 flex flex-col relative"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">City Topography</h2>
          <p className="text-slate-500">
            {hasGeneratedPlan ? "Interactive municipal zoning complete." : "Upload an outline or configure parameters."}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="p-2 bg-surface border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 shadow-sm">
            <Maximize2 size={18} />
          </button>
          <button 
            onClick={exportToPDF}
            disabled={!hasGeneratedPlan || isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {isExporting ? "Exporting..." : "Export PDF"}
          </button>
        </div>
      </div>

      <div className="flex-1 relative flex gap-6 min-h-0">
        {!hasGridData ? (
          <div className="flex-1"><MapProcessor /></div>
        ) : (
          <>
            <div className="flex-1 bg-surface rounded-2xl border border-slate-200 shadow-soft p-6 flex flex-col relative overflow-hidden">
              
              {/* Loading Overlay */}
              <AnimatePresence>
                {isGenerating && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
                  >
                    <Loader2 size={48} className="text-primary animate-spin mb-4" />
                    <h3 className="text-xl font-bold text-slate-800">Crunching Municipal Data...</h3>
                    <p className="text-slate-500">Running constraint satisfaction and A* routing.</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {hasGeneratedPlan ? (
                // Add the ID here so html2canvas can target it
                <div id="export-grid" className="flex-1 w-full h-full flex flex-col items-center justify-center bg-surface">
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

            <div className="w-[400px] shrink-0">
              <ZoningWizard />
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}