// src/components/AnalyticsPanel.tsx
"use client";

import { motion } from "framer-motion";
import { Activity, IndianRupee, Users } from "lucide-react";
import { usePlanStore } from "@/store/usePlanStore";
import { AMENITY_CONFIG, calculateIdealAmenities, getBlockAreaHectares } from "@/lib/planningMath";

export default function AnalyticsPanel() {
  const { gridData, population, gridSize, amenities, blockSizeMeters, roadAreaHectares, roadNetwork } = usePlanStore();

  const cells = Object.values(gridData);
  const activeCells = cells.filter(c => c.type !== "disabled");
  const hasGenerated = cells.some(c => c.type === "amenity");

  // Calculate Real-Time Metrics
  const totalValue = activeCells.reduce((sum, cell) => sum + (cell.landValue || 0), 0);
  const avgValue = activeCells.length > 0 ? totalValue / activeCells.length : 0;
  
  const totalAccess = activeCells.reduce((sum, cell) => sum + (cell.accessibilityScore || 0), 0);
  const avgAccess = activeCells.length > 0 ? totalAccess / activeCells.length : 0;
  const modeledAreaHectares = activeCells.length * getBlockAreaHectares(blockSizeMeters);
  const roads = Object.values(roadNetwork);
  const roadMix = roads.reduce<Record<string, number>>((acc, road) => {
    const key = `${road.roadClass}|${road.laneCount}|${road.widthMeters}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const topRoadProfiles = Object.entries(roadMix)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Calculate ideals for the Adequacy bars
  const ideals = calculateIdealAmenities(population, gridSize);

  // Formatter
  const formatINR = (val: number) => {
    if (val > 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val > 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${Math.round(val).toLocaleString()}`;
  };

  return (
    <motion.aside 
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="w-full xl:w-80 bg-surface h-full border-l border-slate-200 shadow-soft overflow-y-auto"
    >
      <div className="p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Activity className="text-success" size={20} />
          Real-time Analytics
        </h3>

        <div className="space-y-4">
          <MetricCard icon={<Users size={18} />} title="Est. Population" value={population.toLocaleString()} />
          <MetricCard icon={<Activity size={18} />} title="Modeled Land Area" value={`${modeledAreaHectares.toFixed(1)} ha`} />
          <MetricCard icon={<Activity size={18} />} title="Road Land Use" value={`${roadAreaHectares.toFixed(1)} ha`} />
          <MetricCard icon={<Activity size={18} />} title="Road Segments" value={Object.keys(roadNetwork).length.toLocaleString()} />
          <MetricCard icon={<IndianRupee size={18} />} title="Avg. Plot Value" value={hasGenerated ? formatINR(avgValue) : "--"} />
          <MetricCard 
            icon={<Activity size={18} />} 
            title="Avg. Accessibility" 
            value={hasGenerated ? `${avgAccess.toFixed(2)} / 10.0` : "-- / 10.0"} 
          />
        </div>

        {hasGenerated && (
          <div className="mt-8">
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Road Recommendation Mix</h4>
            <div className="space-y-2 mb-6">
              {topRoadProfiles.length > 0 ? topRoadProfiles.map(([profile, count]) => {
                const [roadClass, lanes, width] = profile.split("|");
                return (
                  <div key={profile} className="flex items-center justify-between text-sm bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                    <span className="font-medium text-slate-700">{roadClass} • {lanes} lanes • {width}m</span>
                    <span className="text-slate-500">{count} segments</span>
                  </div>
                );
              }) : <p className="text-sm text-slate-500">No active roads yet.</p>}
            </div>

            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Coverage Adequacy</h4>
            <div className="space-y-4">
              {Object.values(AMENITY_CONFIG).map(config => {
                const current = amenities[config.id] || 0;
                const ideal = ideals[config.id] || 1;
                const percentage = Math.min(100, Math.round((current / ideal) * 100));
                
                return (
                  <AdequacyBar 
                    key={config.id}
                    label={config.name} 
                    percentage={percentage} 
                    color={config.color}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}

function MetricCard({ icon, title, value }: { icon: React.ReactNode, title: string, value: string }) {
  return (
    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
      <div className="flex items-center gap-2 text-slate-500 mb-2">
        {icon}
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
    </div>
  );
}

function AdequacyBar({ label, percentage, color }: { label: string, percentage: number, color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="text-slate-500">{percentage}%</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className="h-full transition-all duration-500 ease-out" 
          style={{ width: `${percentage}%`, backgroundColor: color }}
        ></div>
      </div>
    </div>
  );
}
