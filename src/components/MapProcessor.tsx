"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { UploadCloud, CheckCircle2, Settings2 } from "lucide-react";
import { usePlanStore, GridCell } from "@/store/usePlanStore";
import { estimateGridResolution, getBlockAreaHectares } from "@/lib/planningMath";

export default function MapProcessor() {
  const [isDragging, setIsDragging] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { setGridData, landAreaHectares, blockSizeMeters } = usePlanStore((state) => ({
    setGridData: state.setGridData,
    landAreaHectares: state.landAreaHectares,
    blockSizeMeters: state.blockSizeMeters,
  }));

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      loadImage(file);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadImage(file);
  };

  const loadImage = (file: File) => {
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    // Reset canvas when new image is loaded
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const processMap = () => {
    if (!imageSrc || !canvasRef.current) return;
    setProcessing(true);

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      
      // Set a standard processing size to ensure consistent math
      const MAX_DIM = 600;
      const scale = Math.min(MAX_DIM / img.width, MAX_DIM / img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // 1. Find Bounding Box of black pixels (luminance < 128)
      let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
      for (let i = 0; i < data.length; i += 4) {
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        if (lum < 128) { // Black pixel
          const x = (i / 4) % canvas.width;
          const y = Math.floor(i / 4 / canvas.width);
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }

      // Add slight padding to bounding box
      minX = Math.max(0, minX - 10);
      minY = Math.max(0, minY - 10);
      maxX = Math.min(canvas.width, maxX + 10);
      maxY = Math.min(canvas.height, maxY + 10);

      const boxW = maxX - minX;
      const boxH = maxY - minY;

      // Estimate the developable footprint ratio from the uploaded map.
      const boundaryPixels = new Uint8Array(boxW * boxH);
      for (let y = 0; y < boxH; y++) {
        for (let x = 0; x < boxW; x++) {
          const px = minX + x;
          const py = minY + y;
          const idx = (py * canvas.width + px) * 4;
          const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          boundaryPixels[y * boxW + x] = lum < 128 ? 1 : 0;
        }
      }

      const outsidePixels = new Uint8Array(boxW * boxH);
      const pixelQueue: [number, number][] = [];
      const pushPixel = (x: number, y: number) => {
        const i = y * boxW + x;
        if (outsidePixels[i] || boundaryPixels[i]) return;
        outsidePixels[i] = 1;
        pixelQueue.push([x, y]);
      };

      for (let x = 0; x < boxW; x++) {
        pushPixel(x, 0);
        pushPixel(x, boxH - 1);
      }
      for (let y = 0; y < boxH; y++) {
        pushPixel(0, y);
        pushPixel(boxW - 1, y);
      }

      while (pixelQueue.length) {
        const [px, py] = pixelQueue.shift()!;
        const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (const [dx, dy] of neighbors) {
          const nx = px + dx;
          const ny = py + dy;
          if (nx < 0 || nx >= boxW || ny < 0 || ny >= boxH) continue;
          pushPixel(nx, ny);
        }
      }

      let insidePixels = 0;
      for (let i = 0; i < boundaryPixels.length; i++) {
        if (!boundaryPixels[i] && !outsidePixels[i]) insidePixels++;
      }

      const developableFillRatio = insidePixels / Math.max(1, boxW * boxH);
      const resolution = estimateGridResolution(landAreaHectares, blockSizeMeters, developableFillRatio);
      const cellW = boxW / resolution;
      const cellH = boxH / resolution;

      // 2. Identify boundary cells (cells containing black pixels)
      const isBoundaryGrid: boolean[][] = Array(resolution).fill(0).map(() => Array(resolution).fill(false));
      
      for (let gy = 0; gy < resolution; gy++) {
        for (let gx = 0; gx < resolution; gx++) {
          const startX = Math.floor(minX + gx * cellW);
          const endX = Math.floor(minX + (gx + 1) * cellW);
          const startY = Math.floor(minY + gy * cellH);
          const endY = Math.floor(minY + (gy + 1) * cellH);

          let hasBlack = false;
          for (let py = startY; py < endY; py++) {
            for (let px = startX; px < endX; px++) {
              const idx = (py * canvas.width + px) * 4;
              const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
              if (lum < 128) {
                hasBlack = true;
                break;
              }
            }
            if (hasBlack) break;
          }
          isBoundaryGrid[gy][gx] = hasBlack;
        }
      }

      // 3. Flood-fill from edges to find "outside" cells
      const visitedOutside: boolean[][] = Array(resolution).fill(0).map(() => Array(resolution).fill(false));
      const queue: [number, number][] = [];

      for (let i = 0; i < resolution; i++) {
        if (!isBoundaryGrid[0][i]) { queue.push([i, 0]); visitedOutside[0][i] = true; }
        if (!isBoundaryGrid[resolution - 1][i]) { queue.push([i, resolution - 1]); visitedOutside[resolution - 1][i] = true; }
        if (!isBoundaryGrid[i][0]) { queue.push([0, i]); visitedOutside[i][0] = true; }
        if (!isBoundaryGrid[i][resolution - 1]) { queue.push([resolution - 1, i]); visitedOutside[i][resolution - 1] = true; }
      }

      while (queue.length > 0) {
        const [qx, qy] = queue.shift()!;
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of dirs) {
          const nx = qx + dx, ny = qy + dy;
          if (nx >= 0 && nx < resolution && ny >= 0 && ny < resolution) {
            if (!visitedOutside[ny][nx] && !isBoundaryGrid[ny][nx]) {
              visitedOutside[ny][nx] = true;
              queue.push([nx, ny]);
            }
          }
        }
      }

      // 4. Generate Final State & Draw Overlay for UI feedback
      const newGridData: Record<string, GridCell> = {};
      
      // Dim the original image slightly
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let gy = 0; gy < resolution; gy++) {
        for (let gx = 0; gx < resolution; gx++) {
          const cellKey = `${gx},${gy}`;
          const isBoundary = isBoundaryGrid[gy][gx];
          const isOutside = visitedOutside[gy][gx];
          
          const type = (isBoundary || isOutside) ? 'disabled' : 'residential';
          
          newGridData[cellKey] = { x: gx, y: gy, type };

          // Visual Feedback on Canvas
          const cx = minX + gx * cellW;
          const cy = minY + gy * cellH;
          
          ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
          ctx.strokeRect(cx, cy, cellW, cellH);

          if (type === 'residential') {
            ctx.fillStyle = "rgba(16, 185, 129, 0.3)"; // Emerald green for active plots
            ctx.fillRect(cx, cy, cellW, cellH);
          } else if (isBoundary) {
            ctx.fillStyle = "rgba(239, 68, 68, 0.3)"; // Red for boundary cuts
            ctx.fillRect(cx, cy, cellW, cellH);
          }
        }
      }

      // Save to global state
      const developableCells = Object.values(newGridData).filter((cell) => cell.type === "residential").length;
      const developableAreaHectares = developableCells * getBlockAreaHectares(blockSizeMeters);
      setGridData(resolution, newGridData, developableAreaHectares);
      setProcessing(false);
    };
    img.src = imageSrc;
  };

  return (
    <div className="flex flex-col h-full bg-surface rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
      {!imageSrc ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed m-6 rounded-2xl transition-all ${
            isDragging ? "border-primary bg-primary-light/50 scale-[0.99]" : "border-slate-300 bg-slate-50"
          }`}
        >
          <div className="bg-white p-4 rounded-full shadow-sm mb-4">
            <UploadCloud className="text-primary" size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Upload Map Outline</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6 text-center max-w-sm">
            Draw your city outline in black ink on white paper. Drag and drop the photo here, or click to browse.
          </p>
          <label className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium cursor-pointer hover:bg-primary-hover transition-colors shadow-md shadow-primary/20">
            Browse Files
            <input type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
          </label>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Settings2 size={16} className="text-slate-400" />
                Auto Grid Resolution (area-aware)
              </div>
              <p className="text-xs text-slate-500">Using {landAreaHectares.toLocaleString()} ha and {blockSizeMeters}m block size</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setImageSrc(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Reset
              </button>
              <button 
                onClick={processMap}
                disabled={processing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover disabled:opacity-70 transition-colors"
              >
                {processing ? "Processing..." : <><CheckCircle2 size={16} /> Extract Grid</>}
              </button>
            </div>
          </div>
          <div className="flex-1 bg-slate-100 overflow-hidden flex items-center justify-center p-6 relative">
             {/* The canvas handles both the source image and the visual output overlay */}
            <canvas 
              ref={canvasRef} 
              className="max-w-full max-h-full rounded-lg shadow-md object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
