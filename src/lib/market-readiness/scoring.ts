// Scoring and report-building logic, ported verbatim from the reference
// file's getScore()/getCategory()/getCounts()/getReportItems()/
// sortUnresolved() (see questions.ts's header comment). Pure functions
// only — no DOM, no fetch — so this one module is the single source of
// truth for both the client-side interactive component and the server's
// independent recomputation on submit. Do not duplicate this logic
// anywhere else.
import { READINESS_QUESTIONS, type AnswerValue, type ItemStatus, type Priority } from './questions';

export type Answers = Record<string, AnswerValue>;

export interface ReportItem {
  id: string;
  question: string;
  category: string;
  answer: AnswerValue;
  answerLabel: string;
  status: ItemStatus;
  statusLabel: string;
  priority: Priority;
  whyItMatters: string;
  recommendation: string;
  inlineRecommendation: string;
}

export interface CategoryResult {
  key: string;
  heading: string;
  cta: string;
  message: string;
}

const PRIORITY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export function getAnswerLabel(value: AnswerValue): string {
  return value === 'yes' ? 'Yes' : value === 'no' ? 'No' : 'Unsure';
}

export function getStatusLabel(status: ItemStatus): string {
  if (status === 'ready') return 'Ready';
  if (status === 'needs-attention') return 'Needs Attention';
  return 'Confirm Before Marketing';
}

export function getStatusIcon(status: ItemStatus): string {
  if (status === 'ready') return 'OK';
  if (status === 'needs-attention') return '!';
  return '?';
}

/** Every question must be answered before this is called — callers
 * validate completeness first (same as the reference file's "generate
 * report" click handler, which blocks on any unanswered row). */
export function getReportItems(answers: Answers): ReportItem[] {
  return READINESS_QUESTIONS.map((question) => {
    const answer = answers[question.id];
    const resp = question.responses[answer];
    return {
      id: question.id,
      question: question.question,
      category: resp.category || question.category,
      answer,
      answerLabel: getAnswerLabel(answer),
      status: resp.status,
      statusLabel: getStatusLabel(resp.status),
      priority: resp.priority,
      whyItMatters: resp.whyItMatters,
      recommendation: resp.recommendation,
      inlineRecommendation: resp.inlineRecommendation,
    };
  });
}

export function sortUnresolved(items: ReportItem[]): ReportItem[] {
  return items.slice().sort((a, b) => {
    const rankA = a.priority ? (PRIORITY_RANK[a.priority] ?? 9) : 9;
    const rankB = b.priority ? (PRIORITY_RANK[b.priority] ?? 9) : 9;
    return rankA - rankB;
  });
}

export function getCounts(answers: Answers): { yes: number; no: number; unsure: number } {
  const counts = { yes: 0, no: 0, unsure: 0 };
  for (const id of Object.keys(answers)) {
    counts[answers[id]] += 1;
  }
  return counts;
}

/** Weighted 0-100 score. Yes = 2pts, Unsure = 1pt, No = 0pts, per
 * question weight -- except reverseScoring questions (currently just
 * "immediate-safety"), where No = 2pts and Yes = 0pts, since "no
 * immediate safety concerns" is the desirable answer there. */
export function getScore(answers: Answers): number {
  const total = READINESS_QUESTIONS.reduce((sum, question) => {
    const answer = answers[question.id];
    let points = answer === 'unsure' ? 1 : answer === 'yes' ? 2 : 0;
    if (question.reverseScoring) {
      points = answer === 'unsure' ? 1 : answer === 'no' ? 2 : 0;
    }
    return sum + points * question.weight;
  }, 0);
  const max = READINESS_QUESTIONS.reduce((sum, question) => sum + 2 * question.weight, 0);
  return Math.round((total / max) * 100);
}

export function getCategory(score: number, hasCriticalBlocker: boolean): CategoryResult {
  if (hasCriticalBlocker && score >= 60) {
    return {
      key: 'nearly_ready_critical_item',
      heading: 'Your Property Is Nearly Market Ready - Critical Item Requires Attention',
      cta: 'Review My Remaining Readiness Items',
      message: 'Your answers suggest the property has several readiness pieces in place, but at least one safety, security, major system, or immediate move-in concern should be addressed before the property is professionally marketed or occupied.',
    };
  }
  if (score >= 85) {
    return {
      key: 'market_ready',
      heading: 'Your Property Appears Market Ready',
      cta: "Confirm My Property's Market Position",
      message: 'Your answers suggest that many of the major preparation items have already been addressed. The next step is confirming the rental price, documenting the property’s condition, and launching a professional marketing strategy.',
    };
  }
  if (score >= 60) {
    return {
      key: 'nearly_ready',
      heading: 'Your Property Is Nearly Market Ready',
      cta: 'Review My Remaining Readiness Items',
      message: 'The property appears to have a solid foundation, but a few unresolved items could affect renter interest, leasing speed, or the quality of applicants. Addressing these items before marketing may help the property compete more effectively.',
    };
  }
  return {
    key: 'preparation_recommended',
    heading: 'Additional Preparation Is Recommended',
    cta: 'Build My Market Readiness Plan',
    message: 'Several items may need attention before the property is introduced to the rental market. Completing the highest-priority improvements first can help reduce vacancy, avoid poor first impressions, and attract stronger applicants.',
  };
}

export interface FullReportData {
  score: number;
  category: CategoryResult;
  items: ReportItem[];
  needsAttention: ReportItem[];
  confirm: ReportItem[];
  ready: ReportItem[];
  unresolved: ReportItem[];
  counts: { yes: number; no: number; unsure: number };
  hasCriticalBlocker: boolean;
}

/** The one place that assembles a complete, ready-to-render report from
 * raw answers -- used identically by the snapshot renderer, the full
 * emailed report, and the server's own integrity recomputation. */
export function buildFullReport(answers: Answers): FullReportData {
  const items = getReportItems(answers);
  const score = getScore(answers);
  const counts = getCounts(answers);
  const needsAttention = sortUnresolved(items.filter((item) => item.status === 'needs-attention'));
  const confirm = sortUnresolved(items.filter((item) => item.status === 'confirm'));
  const ready = items.filter((item) => item.status === 'ready');
  const unresolved = sortUnresolved(needsAttention.concat(confirm));
  const hasCriticalBlocker = unresolved.some((item) => item.priority === 'critical');
  const category = getCategory(score, hasCriticalBlocker);
  return { score, category, items, needsAttention, confirm, ready, unresolved, counts, hasCriticalBlocker };
}

export function isComplete(answers: Answers): boolean {
  return READINESS_QUESTIONS.every((q) => Boolean(answers[q.id]));
}
