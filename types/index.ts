export type Department = 
  | 'Solid Waste Management' 
  | 'Water Supply & Sewerage' 
  | 'Electrical & Streetlighting' 
  | 'Public Works (PWD)';

export type Urgency = 'Low' | 'Medium' | 'High';

export type TicketStatus = 'Pending' | 'In Progress' | 'Resolved';

export type SupportedLanguage = 
  | 'Kannada' 
  | 'Hindi' 
  | 'English' 
  | 'Auto-Detect'
  | 'Tamil'
  | 'Telugu'
  | 'Malayalam'
  | 'Bengali'
  | 'Marathi'
  | 'Gujarati'
  | 'Odia'
  | 'Punjabi'
  | 'Urdu'
  | string;

export interface TicketReporter {
  name: string;
  phone: string;
  timestamp: string; // ISO
}

export interface GrievanceTicket {
  id: string;
  trackingId: string; // e.g. "JS-BLR-2026-1042"
  citizenName: string;
  phone: string;
  ward: string; // e.g. "Ward 150 - Bellandur"
  landmark: string;
  inputMode: 'voice' | 'text';
  originalLanguage: SupportedLanguage;
  originalText: string;
  englishTranslation: string;
  department: Department;
  urgency: Urgency;
  slaHours: number; // SWM: 24, Water: 12, Electrical: 36, PWD: 48
  createdAt: string; // ISO
  deadline: string; // ISO
  status: TicketStatus;
  proofImage?: string;
  resolutionNotes?: string;
  
  reportCount: number; // Defaults to 1; increments when duplicate reports are clustered
  reporters: TicketReporter[]; // Full list of citizens reporting this hazard
  priorityScore: number; // Calculated dynamically from 0 to 100
  isMerged?: boolean; // Set to true when a submission merged into an existing Master Ticket
  triagedBy?: string; // e.g. "Gemini 2.0 Flash (Cloud AI)" or "Municipal Rule Engine (Fail-safe)"
  aiStatusMessage?: string; // Status or explanation of AI processing
}

export interface DepartmentConfig {
  name: Department;
  code: string;
  slaHours: number;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  accentColor: string;
  officerRole: string;
}

export const DEPARTMENT_CONFIGS: Record<Department, DepartmentConfig> = {
  'Solid Waste Management': {
    name: 'Solid Waste Management',
    code: 'SWM',
    slaHours: 24,
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    accentColor: '#10b981',
    officerRole: 'Chief SWM Marshall',
  },
  'Water Supply & Sewerage': {
    name: 'Water Supply & Sewerage',
    code: 'BWSSB',
    slaHours: 12,
    badgeBg: 'bg-sky-500/15',
    badgeText: 'text-sky-400',
    borderColor: 'border-sky-500/30',
    accentColor: '#0ea5e9',
    officerRole: 'BWSSB Executive Engineer',
  },
  'Electrical & Streetlighting': {
    name: 'Electrical & Streetlighting',
    code: 'BESCOM',
    slaHours: 36,
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    accentColor: '#f59e0b',
    officerRole: 'BESCOM Line Superintendent',
  },
  'Public Works (PWD)': {
    name: 'Public Works (PWD)',
    code: 'PWD',
    slaHours: 48,
    badgeBg: 'bg-purple-500/15',
    badgeText: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    accentColor: '#8b5cf6',
    officerRole: 'BBMP Ward Engineer (Roads)',
  },
};

export const WARDS_LIST = [
  'Ward 150 - Bellandur',
  'Ward 174 - HSR Layout',
  'Ward 112 - Indiranagar',
  'Ward 80 - Koramangala',
];
