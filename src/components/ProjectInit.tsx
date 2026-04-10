"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import MapProcessor from "./MapProcessor";
import ManualGridBuilder from "./ManualGridBuilder";

export default function ProjectInit() {
  const [selectedMode, setSelectedMode] = useState<"map" | "manual" | null>(null);

  if (selectedMode === "map") return <MapProcessor />;
  if (selectedMode === "manual") return <ManualGridBuilder />;

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">
      <div className="mb-12 text-center lg:text-left">
        <h1 className="text-4xl font-bold text-on-surface tracking-tight mb-3 font-headline">Begin Your Architectural Vision</h1>
        <p className="text-on-surface-variant text-lg max-w-2xl">Every great city starts with a single point of data. Define your canvas by uploading topographical telemetry or configuring a manual urban grid.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <div 
          onClick={() => setSelectedMode("map")}
          className="group cursor-pointer relative flex flex-col p-8 bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
        >
          <div className="mb-6">
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 transition-transform duration-300 group-hover:scale-110">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
            </div>
            <h3 className="text-2xl font-semibold text-on-surface mb-2 font-headline">Upload Topography Map</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">Import LIDAR or satellite elevation data (GeoTIFF, GeoJSON, or DWG) to generate high-fidelity terrain models for your city grid.</p>
          </div>
          <div className="flex-1 mt-4">
            <div className="h-64 w-full border-2 border-dashed border-outline-variant/30 rounded-xl flex flex-col items-center justify-center bg-surface-container-low/30 hover:bg-surface-container-low/60 transition-colors relative overflow-hidden group/upload">
              <div className="z-10 text-center p-6">
                <span className="material-symbols-outlined text-4xl text-outline mb-3 group-hover/upload:text-primary transition-colors">cloud_upload</span>
                <p className="text-on-surface font-medium">Drop your terrain files here</p>
                <p className="text-outline text-xs mt-1">Maximum file size: 250MB</p>
              </div>
              <div className="absolute inset-0 opacity-5 grayscale transition-all duration-300 group-hover/upload:opacity-10 group-hover/upload:grayscale-0">
                <img alt="Topographic Map" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB36UWAl_jChciCZW_Xl6Jmhie5Uk_rGwCvHv8XA6U-npaZxyDlnz4zU2AjabqLbl9WNZMbMWAhuBHmkqW04nZwmF_1UdN5szBxM1x-rFX1bjqnicYuLv4CnWhyiQNjYLKXn2O30nDhS7jVnQJn7tk_bG7pJd0RgEknJzNd5YZ3nbnCJiFJl2zmo33leVNAk3ZMxuP0CYqqdtnS1SKHOys0S5PQZZRvgjpQd9zl1mAsWaBahAcX8JEEDM7iUgl3EhEyxSLxRUlgos6J"/>
              </div>
            </div>
          </div>
          <button className="mt-8 py-3 w-full bg-surface-container-highest text-primary font-bold rounded-lg hover:bg-primary hover:text-white transition-all">
            Browse Files
          </button>
        </div>

        <div className="flex flex-col p-8 bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
          <div className="mb-6">
            <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary mb-6 transition-transform duration-300 hover:scale-110">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>grid_4x4</span>
            </div>
            <h3 className="text-2xl font-semibold text-on-surface mb-2 font-headline">Manual Grid Configuration</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">Start with a clean slate. Define custom boundary sizes, road hierarchy, and zoning blocks using our procedural engine.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="p-4 bg-surface-container-low rounded-lg">
              <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-2">Boundary Size</label>
              <div className="flex items-center justify-between text-on-surface font-medium">
                <span>Dynamically built</span>
                <span className="material-symbols-outlined text-sm text-outline">straighten</span>
              </div>
            </div>
            <div className="p-4 bg-surface-container-low rounded-lg">
              <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-2">Terrain Type</label>
              <div className="flex items-center justify-between text-on-surface font-medium">
                <span>Flat Plateau</span>
                <span className="material-symbols-outlined text-sm text-outline">landscape</span>
              </div>
            </div>
            <div className="p-4 bg-surface-container-low rounded-lg">
              <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-2">Density Model</label>
              <div className="flex items-center justify-between text-on-surface font-medium">
                <span>Urban Core</span>
                <span className="material-symbols-outlined text-sm text-outline">location_city</span>
              </div>
            </div>
            <div className="p-4 bg-surface-container-low rounded-lg">
              <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-2">Primary Flow</label>
              <div className="flex items-center justify-between text-on-surface font-medium">
                <span>Algorithmic</span>
                <span className="material-symbols-outlined text-sm text-outline">sync_alt</span>
              </div>
            </div>
          </div>
          <div className="mt-8 w-full p-6 bg-tertiary-fixed/30 rounded-xl border border-tertiary-fixed-dim/20 flex items-center gap-4">
            <span className="material-symbols-outlined text-tertiary text-2xl">info</span>
            <p className="text-on-tertiary-fixed-variant text-xs leading-normal">
              Manual mode allows for rapid prototyping of hypothetical urban environments without geographical constraints.
            </p>
          </div>
          <button onClick={() => setSelectedMode("manual")} className="mt-6 py-3 w-full bg-surface-container-highest text-secondary font-bold rounded-lg hover:bg-secondary hover:text-white transition-all">
            Define Parameters
          </button>
        </div>
      </div>

      <div className="mt-16">
        <h4 className="text-sm font-bold text-outline uppercase tracking-widest mb-6">Recent Architecture Files</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-12 bg-surface-container-low/50 rounded-2xl border-2 border-dashed border-outline-variant/20 flex flex-col items-center justify-center text-center opacity-60">
            <span className="material-symbols-outlined text-4xl text-outline-variant mb-4">history</span>
            <p className="text-outline-variant font-medium text-sm">No recent projects found</p>
          </div>
        </div>
      </div>
    </div>
  );
}
