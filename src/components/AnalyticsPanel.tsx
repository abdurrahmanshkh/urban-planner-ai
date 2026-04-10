"use client";

import { usePlanStore } from "@/store/usePlanStore";
import { AMENITY_CONFIG, calculateIdealAmenities, getBlockAreaHectares } from "@/lib/planningMath";
import { calculateEnvironmentalImpact, calculateBudgetForecast, calculateTrafficLoad } from "@/lib/municipalAnalytics";

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
  
  // Advanced Municipal Analytics
  const amenityActualCounts = Object.entries(gridData).reduce((acc, [key, cell]) => {
    if (cell.type === "amenity" && cell.amenityType) {
      acc[cell.amenityType] = (acc[cell.amenityType] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const ideals = calculateIdealAmenities(population, gridSize);
  const envImpact = calculateEnvironmentalImpact(population, amenityActualCounts['park'] || 0, blockSizeMeters);
  const budget = calculateBudgetForecast(amenityActualCounts);
  const traffic = calculateTrafficLoad(population, roadNetwork);

  // Formatter
  const formatINR = (val: number) => {
    if (val > 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val > 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${Math.round(val).toLocaleString()}`;
  };

  const formatPop = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return val.toString();
  };

  return (
    <div className="flex flex-col h-full bg-surface-container-low p-6 font-body">
      <h2 className="text-xl font-semibold text-on-surface mb-6 flex items-center gap-2 font-headline shrink-0">
        <span className="material-symbols-outlined text-primary">analytics</span> Market Insights
      </h2>

      <div className="space-y-4 flex-1 overflow-y-auto pr-1 min-h-0 custom-scroll">
        {/* Bento Metric Cards */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/10">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Population</span>
            <span className="text-secondary text-xs font-bold flex items-center">+{(population / 100000).toFixed(1)}% <span className="material-symbols-outlined text-sm">trending_up</span></span>
          </div>
          <div className="text-3xl font-bold text-on-surface tracking-tighter font-headline">{formatPop(population)}</div>
          <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${Math.min(100, (population / 5000000) * 100)}%` }}></div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/10">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Plot Value</span>
            <span className="text-slate-400 text-[10px] font-bold">Model: {hasGenerated ? formatINR(totalValue) : "--"}</span>
          </div>
          <div className="text-3xl font-bold text-on-surface tracking-tighter font-headline">{hasGenerated ? formatINR(avgValue) : "--"}</div>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">Weighted average across all algorithmic sectors</p>
        </div>

        {hasGenerated && (
          <div className="pt-4 mt-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-outline-variant/20 pb-2">Infrastructure Adequacy</h3>
            <div className="space-y-6">
              {Object.values(AMENITY_CONFIG).map(config => {
                const current = amenities[config.id] || 0;
                const ideal = ideals[config.id] || 1;
                const percentage = Math.min(100, Math.round((current / ideal) * 100));
                
                // Use design system colors where matched, or default to CSS var lookup
                let colorClass = "bg-primary";
                let textClass = "text-primary";
                if (percentage < 50) { colorClass = "bg-error"; textClass = "text-error"; }
                else if (percentage >= 100) { colorClass = "bg-secondary"; textClass = "text-secondary"; }

                return (
                  <div key={config.id}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-700">{config.name}</span>
                      <span className={`text-xs font-bold ${textClass}`}>{percentage}%</span>
                    </div>
                    <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                      <div className={`h-full ${colorClass} w-[${percentage}%] rounded-full`} style={{ width: `${percentage}%`, boxShadow: percentage >= 80 ? '0 0 10px rgba(53,37,205,0.3)' : 'none' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {hasGenerated && (
          <>
            {/* Accessibility Heatmap Preview */}
            <div className="mt-6 bg-surface-container-highest/50 p-4 rounded-2xl border border-dashed border-outline-variant/40">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary">accessibility_new</span>
                  <span className="text-xs font-bold text-on-surface uppercase tracking-widest">Accessibility Index</span>
                </div>
                <span className="text-xs font-bold text-primary">{avgAccess.toFixed(2)}/10</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {[0.2, 0.4, 0.8, 0.6, 0.3].map((val, idx) => (
                  <div key={idx} className="aspect-square rounded-sm" style={{ backgroundColor: `rgba(53, 37, 205, ${val})` }}></div>
                ))}
              </div>
            </div>

            {/* Advanced Municipal Analytics */}
            <div className="pt-4 mt-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-outline-variant/20 pb-2">Municipal Framework</h3>
              <div className="space-y-4">
                
                {/* Environmental */}
                <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-xs text-on-surface flex items-center gap-1"><span className="material-symbols-outlined text-[16px] text-secondary">park</span> Env & Green Cover</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mb-2">
                    <span>Provided: {envImpact.providedSqmPerPerson.toFixed(1)} sqm/pp</span>
                    <span>Req: {envImpact.requiredSqmPerPerson} sqm</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div className={`h-full ${envImpact.status === 'Surplus' ? 'bg-secondary' : 'bg-primary'}`} style={{ width: `${envImpact.score * 10}%` }}></div>
                  </div>
                </div>

                {/* Budget Forecast */}
                <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-xs text-on-surface flex items-center gap-1"><span className="material-symbols-outlined text-[16px] text-tertiary">account_balance</span> CapEx / OpEx Budget</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                    <span>Total Capital:</span>
                    <span>₹{budget.totalCapExCr.toFixed(1)} Cr</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Yearly OpEx:</span>
                    <span>₹{budget.totalOpExCr.toFixed(1)} Cr</span>
                  </div>
                </div>

                {/* Traffic Flow */}
                <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-xs text-on-surface flex items-center gap-1"><span className="material-symbols-outlined text-[16px] text-error">traffic</span> Urban Traffic Flow</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${traffic.status === 'Congested' ? 'bg-error-container text-on-error-container' : traffic.status === 'Moderate' ? 'bg-yellow-100 text-yellow-800' : 'bg-secondary-container text-on-secondary-container'}`}>
                      {traffic.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                    <span>Peak Hr Trips:</span>
                    <span>{Math.round(traffic.peakHourTrips).toLocaleString()} PCU</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>V/C Ratio:</span>
                    <span>{traffic.avgVCRatio.toFixed(2)}</span>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
