"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { GrievanceTicket, TicketStatus, Department } from '@/types';

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  timestamp: string;
}

interface TicketContextType {
  tickets: GrievanceTicket[];
  isMounted: boolean;
  addTicket: (ticket: GrievanceTicket) => void;
  updateTicketStatus: (id: string, status: TicketStatus) => void;
  resolveTicketWithProof: (id: string, proofImage: string, notes: string) => void;
  resetToDefaultTickets: () => void;
  toasts: ToastNotification[];
  dismissToast: (id: string) => void;
  showToast: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
}

const STORAGE_KEY = 'jan_samadhan_tickets_v1';

// 4 realistic default Bengaluru seed tickets
const DEFAULT_TICKETS: GrievanceTicket[] = [
  {
    id: 'seed-swm-1042',
    trackingId: 'JS-BLR-2026-1042',
    citizenName: 'Ramesh Gowda',
    phone: '+91 98450 12345',
    ward: 'Ward 150 - Bellandur',
    landmark: 'Opposite Bellandur Lake Gate 2',
    inputMode: 'voice',
    originalLanguage: 'Kannada',
    originalText: 'ಕಸದ ತೊಟ್ಟಿ ತುಂಬಿ ರಸ್ತೆಗೆಲ್ಲ ಹರಡಿದೆ, ದಯವಿಟ್ಟು ಬೇಗ ಕ್ಲೀನ್ ಮಾಡಿಸಿ.',
    englishTranslation: 'Garbage bin overflowing onto the main road, please clean urgently.',
    department: 'Solid Waste Management',
    urgency: 'High',
    slaHours: 24,
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), // 4 hrs ago
    deadline: new Date(Date.now() + 20 * 3600 * 1000).toISOString(), // 20 hrs left
    status: 'Pending',
  },
  {
    id: 'seed-water-1088',
    trackingId: 'JS-BLR-2026-1088',
    citizenName: 'Priya Sharma',
    phone: '+91 97110 54321',
    ward: 'Ward 174 - HSR Layout',
    landmark: 'Sector 2, 27th Main Junction',
    inputMode: 'text',
    originalLanguage: 'Hindi',
    originalText: 'मेन रोड पर पानी का पाइप फट गया है और पूरा रास्ता भर गया है।',
    englishTranslation: 'Water supply pipeline burst on main road causing severe waterlogging.',
    department: 'Water Supply & Sewerage',
    urgency: 'High',
    slaHours: 12,
    createdAt: new Date(Date.now() - 7 * 3600 * 1000).toISOString(), // 7 hrs ago
    deadline: new Date(Date.now() + 5 * 3600 * 1000).toISOString(), // 5 hrs left (< 6h warning!)
    status: 'In Progress',
  },
  {
    id: 'seed-light-1104',
    trackingId: 'JS-BLR-2026-1104',
    citizenName: 'Karthik Rao',
    phone: '+91 94480 98765',
    ward: 'Ward 112 - Indiranagar',
    landmark: '14th Main near BDA Complex',
    inputMode: 'text',
    originalLanguage: 'English',
    originalText: 'Broken streetlight pole sparking near 14th Main junction after evening rain.',
    englishTranslation: 'Broken streetlight pole sparking near 14th Main junction after evening rain.',
    department: 'Electrical & Streetlighting',
    urgency: 'Medium',
    slaHours: 36,
    createdAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    deadline: new Date(Date.now() + 26 * 3600 * 1000).toISOString(),
    status: 'Pending',
  },
  {
    id: 'seed-pwd-1029',
    trackingId: 'JS-BLR-2026-1029',
    citizenName: 'Ananya Deshmukh',
    phone: '+91 99000 11223',
    ward: 'Ward 80 - Koramangala',
    landmark: '80ft Road Signal, 4th Block',
    inputMode: 'text',
    originalLanguage: 'English',
    originalText: 'Deep pothole near 80ft road signal creating traffic jam and accident risk.',
    englishTranslation: 'Deep pothole near 80ft road signal creating traffic jam and accident risk.',
    department: 'Public Works (PWD)',
    urgency: 'Medium',
    slaHours: 48,
    createdAt: new Date(Date.now() - 52 * 3600 * 1000).toISOString(),
    deadline: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    status: 'Resolved',
    proofImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8?w=500&auto=format&fit=crop&q=60',
    resolutionNotes: 'BBMP rapid asphalt patching team completed resurfacing. Verified by Ward 80 Engineer.',
  },
];

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export function TicketProvider({ children }: { children: React.ReactNode }) {
  const [tickets, setTickets] = useState<GrievanceTicket[]>([]);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Hydration safety: only access localStorage once component has mounted on client
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTickets(parsed);
          setIsMounted(true);
          return;
        }
      }
      // If empty or first run, initialize with default seed tickets
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TICKETS));
      setTickets(DEFAULT_TICKETS);
    } catch (e) {
      console.warn('Failed to access localStorage, using defaults in memory', e);
      setTickets(DEFAULT_TICKETS);
    } finally {
      setIsMounted(true);
    }
  }, []);

  const saveTickets = (updated: GrievanceTicket[]) => {
    setTickets(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving tickets to localStorage', e);
    }
  };

  const showToast = (title: string, message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newToast: ToastNotification = {
      id,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setToasts((prev) => [newToast, ...prev]);

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addTicket = (ticket: GrievanceTicket) => {
    const updated = [ticket, ...tickets];
    saveTickets(updated);
    showToast(
      'Grievance Registered',
      `Assigned to ${ticket.department} with Tracking ID ${ticket.trackingId}`,
      'info'
    );
  };

  const updateTicketStatus = (id: string, status: TicketStatus) => {
    const updated = tickets.map((t) => (t.id === id ? { ...t, status } : t));
    saveTickets(updated);
    const target = tickets.find((t) => t.id === id);
    if (target) {
      showToast(
        'Status Updated',
        `Ticket ${target.trackingId} moved to "${status}"`,
        'info'
      );
    }
  };

  const resolveTicketWithProof = (id: string, proofImage: string, notes: string) => {
    const updated = tickets.map((t) =>
      t.id === id
        ? {
            ...t,
            status: 'Resolved' as TicketStatus,
            proofImage,
            resolutionNotes: notes,
          }
        : t
    );
    saveTickets(updated);

    const target = tickets.find((t) => t.id === id);
    const trackingId = target ? target.trackingId : id;

    // Simulated Citizen SMS toast notification
    showToast(
      '📲 Citizen SMS Sent',
      `Citizen alerted: Grievance ${trackingId} marked RESOLVED with photo proof.`,
      'success'
    );
  };

  const resetToDefaultTickets = () => {
    saveTickets(DEFAULT_TICKETS);
    showToast('Reset Complete', 'Loaded 4 default Bengaluru municipal seed tickets', 'info');
  };

  return (
    <TicketContext.Provider
      value={{
        tickets,
        isMounted,
        addTicket,
        updateTicketStatus,
        resolveTicketWithProof,
        resetToDefaultTickets,
        toasts,
        dismissToast,
        showToast,
      }}
    >
      {children}
    </TicketContext.Provider>
  );
}

export function useTickets() {
  const context = useContext(TicketContext);
  if (!context) {
    throw new Error('useTickets must be used within a TicketProvider');
  }
  return context;
}
