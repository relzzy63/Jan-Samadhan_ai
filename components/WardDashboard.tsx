"use client";

import React, { useState, useEffect } from 'react';
import { useTickets } from '@/context/TicketContext';
import {
  GrievanceTicket,
  TicketStatus,
  Department,
  DEPARTMENT_CONFIGS,
  WARDS_LIST,
} from '@/types';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  MapPin,
  User,
  Phone,
  Eye,
  Camera,
  Check,
  RotateCcw,
  Volume2,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  FileCheck2,
  ChevronRight,
  X,
} from 'lucide-react';

const RESOLUTION_PHOTO_PRESETS = [
  {
    label: 'SWM: Garbage Cleared & Sanitized',
    url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop&q=60',
    dept: 'Solid Waste Management',
  },
  {
    label: 'Water: Pipe Repaired & Valve Replaced',
    url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=60',
    dept: 'Water Supply & Sewerage',
  },
  {
    label: 'Electrical: New LED Light Pole Installed',
    url: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=600&auto=format&fit=crop&q=60',
    dept: 'Electrical & Streetlighting',
  },
  {
    label: 'PWD: Rapid Asphalt Pothole Repair',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8?w=600&auto=format&fit=crop&q=60',
    dept: 'Public Works (PWD)',
  },
];

// Helper to calculate countdown time in real-time
function getRemainingTime(deadlineIso: string, status: TicketStatus) {
  if (status === 'Resolved') {
    return { text: 'Resolved', isBreached: false, isUrgent: false, hoursLeft: 999 };
  }

  const now = Date.now();
  const deadline = new Date(deadlineIso).getTime();
  const diffMs = deadline - now;

  if (diffMs <= 0) {
    const overdueMinutes = Math.abs(Math.floor(diffMs / 60000));
    const h = Math.floor(overdueMinutes / 60);
    const m = overdueMinutes % 60;
    return {
      text: `SLA BREACHED (+${h}h ${m}m)`,
      isBreached: true,
      isUrgent: true,
      hoursLeft: -1,
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return {
    text: `Remaining: ${formatted}`,
    isBreached: false,
    isUrgent: hours < 6, // Pulsing red when < 6 hours!
    hoursLeft: hours,
  };
}

export default function WardDashboard() {
  const { tickets, updateTicketStatus, resolveTicketWithProof, resetToDefaultTickets, isMounted } =
    useTickets();

  // Tick state to force re-render every second for live SLA clocks
  const [, setTick] = useState<number>(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter states
  const [selectedWard, setSelectedWard] = useState<string>('All');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Resolve Modal State
  const [resolvingTicket, setResolvingTicket] = useState<GrievanceTicket | null>(null);
  const [proofImage, setProofImage] = useState<string>(RESOLUTION_PHOTO_PRESETS[0].url);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');

  if (!isMounted) {
    return (
      <div className="w-full flex items-center justify-center py-20 text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <span>Synchronizing Ward Operations...</span>
        </div>
      </div>
    );
  }

  // Calculate KPIs
  const totalCount = tickets.length;
  const pendingCount = tickets.filter((t) => t.status === 'Pending').length;
  const inProgressCount = tickets.filter((t) => t.status === 'In Progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'Resolved').length;
  const activeCount = pendingCount + inProgressCount;
  const urgentCount = tickets.filter((t) => t.urgency === 'High' && t.status !== 'Resolved').length;

  // Dynamic SLA Compliance rate
  const breachedCount = tickets.filter((t) => {
    if (t.status === 'Resolved') return false;
    return new Date(t.deadline).getTime() < Date.now();
  }).length;
  const complianceRate =
    totalCount > 0 ? (((totalCount - breachedCount) / totalCount) * 100).toFixed(1) : '100.0';

  // Apply filters
  const filteredTickets = tickets.filter((t) => {
    if (selectedWard !== 'All' && t.ward !== selectedWard) return false;
    if (selectedDept !== 'All' && t.department !== selectedDept) return false;
    if (selectedStatus !== 'All' && t.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTrack = t.trackingId.toLowerCase().includes(q);
      const matchName = t.citizenName.toLowerCase().includes(q);
      const matchText = t.originalText.toLowerCase().includes(q);
      const matchTrans = t.englishTranslation.toLowerCase().includes(q);
      if (!matchTrack && !matchName && !matchText && !matchTrans) return false;
    }
    return true;
  });

  const openResolveModal = (t: GrievanceTicket) => {
    setResolvingTicket(t);
    // Find matching default preset for department
    const preset = RESOLUTION_PHOTO_PRESETS.find((p) => p.dept === t.department);
    setProofImage(preset ? preset.url : RESOLUTION_PHOTO_PRESETS[0].url);
    setResolutionNotes(`Action verified at ${t.ward}. Resolved by BBMP Ward Field Engineer.`);
  };

  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingTicket) return;
    resolveTicketWithProof(resolvingTicket.id, proofImage, resolutionNotes);
    setResolvingTicket(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            BBMP Ward Command Center • Real-Time Dispatch
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            Civic Operations & SLA Dashboard
          </h1>
          <p className="text-slate-400 text-xs md:text-sm">
            Live grievance intake, AI vernacular translations, and statutory resolution tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={resetToDefaultTickets}
            className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all"
            title="Reset to 4 initial default Bengaluru seed tickets"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Seed Data</span>
          </button>
        </div>
      </div>

      {/* Top KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="glass-panel p-4 rounded-2xl border border-slate-700/60 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Total Complaints</span>
            <span className="text-2xl font-extrabold text-white font-mono mt-0.5 block">
              {totalCount}
            </span>
            <span className="text-[11px] text-slate-500">Across Bengaluru Wards</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-800/80 text-slate-300 flex items-center justify-center border border-slate-700">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-700/60 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Active / Pending</span>
            <span className="text-2xl font-extrabold text-amber-400 font-mono mt-0.5 block">
              {activeCount}
            </span>
            <span className="text-[11px] text-amber-400/80">
              {pendingCount} Pending • {inProgressCount} In Progress
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-700/60 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">High Urgency</span>
            <span className="text-2xl font-extrabold text-red-400 font-mono mt-0.5 block">
              {urgentCount}
            </span>
            <span className="text-[11px] text-red-400/80">Requires Priority Crew</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center border border-red-500/30">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-700/60 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">SLA Compliance</span>
            <span className="text-2xl font-extrabold text-emerald-400 font-mono mt-0.5 block">
              {complianceRate}%
            </span>
            <span className="text-[11px] text-emerald-400/80">
              {resolvedCount} Resolved Tickets
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-700/60 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID (JS-BLR-xxxx) or keyword..."
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Ward Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="All">All Municipal Wards</option>
              {WARDS_LIST.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="All">All Departments</option>
              <option value="Solid Waste Management">Solid Waste Management (SWM)</option>
              <option value="Water Supply & Sewerage">Water Supply & Sewerage (BWSSB)</option>
              <option value="Electrical & Streetlighting">Electrical & Streetlighting (BESCOM)</option>
              <option value="Public Works (PWD)">Public Works (BBMP PWD)</option>
            </select>
          </div>

          {/* Status Tabs */}
          <div className="md:col-span-2 flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {['All', 'Pending', 'In Progress', 'Resolved'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStatus(st)}
                className={`flex-1 py-1 px-1 rounded-lg text-[10px] font-bold transition-all truncate ${
                  selectedStatus === st
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st === 'In Progress' ? 'Active' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ticket Cards Grid (Dual-View Design) */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-300">No grievances match filters</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your ward, department, or search query.
            </p>
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const deptConfig = DEPARTMENT_CONFIGS[ticket.department] || {
              name: ticket.department,
              code: 'GEN',
              slaHours: 24,
              badgeBg: 'bg-slate-500/10',
              badgeText: 'text-slate-300',
              borderColor: 'border-slate-500/30',
              officerRole: 'Ward Officer',
            };

            const remaining = getRemainingTime(ticket.deadline, ticket.status);

            return (
              <div
                key={ticket.id}
                className={`glass-panel rounded-2xl border p-5 transition-all relative overflow-hidden ${
                  remaining.isBreached
                    ? 'border-red-500/50 bg-red-950/10'
                    : remaining.isUrgent && ticket.status !== 'Resolved'
                    ? 'border-amber-500/50 bg-amber-950/10'
                    : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Top Badge & Tracking Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/70 pb-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm font-extrabold text-white bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-700/70">
                      {ticket.trackingId}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${deptConfig.badgeBg} ${deptConfig.badgeText} ${deptConfig.borderColor}`}
                    >
                      {ticket.department}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        ticket.urgency === 'High'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : ticket.urgency === 'Medium'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {ticket.urgency} Urgency
                    </span>
                  </div>

                  {/* Real-time SLA Countdown */}
                  <div className="flex items-center gap-2">
                    {ticket.status === 'Resolved' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Resolved
                      </span>
                    ) : (
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border ${
                          remaining.isBreached
                            ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                            : remaining.isUrgent
                            ? 'bg-red-500/15 text-red-400 border-red-500/30 animate-pulse'
                            : 'bg-slate-900/90 text-amber-300 border-slate-700'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{remaining.text}</span>
                      </div>
                    )}

                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        ticket.status === 'Pending'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : ticket.status === 'In Progress'
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>
                </div>

                {/* Dual-View Grievance Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Left Column: Citizen Vernacular Input */}
                  <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-1.5">
                      <span className="flex items-center gap-1.5 font-medium text-slate-300">
                        {ticket.inputMode === 'voice' ? (
                          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : null}
                        Citizen Voice/Text Input ({ticket.originalLanguage})
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                        {ticket.inputMode}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-slate-200 font-mono italic leading-relaxed">
                      "{ticket.originalText}"
                    </p>
                  </div>

                  {/* Right Column: Translated Municipal English */}
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/20 space-y-2">
                    <div className="flex items-center justify-between text-xs text-emerald-400 border-b border-slate-800 pb-1.5">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Sparkles className="w-3.5 h-3.5" />
                        Translated Municipal Action Summary
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        SLA: {ticket.slaHours}h
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-white font-medium leading-relaxed">
                      {ticket.englishTranslation}
                    </p>
                  </div>
                </div>

                {/* Metadata Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-1">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1 text-slate-300 font-medium">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      {ticket.citizenName}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-slate-400">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      {ticket.phone}
                    </span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      {ticket.ward} • {ticket.landmark}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {ticket.status === 'Pending' && (
                      <button
                        type="button"
                        onClick={() => updateTicketStatus(ticket.id, 'In Progress')}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20"
                      >
                        Move to In Progress
                      </button>
                    )}

                    {ticket.status !== 'Resolved' && (
                      <button
                        type="button"
                        onClick={() => openResolveModal(ticket)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Resolve Issue</span>
                      </button>
                    )}

                    {ticket.status === 'Resolved' && ticket.proofImage && (
                      <button
                        type="button"
                        onClick={() => openResolveModal(ticket)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-medium text-xs transition-all flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Proof-of-Work</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Resolved Info Strip */}
                {ticket.status === 'Resolved' && ticket.resolutionNotes && (
                  <div className="mt-3 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <span className="font-semibold text-emerald-400 flex items-center gap-1">
                        <FileCheck2 className="w-3.5 h-3.5" />
                        Resolution Notes:
                      </span>
                      <p className="text-slate-300">{ticket.resolutionNotes}</p>
                    </div>
                    {ticket.proofImage && (
                      <img
                        src={ticket.proofImage}
                        alt="Proof of work"
                        className="w-16 h-12 rounded-lg object-cover border border-emerald-500/40 flex-shrink-0"
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Proof-of-Work Resolution Modal */}
      {resolvingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-emerald-500/40 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Field Verification & Closure
                </span>
                <h3 className="text-lg font-bold text-white font-mono">
                  Resolve {resolvingTicket.trackingId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setResolvingTicket(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmResolve} className="space-y-4">
              {/* Photo Proof Selection Presets */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  Select Proof-of-Work Photo (Required for SMS Alert)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {RESOLUTION_PHOTO_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setProofImage(preset.url)}
                      className={`p-2 rounded-xl text-left border transition-all flex items-center gap-2.5 ${
                        proofImage === preset.url
                          ? 'border-emerald-500 bg-emerald-500/10 text-white'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                      <span className="text-[11px] font-medium leading-tight">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo Preview */}
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900/80 p-2 flex items-center gap-3">
                <img
                  src={proofImage}
                  alt="Selected proof"
                  className="w-20 h-14 object-cover rounded-lg border border-slate-700"
                />
                <div className="text-xs text-slate-400">
                  <span className="text-emerald-400 font-semibold block">Proof Image Attached</span>
                  <span>Will be embedded in citizen resolution SMS notification.</span>
                </div>
              </div>

              {/* Resolution Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Ward Officer Resolution Remarks
                </label>
                <textarea
                  rows={3}
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Specify crew dispatch details, parts replaced, or clearance timestamp..."
                  className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingTicket(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
                >
                  <Check className="w-4 h-4" />
                  <span>Mark Resolved & Alert Citizen</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
