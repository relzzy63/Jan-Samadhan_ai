"use client";

import React from 'react';
import { useTickets } from '@/context/TicketContext';
import { MessageSquare, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, dismissToast } = useTickets();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSms = toast.title.includes('SMS') || toast.message.includes('SMS');
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl p-4 shadow-2xl border transition-all animate-in slide-in-from-bottom-5 fade-in duration-300 flex items-start gap-3 backdrop-blur-xl ${
              isSms
                ? 'bg-slate-900/95 border-emerald-500/50 text-white shadow-emerald-500/10'
                : toast.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500/40 text-white'
                : 'bg-slate-900/95 border-sky-500/40 text-white'
            }`}
          >
            <div className="mt-0.5 flex-shrink-0">
              {isSms ? (
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                  <MessageSquare className="w-4 h-4" />
                </div>
              ) : toast.type === 'success' ? (
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Info className="w-4 h-4" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-bold text-white tracking-wide">
                  {toast.title}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {toast.timestamp}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-snug">
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-slate-500 hover:text-white p-1 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
