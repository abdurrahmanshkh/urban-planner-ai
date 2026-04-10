// src/components/TopNav.tsx
"use client";

import React from 'react';

export default function TopNav() {
  return (
    <header className="fixed top-0 w-full z-50 bg-slate-50/60 backdrop-blur-xl shadow-sm flex justify-between items-center h-16 px-6">
      <div className="flex items-center gap-8">
        <span className="text-xl font-bold tracking-tighter text-slate-900">Civic Architect Engine</span>
        
        {/* We can wire these up to visualizer modes if desired later */}
        <nav className="hidden md:flex gap-6 items-center font-headline text-sm font-medium tracking-tight">
          <a className="text-slate-500 hover:text-indigo-600 transition-colors" href="#">Zoning</a>
          <a className="text-slate-500 hover:text-indigo-600 transition-colors" href="#">Grid</a>
          <a className="text-slate-500 hover:text-indigo-600 transition-colors" href="#">Analytics</a>
          <a className="text-slate-500 hover:text-indigo-600 transition-colors" href="#">Assets</a>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <span className="material-symbols-outlined text-slate-400 text-base mr-2">search</span>
          <input 
            className="bg-transparent border-none focus:ring-0 text-sm text-slate-600 w-48 outline-none" 
            placeholder="Search parameters..." 
            type="text"
          />
        </div>
        <button className="text-slate-500 hover:text-indigo-600 transition-colors flex items-center justify-center p-1">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="text-slate-500 hover:text-indigo-600 transition-colors flex items-center justify-center p-1">
          <span className="material-symbols-outlined">settings</span>
        </button>
        <div className="h-8 w-8 rounded-full bg-surface-container overflow-hidden border border-outline-variant/20 ml-2">
          <img 
            alt="Planner Profile" 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbl6wprVa06w_fJQMezNUAZe_fv7UVH_sl1Ts_WX6KrWdWgaSCGhqcKO7h0Q75XuvqqcziM87brCadJqoUMINg8WZ0aicGaTOaF0u2SyC2II25JYtztX7l8RwlvKr8DX66Dn8L3vTL5La47fmkctgBdXM9NSTtPsG-AUtYFSWTnRCN0T39L4uu_Kf_Pw5FzjDoj04Rd7u2R7JgU25nY2ktB1jEUmRtTnzyU-IS-jwYcgKmSugRfdC3knStWfC0RI-S6SYfsAcIYkEB"
          />
        </div>
      </div>
    </header>
  );
}
