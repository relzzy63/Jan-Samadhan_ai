"use client";

import React, { useState } from 'react';
import CitizenPortal from '@/components/CitizenPortal';
import WardDashboard from '@/components/WardDashboard';
import { useTickets } from '@/context/TicketContext';
import {
  Building2,
  Users,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Layers,
  Radio,
  FileCheck2,
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'citizen' | 'ward'>('citizen');
  const { tickets } = useTickets();

  const activeCount = tickets.filter((t) => t.status !== 'Resolved').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 font-black text-xl">
              JS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base md:text-lg text-white tracking-tight">
                  Jan-Samadhan <span className="text-emerald-400">AI</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Ward Operations: Live
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Bengaluru Municipal Corporation (BBMP) AI Redressal System
              </p>
            </div>
          </div>

          {/* Single-Click Mode Switcher */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('citizen')}
              className={`flex items-center gap-2 py-1.5 px-3 md:px-4 rounded-lg text-xs md:text-sm font-bold transition-all ${
                activeTab === 'citizen'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Citizen Portal</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ward')}
              className={`flex items-center gap-2 py-1.5 px-3 md:px-4 rounded-lg text-xs md:text-sm font-bold transition-all relative ${
                activeTab === 'ward'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Ward Officer</span>
              {activeCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    activeTab === 'ward'
                      ? 'bg-slate-950 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {activeCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {activeTab === 'citizen' ? (
          <CitizenPortal onSwitchToDashboard={() => setActiveTab('ward')} />
        ) : (
          <WardDashboard />
        )}
      </main>

      {/* Municipal Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/90 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Jan-Samadhan AI • Zero-Cost Hackathon MVP</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Browser-Native Speech API (kn-IN / hi-IN / en-IN)</span>
            <span>•</span>
            <span>Fail-Safe Gemini & Rule Fallback Engine</span>
            <span>•</span>
            <span>Statutory BBMP SLAs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
