// Decision #5's return-visit business-development alert, revised
// 2026-09-13: the first view never alerts; every distinct visit from the
// 2nd onward fires the alert again, capped at once per 24 hours. Views
// within ~30 minutes of each other collapse into a single visit. See
// claude/rental-analysis-tool-build.md, decision #5 and decision #6's
// "BD-alert wiring" for the exact rule and the Zapier webhook contract.

const VISIT_COLLAPSE_WINDOW_MS = 30 * 60 * 1000;
const ALERT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export interface RentalAnalysisRow {
  token: string;
  owner_email: string;
  property_address: string;
  distinct_visit_count: number;
  last_view_at: string | null;
  last_bd_alert_fired_at: string | null;
}

export interface ViewTrackingUpdate {
  distinctVisitCount: number;
  lastViewAt: string;
  lastBdAlertFiredAt: string | null;
  /** True when this view should POST to the Zapier BD-alert webhook. */
  shouldFireAlert: boolean;
}

/**
 * Pure decision function — given the row's current tracking state and
 * "now", decides how to update it and whether to fire the BD alert.
 * Kept separate from the D1 read/write so the visit/cooldown rules are
 * unit-testable without a database.
 */
export function computeViewTrackingUpdate(row: RentalAnalysisRow, now: Date): ViewTrackingUpdate {
  const nowIso = now.toISOString();
  const lastView = row.last_view_at ? new Date(row.last_view_at) : null;
  const isNewDistinctVisit = !lastView || now.getTime() - lastView.getTime() > VISIT_COLLAPSE_WINDOW_MS;

  if (!isNewDistinctVisit) {
    return {
      distinctVisitCount: row.distinct_visit_count,
      lastViewAt: nowIso,
      lastBdAlertFiredAt: row.last_bd_alert_fired_at,
      shouldFireAlert: false,
    };
  }

  const distinctVisitCount = row.distinct_visit_count + 1;
  // The first-ever distinct visit never alerts (it's just the owner
  // opening the email). From the 2nd on, alert unless one already fired
  // within the last 24 hours.
  const eligibleByVisitNumber = distinctVisitCount >= 2;
  const lastAlert = row.last_bd_alert_fired_at ? new Date(row.last_bd_alert_fired_at) : null;
  const withinCooldown = lastAlert ? now.getTime() - lastAlert.getTime() < ALERT_COOLDOWN_MS : false;
  const shouldFireAlert = eligibleByVisitNumber && !withinCooldown;

  return {
    distinctVisitCount,
    lastViewAt: nowIso,
    lastBdAlertFiredAt: shouldFireAlert ? nowIso : row.last_bd_alert_fired_at,
    shouldFireAlert,
  };
}

/**
 * Fires decision #6's Zapier webhook (LeadSimple note + email to Chris
 * Knight, both configured on the Zap itself — this just POSTs the
 * payload). Swallows/logs errors rather than throwing, since a failed
 * alert shouldn't break the report page for the visitor.
 */
export async function fireBdAlertWebhook(
  webhookUrl: string,
  payload: { ownerEmail: string; propertyAddress: string; reportUrl: string; visitCount: number }
): Promise<void> {
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner_email: payload.ownerEmail,
        property_address: payload.propertyAddress,
        report_url: payload.reportUrl,
        visit_count: payload.visitCount,
      }),
    });
  } catch (err) {
    console.error('[rental-analysis] BD-alert webhook failed:', err);
  }
}
