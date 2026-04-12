import { AMENITY_CONFIG } from "@/lib/planningMath";
import {
  calculateEnvironmentalImpact,
  calculateBudgetForecast,
  calculateTrafficLoad,
  calculateWaterDemand
} from "@/lib/municipalAnalytics";

export interface PDFExportData {
  elementId: string;
  population: number;
  gridSize: number;
  modeledAreaHectares: number;
  computedDevelopableAreaHectares: number;
  roadAreaHectares: number;
  avgAccessibility: number;
  avgValue: number;
  totalLandValue: number;
  amenityActualCounts: Record<string, number>;
  idealAmenities: Record<string, number>;
  roadRows: Array<{ roadKey: string; className: string; lanes: number; width: number; segments: number }>;
  amenities: Record<string, number>;
  landAreaHectares: number;
  blockSizeMeters: number;
  roadNetwork: Record<string, any>; // Add roadNetwork
}

export const generatePDFReport = async (data: PDFExportData) => {
  try {
    // Dynamically import heavy libraries to prevent Next.js SSR build errors
    const html2canvas = (await import("html2canvas")).default;
    const { default: jsPDF } = await import("jspdf");

    const gridElement = document.getElementById(data.elementId);
    if (!gridElement) throw new Error("Grid element not found");

    const canvas = await html2canvas(gridElement, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 14;
    const fullDate = new Date().toLocaleString();
    const formatINR = (value: number) => {
      if (value > 10000000) return `INR ${(value / 10000000).toFixed(2)} Cr`;
      if (value > 100000) return `INR ${(value / 100000).toFixed(2)} L`;
      return `INR ${Math.round(value).toLocaleString()}`;
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
      ["Population", data.population.toLocaleString()],
      ["Grid", `${data.gridSize} x ${data.gridSize}`],
      ["Modeled Area", `${data.modeledAreaHectares.toFixed(1)} ha`],
      ["Developable Area", `${data.computedDevelopableAreaHectares.toFixed(1)} ha`],
      ["Road Land Use", `${data.roadAreaHectares.toFixed(1)} ha`],
      ["Avg Accessibility", `${data.avgAccessibility.toFixed(2)} / 10`],
      ["Avg Plot Value", formatINR(data.avgValue)],
      ["Base Land Value", formatINR(data.totalLandValue)],
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
      pdf.text(label as string, x + 3, y + 5);
      pdf.setFontSize(10.5);
      pdf.setTextColor(30, 41, 59);
      pdf.text(value as string, x + 3, y + 10);
    });

    const mapY = 132;
    const mapW = 125;
    const mapH = 125 * (canvas.height / canvas.width);
    pdf.setFontSize(12);
    pdf.setTextColor(15, 23, 42);
    pdf.text("Zoning Map Snapshot", margin, mapY - 4);
    pdf.addImage(imgData, "PNG", margin, mapY, mapW, Math.min(130, mapH));

    const legendX = margin + mapW + 8;
    pdf.setFontSize(12);
    pdf.text("Legend", legendX, mapY - 4);
    const legendRows: Array<{ label: string; color: [number, number, number] }> = [
      { label: "Residential Block", color: [254, 240, 138] },
      { label: "Unavailable / Outside Boundary", color: [241, 245, 249] },
      ...Object.values(AMENITY_CONFIG).map((config) => ({
        label: config.name,
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
      pdf.text(item.label, legendX + 8, y + 1);
    });

    pdf.setFontSize(8.5);
    pdf.setTextColor(71, 85, 105);
    const inputSummary = [
      `Inputs: ${data.landAreaHectares} ha land area, ${data.blockSizeMeters}m blocks.`,
      `Amenity sliders configured: ${Object.entries(data.amenities).map(([key, value]) => `${key}:${value}`).join(" | ")}`,
    ];
    const wrappedInputSummary = pdf.splitTextToSize(inputSummary.join(" "), pdfWidth - margin * 2);
    pdf.text(wrappedInputSummary, margin, pdfHeight - 12);

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
    pdf.text("Placed", margin + 58, rowY);
    pdf.text("Ideal", margin + 78, rowY);
    pdf.text("Coverage", margin + 96, rowY);
    rowY += 7;

    Object.values(AMENITY_CONFIG).forEach((config, index) => {
      const placed = data.amenityActualCounts[config.id] || 0;
      const ideal = data.idealAmenities[config.id] || 1;
      const pct = Math.min(100, Math.round((placed / ideal) * 100));
      if (index % 2 === 0) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(margin, rowY - 5, pdfWidth - margin * 2, 7, "F");
      }
      pdf.setTextColor(30, 41, 59);
      pdf.text(config.name, margin + 2, rowY);
      pdf.text(String(placed), margin + 61, rowY);
      pdf.text(String(ideal), margin + 81, rowY);
      pdf.text(`${pct}%`, margin + 98, rowY);
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

    data.roadRows.slice(0, 20).forEach((road, index) => {
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
    pdf.text("Powered by UrbanPlan AI - Suitable for academic planning review", margin, pdfHeight - 8);

    // Page 3: Advanced Municipal Modules
    pdf.addPage();
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pdfWidth, 20, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.text("Advanced Municipal Modules (URDPFI Base)", margin, 13);

    const envImpact = calculateEnvironmentalImpact(data.population, data.amenityActualCounts['park'] || 0, data.blockSizeMeters);
    const budget = calculateBudgetForecast(data.amenityActualCounts);
    const traffic = calculateTrafficLoad(data.population, data.roadNetwork);

    pdf.setTextColor(30, 41, 59);
    let p3Y = 32;

    // Environment
    pdf.setFontSize(13);
    pdf.text("Environment & Green Cover", margin, p3Y);
    p3Y += 8;
    pdf.setFontSize(10);
    pdf.text(`Status: ${envImpact.status} (Score: ${envImpact.score.toFixed(1)}/10)`, margin, p3Y);
    p3Y += 6;
    pdf.text(`Provided Green Space: ${envImpact.providedSqmPerPerson.toFixed(1)} sqm per person`, margin, p3Y);
    p3Y += 6;
    pdf.text(`URDPFI Requirement: ${envImpact.requiredSqmPerPerson} sqm per person`, margin, p3Y);
    p3Y += 14;

    // Budget
    pdf.setFontSize(13);
    pdf.text("Project CapEx & OpEx Forecast", margin, p3Y);
    p3Y += 8;
    pdf.setFontSize(10);
    pdf.text(`Total Capital Expenditure (CapEx): INR ${budget.totalCapExCr.toFixed(2)} Crores`, margin, p3Y);
    p3Y += 6;
    pdf.text(`Estimated Annual OpEx: INR ${budget.totalOpExCr.toFixed(2)} Crores`, margin, p3Y);
    p3Y += 10;

    pdf.setFontSize(9);
    pdf.setFillColor(241, 245, 249);
    pdf.rect(margin, p3Y - 5, pdfWidth - margin * 2, 7, "F");
    pdf.text("Amenity", margin + 2, p3Y);
    pdf.text("Count", margin + 60, p3Y);
    pdf.text("CapEx (Cr)", margin + 90, p3Y);
    pdf.text("OpEx (Cr)", margin + 120, p3Y);
    p3Y += 7;

    budget.amenityBreakdown.forEach((item, index) => {
      if (index % 2 === 0) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(margin, p3Y - 5, pdfWidth - margin * 2, 7, "F");
      }
      pdf.text(item.name, margin + 2, p3Y);
      pdf.text(String(item.count), margin + 62, p3Y);
      pdf.text(item.capexCr.toFixed(1), margin + 92, p3Y);
      pdf.text(item.opexCr.toFixed(1), margin + 122, p3Y);
      p3Y += 7;
    });
    p3Y += 10;

    // Traffic Flow
    pdf.setFontSize(13);
    pdf.text("Urban Traffic Flow Profile", margin, p3Y);
    p3Y += 8;
    pdf.setFontSize(10);
    pdf.text(`Level of Service: ${traffic.status}`, margin, p3Y);
    p3Y += 6;
    pdf.text(`Average V/C Ratio: ${traffic.avgVCRatio.toFixed(2)}`, margin, p3Y);
    p3Y += 6;
    pdf.text(`Worst Corridor V/C Ratio: ${traffic.worstVCRatio.toFixed(2)}`, margin, p3Y);
    p3Y += 6;
    pdf.text(`Estimated Daily Trips: ${Math.round(traffic.dailyTrips).toLocaleString()}`, margin, p3Y);
    p3Y += 6;
    pdf.text(`Peak Hour System Load: ${Math.round(traffic.peakHourTrips).toLocaleString()} PCUs`, margin, p3Y);
    p3Y += 6;
    pdf.text(`Road Corridors: ${traffic.numCorridors} | Network Capacity: ${Math.round(traffic.networkCapacityPCU).toLocaleString()} PCU/Hr`, margin, p3Y);
    p3Y += 14;

    // Water & Sanitation (CPHEEO)
    const water = calculateWaterDemand(data.population);
    pdf.setFontSize(13);
    pdf.text("Water & Sanitation (CPHEEO Standards)", margin, p3Y);
    p3Y += 8;
    pdf.setFontSize(10);
    pdf.text(`Domestic Water Demand: ${water.dailyDemandMLD} MLD (${water.lpcd} LPCD)`, margin, p3Y);
    p3Y += 6;
    pdf.text(`Wastewater Generation: ${water.wastewaterMLD} MLD (80% of supply)`, margin, p3Y);
    p3Y += 6;
    pdf.text(`STP Capacity Required: ${water.stpCapacityMLD} MLD`, margin, p3Y);

    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text("Powered by UrbanPlan AI — Standards: URDPFI 2014, IRC:86-1983, CPHEEO, HCM LOS", margin, pdfHeight - 8);

    pdf.save(`UrbanPlan_Report_${new Date().getTime()}.pdf`);
  } catch (error) {
    console.error("PDF Export failed:", error);
    alert("Failed to export PDF. Please try again.");
  }
};
