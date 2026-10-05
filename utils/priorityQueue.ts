import { GrievanceTicket, Urgency } from '@/types';

/**
 * Calculates a dynamic priority score from 0 to 100 for a civic grievance ticket.
 *
 * Scoring Components:
 * 1. Base Severity Weight (Max 40 pts):
 *    - High / Emergency = 40 pts
 *    - Medium = 25 pts
 *    - Low = 10 pts
 *
 * 2. Crowd Multiplier / Duplicate Clustering (Max 35 pts):
 *    - Formula: Math.min((reportCount - 1) * 12, 35)
 *    - 1 citizen = 0 pts
 *    - 2 citizens = 12 pts
 *    - 3 citizens = 24 pts
 *    - 4+ citizens = 35 pts (Maximum emergency crowd ceiling)
 *
 * 3. SLA Time Pressure (Max 25 pts):
 *    - Proportion of statutory SLA resolution window elapsed:
 *      (now - createdAt) / (deadline - createdAt) * 25
 *    - Caps at 25 pts if deadline is reached or breached.
 *
 * Total Score = Math.min(Math.round(Base + Crowd + SLA Pressure), 100)
 */
export function calculatePriorityScore(
  ticket: Partial<GrievanceTicket> & {
    urgency?: Urgency;
    reportCount?: number;
    createdAt?: string;
    deadline?: string;
  }
): number {
  // 1. Base Severity (Max 40 pts)
  let baseScore = 25; // Default Medium
  if (ticket.urgency === 'High') {
    baseScore = 40;
  } else if (ticket.urgency === 'Low') {
    baseScore = 10;
  }

  // 2. Crowd Multiplier (Max 35 pts)
  const count = Math.max(1, ticket.reportCount || 1);
  const crowdScore = Math.min((count - 1) * 12, 35);

  // 3. SLA Time Pressure (Max 25 pts)
  let slaPressure = 0;
  try {
    const now = Date.now();
    const created = new Date(ticket.createdAt || now).getTime();
    const deadline = new Date(ticket.deadline || now + 24 * 3600 * 1000).getTime();
    const totalDuration = Math.max(1, deadline - created);
    const elapsed = Math.max(0, now - created);
    const ratio = Math.min(1.0, elapsed / totalDuration);
    slaPressure = ratio * 25;
  } catch (e) {
    slaPressure = 5;
  }

  const finalScore = Math.min(100, Math.round(baseScore + crowdScore + slaPressure));
  return Math.max(0, finalScore);
}

export function getPriorityBadgeInfo(score: number): {
  bg: string;
  text: string;
  border: string;
  badgeLabel: string;
  isPulsing: boolean;
} {
  if (score >= 75) {
    return {
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      border: 'border-red-500/40',
      badgeLabel: 'CRITICAL',
      isPulsing: true,
    };
  }
  if (score >= 50) {
    return {
      bg: 'bg-amber-500/20',
      text: 'text-amber-300',
      border: 'border-amber-500/40',
      badgeLabel: 'HIGH',
      isPulsing: false,
    };
  }
  return {
    bg: 'bg-sky-500/15',
    text: 'text-sky-300',
    border: 'border-sky-500/30',
    badgeLabel: 'NORMAL',
    isPulsing: false,
  };
}
