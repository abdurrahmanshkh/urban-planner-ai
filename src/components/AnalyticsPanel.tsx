// src/components/AnalyticsPanel.tsx
"use client";

import { motion } from "framer-motion";
import { Activity, IndianRupee, Users } from "lucide-react";

export default function AnalyticsPanel() {
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
          <MetricCard icon={<Users size={18} />} title="Est. Population" value="--" />
          <MetricCard icon={<IndianRupee size={18} />} title="Avg. Land Value" value="--" />
          <MetricCard icon={<Activity size={18} />} title="Accessibility Score" value="-- / 4.0" />
        </div>

        <div className="mt-8">
          <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Amenity Adequacy</h4>
          <div className="space-y-3">
            {/* Placeholders for our future math-based adequacy checks */}
            <AdequacyBar label="Schools" percentage={0} />
            <AdequacyBar label="Hospitals" percentage={0} />
            <AdequacyBar label="Parks" percentage={0} />
          </div>
        </div>
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

function AdequacyBar({ label, percentage }: { label: string, percentage: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="text-slate-400">{percentage}%</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-slate-300 transition-all duration-500" style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}