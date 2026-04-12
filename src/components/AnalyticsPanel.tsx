// src/components/AnalyticsPanel.tsx
"use client";

import { motion } from "framer-motion";
import { Activity, IndianRupee, Users } from "lucide-react";
import { usePlanStore } from "@/store/usePlanStore";
import { AMENITY_CONFIG, calculateIdealAmenities, getBlockAreaHectares } from "@/lib/planningMath";
import { calculateEnvironmentalImpact, calculateBudgetForecast, calculateTrafficLoad, calculateWaterDemand } from "@/lib/municipalAnalytics";

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

  const roadRows = Object.values(
    roads.reduce<Record<string, { roadKey: string; className: string; lanes: number; width: number; segments: number; minX: number; maxX: number; minY: number; maxY: number }>>((acc, road) => {
      const [fromX, fromY] = road.fromKey.split(",").map(Number);
      const [toX, toY] = road.toKey.split(",").map(Number);
      const key = road.lineKey;
      const current = acc[key];

      if (!current) {
        acc[key] = {
          roadKey: key,
          className: road.roadClass,
          lanes: road.laneCount,
          width: road.widthMeters,
          segments: 1,
          minX: Math.min(fromX, toX),
          maxX: Math.max(fromX, toX),
          minY: Math.min(fromY, toY),
          maxY: Math.max(fromY, toY),
        };
      } else {
        current.segments += 1;
        current.minX = Math.min(current.minX, fromX, toX);
        current.maxX = Math.max(current.maxX, fromX, toX);
        current.minY = Math.min(current.minY, fromY, toY);
        current.maxY = Math.max(current.maxY, fromY, toY);
      }

      return acc;
    }, {})
  ).sort((a, b) => a.roadKey.localeCompare(b.roadKey, undefined, { numeric: true }));

  // Calculate ideals for the Adequacy bars
  const ideals = calculateIdealAmenities(population, gridSize);

  // Advanced Municipal Analytics
  const amenityActualCounts = Object.entries(gridData).reduce((acc, [key, cell]) => {
    if (cell.type === "amenity" && cell.amenityType) {
      acc[cell.amenityType] = (acc[cell.amenityType] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const envImpact = calculateEnvironmentalImpact(population, amenityActualCounts['park'] || 0, blockSizeMeters);
  const budget = calculateBudgetForecast(amenityActualCounts);
  const traffic = calculateTrafficLoad(population, roadNetwork);
  const water = calculateWaterDemand(population);

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
      className="w-[300px] xl:w-[340px] bg-white h-full border-l border-slate-200 shadow-[rgba(0,0,0,0.05)_-10px_0px_20px_0px] overflow-y-auto relative z-20 custom-scroll flex-shrink-0"
    >
      <div className="p-5 xl:p-6">
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

            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mt-8 mb-4">Advanced Municipal Modules</h4>
            <div className="space-y-4 mb-6">
              {/* Environmental Impact */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-blue-900">Environment & Green Cover</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${envImpact.status === 'Deficit' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {envImpact.status}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-blue-700">
                  <span>Provided: {envImpact.providedSqmPerPerson.toFixed(1)} sqm/person</span>
                  <span>Required: {envImpact.requiredSqmPerPerson} sqm</span>
                </div>
                <div className="mt-2 h-1.5 w-full bg-blue-200 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${envImpact.status === 'Surplus' ? 'bg-emerald-500' : 'bg-red-400'}`} style={{ width: `${envImpact.score * 10}%` }}></div>
                </div>
              </div>

              {/* Budget Forecast */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-emerald-900">CapEx / OpEx Budget</span>
                </div>
                <div className="flex justify-between text-sm text-emerald-800 font-medium mb-1">
                  <span>Total Capital:</span>
                  <span>₹{budget.totalCapExCr.toFixed(1)} Cr</span>
                </div>
                <div className="flex justify-between text-sm text-emerald-700">
                  <span>Yearly OpEx:</span>
                  <span>₹{budget.totalOpExCr.toFixed(1)} Cr</span>
                </div>
              </div>

              {/* Traffic Flow */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-amber-900">Urban Traffic Flow</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${traffic.status.includes('Oversaturated') || traffic.status.includes('At Capacity') ? 'bg-red-100 text-red-700' : traffic.status.includes('Near') ? 'bg-amber-200 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>
                    {traffic.status}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-amber-800/80 mb-1">
                  <span>Peak Hr Trips: {Math.round(traffic.peakHourTrips).toLocaleString()} PCU</span>
                </div>
                <div className="flex justify-between text-sm text-amber-800 font-medium mb-1">
                  <span>Avg V/C Ratio:</span>
                  <span>{traffic.avgVCRatio.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-amber-800/70">
                  <span>Worst Corridor V/C:</span>
                  <span>{traffic.worstVCRatio.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-amber-800/70 mt-1">
                  <span>Road Corridors:</span>
                  <span>{traffic.numCorridors}</span>
                </div>
              </div>

              {/* Water & Sanitation (CPHEEO) */}
              <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-cyan-900">Water & Sanitation</span>
                  <span className="text-xs font-bold px-2 py-1 rounded-md bg-cyan-100 text-cyan-700">CPHEEO</span>
                </div>
                <div className="flex justify-between text-sm text-cyan-800 font-medium mb-1">
                  <span>Water Demand:</span>
                  <span>{water.dailyDemandMLD} MLD</span>
                </div>
                <div className="flex justify-between text-sm text-cyan-700 mb-1">
                  <span>Wastewater Gen:</span>
                  <span>{water.wastewaterMLD} MLD</span>
                </div>
                <div className="flex justify-between text-sm text-cyan-700">
                  <span>STP Capacity Needed:</span>
                  <span>{water.stpCapacityMLD} MLD</span>
                </div>
                <p className="text-xs text-cyan-600 mt-2">Based on {water.lpcd} LPCD standard</p>
              </div>
            </div>

            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mt-6 mb-3">Per-Road Lane Plan</h4>
            <div className="overflow-auto border border-slate-200 rounded-lg max-h-64 dark-scroll">
              <table className="min-w-full text-xs ... relative">
                <thead className="bg-slate-50 text-slate-600 sticky top-0 shadow-sm z-10">
                  <tr>
                    <th className="text-left px-3 py-2">Road</th>
                    <th className="text-left px-3 py-2">Between Blocks</th>
                    <th className="text-left px-3 py-2">Lanes</th>
                    <th className="text-left px-3 py-2">Width</th>
                    <th className="text-left px-3 py-2">Length</th>
                    <th className="text-left px-3 py-2">Class</th>
                  </tr>
                </thead>
                <tbody>
                  {roadRows.map((row) => (
                    <tr key={row.roadKey} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-semibold text-slate-700">{row.roadKey}</td>
                      <td className="px-3 py-2 text-slate-600">({row.minX + 1},{row.minY + 1}) ↔ ({row.maxX + 1},{row.maxY + 1})</td>
                      <td className="px-3 py-2 text-slate-700">{row.lanes}</td>
                      <td className="px-3 py-2 text-slate-700">{row.width}m</td>
                      <td className="px-3 py-2 text-slate-700">{row.segments} blocks</td>
                      <td className="px-3 py-2 capitalize text-slate-700">{row.className}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
