"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { GrievanceTicket, TicketStatus, Department, TicketReporter } from '@/types';
import { calculatePriorityScore } from '@/utils/priorityQueue';

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  timestamp: string;
}

interface AddTicketResult {
  ticket: GrievanceTicket;
  isMerged: boolean;
}

interface TicketContextType {
  tickets: GrievanceTicket[];
  isMounted: boolean;
  addTicket: (ticket: GrievanceTicket) => AddTicketResult;
  updateTicketStatus: (id: string, status: TicketStatus) => void;
  resolveTicketWithProof: (id: string, proofImage: string, notes: string) => void;
  resetToDefaultTickets: () => void;
  toasts: ToastNotification[];
  dismissToast: (id: string) => void;
  showToast: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
}

const STORAGE_KEY = 'jan_samadhan_tickets_v2'; // Bumped key for upgraded schema

// 4 realistic default Bengaluru seed tickets with crowd escalation history
const getInitialSeedTickets = (): GrievanceTicket[] => [
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
    reportCount: 3, // Escalated by 3 citizens!
    reporters: [
      { name: 'Ramesh Gowda', phone: '+91 98450 12345', timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString() },
      { name: 'Manjunath K', phone: '+91 98860 55443', timestamp: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString() },
      { name: 'Sunita Patil', phone: '+91 97410 99887', timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString() },
    ],
    priorityScore: 78,
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
    reportCount: 2, // 2 citizens
    reporters: [
      { name: 'Priya Sharma', phone: '+91 97110 54321', timestamp: new Date(Date.now() - 7 * 3600 * 1000).toISOString() },
      { name: 'Rohan Verma', phone: '+91 98440 22331', timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString() },
    ],
    priorityScore: 72,
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
    reportCount: 1,
    reporters: [
      { name: 'Karthik Rao', phone: '+91 94480 98765', timestamp: new Date(Date.now() - 10 * 3600 * 1000).toISOString() },
    ],
    priorityScore: 38,
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
    reportCount: 4,
    reporters: [
      { name: 'Ananya Deshmukh', phone: '+91 99000 11223', timestamp: new Date(Date.now() - 52 * 3600 * 1000).toISOString() },
      { name: 'Rajiv Nair', phone: '+91 98800 44556', timestamp: new Date(Date.now() - 50 * 3600 * 1000).toISOString() },
      { name: 'Sneha Gupta', phone: '+91 97310 88776', timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString() },
      { name: 'Vijay Kumar', phone: '+91 99450 33221', timestamp: new Date(Date.now() - 46 * 3600 * 1000).toISOString() },
    ],
    priorityScore: 85,
  },
];

const TicketContext = createContext<TicketContextType | undefined>(undefined);

// Helper function to detect duplicate / overlapping reports
function isDuplicateComplaint(incoming: GrievanceTicket, existing: GrievanceTicket): boolean {
  // 1. Must be the exact SAME ward and SAME department
  if (incoming.ward !== existing.ward || incoming.department !== existing.department) {
    return false;
  }

  // 2. Tokenize landmark
  const extractTokens = (str: string) =>
    (str || '')
      .toLowerCase()
      .replace(/[^a-z0-9\u0C80-\u0CFF\u0900-\u097F]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !['near', 'opposite', 'road', 'main', 'cross', 'gate', 'ward', 'bengaluru', 'the', 'and', 'with'].includes(w));

  const incomingLandmarkTokens = extractTokens(incoming.landmark);
  const existingLandmarkTokens = extractTokens(existing.landmark);

  // Check if significant landmark tokens overlap (e.g. "bellandur", "lake", "hsr", "sector", "14th", "bda", "80ft")
  const landmarkOverlap = incomingLandmarkTokens.some((t) => existingLandmarkTokens.includes(t));

  // 3. Tokenize problem text & translation
  const incomingTextTokens = [
    ...extractTokens(incoming.originalText),
    ...extractTokens(incoming.englishTranslation),
  ];
  const existingTextTokens = [
    ...extractTokens(existing.originalText),
    ...extractTokens(existing.englishTranslation),
  ];

  // Specific domain hazard keywords
  const domainKeywords = [
    'garbage', 'waste', 'trash', 'dump', 'bin', 'clean', 'ಕಸ', 'ಕಸದ', 'कूड़ा', 'kachra', 'safai',
    'water', 'pipe', 'leak', 'burst', 'flood', 'sewage', 'drain', 'ನೀರು', 'पानी', 'jal',
    'light', 'pole', 'spark', 'wire', 'dark', 'streetlight', 'ಬೆಳಕು', 'बिजली', 'करंट',
    'pothole', 'road', 'footpath', 'asphalt', 'ರಸ್ತೆ', 'ಗುಂಡಿ', 'सड़क', 'गड्ढा',
  ];

  const matchedDomainKeywords = incomingTextTokens.filter(
    (t) => domainKeywords.includes(t) && existingTextTokens.includes(t)
  );

  // If same landmark and same problem keyword -> definitely a duplicate
  if (landmarkOverlap && matchedDomainKeywords.length > 0) {
    return true;
  }

  // If text is virtually identical or shares 3+ keywords
  const sharedTextTokens = incomingTextTokens.filter((t) => existingTextTokens.includes(t));
  if (sharedTextTokens.length >= 3) {
    return true;
  }

  return false;
}

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
          // Recalculate priority scores dynamically with live time
          const refreshed = parsed.map((t: GrievanceTicket) => ({
            ...t,
            priorityScore: calculatePriorityScore(t),
            reportCount: t.reportCount || 1,
            reporters: t.reporters || [{ name: t.citizenName, phone: t.phone, timestamp: t.createdAt }],
          }));
          setTickets(refreshed);
          setIsMounted(true);
          return;
        }
      }
      // If empty or first run, initialize with default seed tickets
      const seeds = getInitialSeedTickets();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeds));
      setTickets(seeds);
    } catch (e) {
      console.warn('Failed to access localStorage, using defaults in memory', e);
      setTickets(getInitialSeedTickets());
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

  /**
   * Smart Deduplication & Crowd Multiplier Engine
   */
  const addTicket = (incoming: GrievanceTicket): AddTicketResult => {
    // 1. Search for an existing active ticket in the same ward & department
    const existingIndex = tickets.findIndex(
      (t) => t.status !== 'Resolved' && isDuplicateComplaint(incoming, t)
    );

    if (existingIndex !== -1) {
      // DEDUPLICATION MATCH FOUND: Crowd Escalation Triggered!
      const existing = tickets[existingIndex];
      const newReportCount = (existing.reportCount || 1) + 1;
      const newReporter: TicketReporter = {
        name: incoming.citizenName,
        phone: incoming.phone,
        timestamp: new Date().toISOString(),
      };
      const updatedReporters = [...(existing.reporters || []), newReporter];

      // Recalculate priority score with updated crowd count
      const updatedScore = calculatePriorityScore({
        ...existing,
        reportCount: newReportCount,
      });

      const updatedTicket: GrievanceTicket = {
        ...existing,
        reportCount: newReportCount,
        reporters: updatedReporters,
        priorityScore: updatedScore,
      };

      // Move the updated/escalated ticket to the top of the feed so it is immediately visible!
      const remainingTickets = tickets.filter((_, idx) => idx !== existingIndex);
      const updatedList = [updatedTicket, ...remainingTickets];
      saveTickets(updatedList);
      console.log(`>>> [TicketContext] Merged into ticket ${existing.trackingId}. Total count now ${newReportCount}.`);

      // Trigger Crowd Escalation alert toast
      showToast(
        '🔥 Crowd Escalation Activated',
        `Duplicate hazard in ${existing.ward}! Priority escalated to ${updatedScore}/100 by ${incoming.citizenName} (${newReportCount} citizens affected).`,
        'warning'
      );

      return {
        ticket: { ...updatedTicket, isMerged: true },
        isMerged: true,
      };
    }

    // NO MATCH: Register as a new unique ticket
    const initialReporters: TicketReporter[] = [
      {
        name: incoming.citizenName,
        phone: incoming.phone,
        timestamp: incoming.createdAt || new Date().toISOString(),
      },
    ];
    const initialScore = calculatePriorityScore({
      ...incoming,
      reportCount: 1,
    });

    const newTicket: GrievanceTicket = {
      ...incoming,
      reportCount: 1,
      reporters: initialReporters,
      priorityScore: initialScore,
      isMerged: false,
    };

    const updated = [newTicket, ...tickets];
    saveTickets(updated);
    console.log(`>>> [TicketContext] Registered NEW ticket ${newTicket.trackingId}. Total tickets: ${updated.length}`);

    showToast(
      'Grievance Registered',
      `Assigned to ${newTicket.department} with Initial Priority ${newTicket.priorityScore}/100 (ID: ${newTicket.trackingId})`,
      'info'
    );

    return {
      ticket: newTicket,
      isMerged: false,
    };
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
    const citizenCount = target?.reportCount || 1;

    // Simulated Citizen SMS notification toast (alerts all reporters)
    showToast(
      '📲 Citizen SMS Broadcast Sent',
      `Alerted ${citizenCount} citizen(s): Grievance ${trackingId} marked RESOLVED with photo proof.`,
      'success'
    );
  };

  const resetToDefaultTickets = () => {
    const seeds = getInitialSeedTickets();
    saveTickets(seeds);
    showToast('Reset Complete', 'Loaded default Bengaluru municipal seed tickets with crowd history', 'info');
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
