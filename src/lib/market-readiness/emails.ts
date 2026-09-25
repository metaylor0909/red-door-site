// Two emails for the Market Readiness self-check's full-report request,
// mirroring rental-analysis's own emails.ts pattern exactly (same sender
// identity, same "fixed constant, not a secret" treatment for the
// LeadSimple inbound address -- see that file's header comment for why).
//
// LEADSIMPLE_INBOUND_ADDRESS here is a NEW, dedicated address for this
// lead source specifically (confirmed by Michael, 2026-09-25) -- kept
// separate from the rental-analysis tool's own address so LeadSimple
// tags Market Readiness leads correctly rather than lumping them in with
// rental-analysis leads.
import type { FullReportData } from './scoring';

const SENDER = '"Chris Knight, Red Door Property Management" <reports@mail.rdpmindy.com>';
const REPLY_TO = 'cknight@rdpmindy.com';
const LEADSIMPLE_INBOUND_ADDRESS = 'new-deal5f455f5405@newlead.leadsimple.com';
const CALENDLY_URL = 'https://calendly.com/cknight-19/phone-call';
const RED_DOOR_ADDRESS = '3815 River Crossing Parkway, Suite 100, Indianapolis, Indiana 46240';
const FREE_RENTAL_ANALYSIS_URL = 'https://www.reddoorrents.com/rental-analysis';

function escapeHtml(value: string): string {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] as string);
}

function renderItemGroupHtml(title: string, items: FullReportData['items']): string {
  if (items.length === 0) return '';
  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #e4e3e6;">
          <p style="margin:0 0 4px;font-weight:bold;color:#171717;font-size:15px;">${escapeHtml(item.question)}</p>
          <p style="margin:0 0 8px;color:#717073;font-size:13px;">Your answer: ${escapeHtml(item.answerLabel)}${item.priority ? ` &middot; Priority: ${escapeHtml(item.priority)}` : ''}</p>
          <p style="margin:0 0 6px;color:#3f454d;font-size:13px;"><strong>Why it matters:</strong> ${escapeHtml(item.whyItMatters)}</p>
          <p style="margin:0;color:#3f454d;font-size:13px;"><strong>Recommended next step:</strong> ${escapeHtml(item.recommendation)}</p>
        </td>
      </tr>`
    )
    .join('');
  return `
    <tr>
      <td style="padding:24px 32px 0;">
        <h2 style="margin:0 0 4px;font-size:17px;color:#171717;">${escapeHtml(title)}</h2>
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      </td>
    </tr>`;
}

export interface OwnerReportEmailParams {
  ownerEmail: string;
  firstName?: string;
  propertyAddress?: string;
  report: FullReportData;
  dateGenerated: string;
}

export function buildOwnerReportEmail(params: OwnerReportEmailParams): { from: string; to: string; subject: string; html: string; replyTo: string } {
  const { report } = params;
  const topPriorities = report.unresolved.slice(0, 3);
  const greeting = params.firstName ? `Hi ${escapeHtml(params.firstName)},` : 'Hello,';
  const subjectAddress = params.propertyAddress ? ` for ${params.propertyAddress}` : '';

  const html = `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f5f6;font-family:Arial,Helvetica,sans-serif;color:#171717;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f6;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 0;">
                <p style="margin:0 0 4px;color:#717073;font-size:13px;font-weight:bold;letter-spacing:.04em;text-transform:uppercase;">Market Readiness Report</p>
                <h1 style="margin:0 0 6px;font-size:22px;">${greeting}</h1>
                <p style="margin:0 0 18px;color:#3f454d;font-size:14px;">Here is your complete Market Readiness Report${subjectAddress}, generated ${escapeHtml(params.dateGenerated)}.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#171717;border-radius:8px;">
                  <tr>
                    <td style="padding:24px;text-align:center;">
                      <p style="margin:0;color:#f3f3f3;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:.04em;">Overall Score</p>
                      <p style="margin:6px 0 10px;color:#ffffff;font-size:40px;font-weight:bold;">${report.score}%</p>
                      <p style="margin:0;color:#ffffff;font-size:17px;font-weight:bold;">${escapeHtml(report.category.heading)}</p>
                      <p style="margin:8px 0 0;color:#dedede;font-size:13px;">${escapeHtml(report.category.message)}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 32px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="33%" style="padding:12px;background:#fbfbfc;border:1px solid #e4e3e6;border-radius:6px;text-align:center;">
                      <p style="margin:0;color:#8b0e04;font-size:11px;font-weight:bold;text-transform:uppercase;">Ready</p>
                      <p style="margin:4px 0 0;font-size:22px;font-weight:bold;color:#171717;">${report.ready.length}</p>
                    </td>
                    <td width="2%"></td>
                    <td width="33%" style="padding:12px;background:#fbfbfc;border:1px solid #e4e3e6;border-radius:6px;text-align:center;">
                      <p style="margin:0;color:#8b0e04;font-size:11px;font-weight:bold;text-transform:uppercase;">Needs Attention</p>
                      <p style="margin:4px 0 0;font-size:22px;font-weight:bold;color:#171717;">${report.needsAttention.length}</p>
                    </td>
                    <td width="2%"></td>
                    <td width="30%" style="padding:12px;background:#fbfbfc;border:1px solid #e4e3e6;border-radius:6px;text-align:center;">
                      <p style="margin:0;color:#8b0e04;font-size:11px;font-weight:bold;text-transform:uppercase;">Confirm</p>
                      <p style="margin:4px 0 0;font-size:22px;font-weight:bold;color:#171717;">${report.confirm.length}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${
              topPriorities.length > 0
                ? `<tr><td style="padding:22px 32px 0;"><h2 style="margin:0 0 10px;font-size:17px;color:#171717;">Your Top Priorities Before Marketing</h2></td></tr>` +
                  topPriorities
                    .map(
                      (item) => `
            <tr>
              <td style="padding:0 32px 4px;">
                <p style="margin:0 0 3px;font-weight:bold;color:#171717;font-size:14px;">${escapeHtml(item.question)}</p>
                <p style="margin:0 0 14px;color:#3f454d;font-size:13px;">${escapeHtml(item.recommendation)}</p>
              </td>
            </tr>`
                    )
                    .join('')
                : ''
            }
            ${renderItemGroupHtml('Needs Attention', report.needsAttention)}
            ${renderItemGroupHtml('Confirm Before Marketing', report.confirm)}
            ${renderItemGroupHtml('Ready', report.ready)}
            <tr>
              <td style="padding:28px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbfbfc;border:1px solid #e4e3e6;border-radius:8px;">
                  <tr>
                    <td style="padding:22px;text-align:center;">
                      <h2 style="margin:0 0 8px;font-size:17px;color:#171717;">Ready for a Professional Market Readiness Assessment?</h2>
                      <p style="margin:0 0 16px;color:#3f454d;font-size:14px;">This self-check helps identify common preparation needs. Red Door can provide a complete review of the property's condition, rental pricing, local competition, and market position.</p>
                      <a href="${FREE_RENTAL_ANALYSIS_URL}" style="display:inline-block;margin:0 6px 8px;padding:12px 20px;background:#8b0e04;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;font-size:14px;">Get a Free Rental Analysis</a>
                      <a href="${CALENDLY_URL}" style="display:inline-block;margin:0 6px 8px;padding:12px 20px;background:#ffffff;color:#8b0e04;border:2px solid #8b0e04;text-decoration:none;border-radius:6px;font-weight:bold;font-size:14px;">Schedule a Call</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px;">
                <p style="margin:0;color:#717073;font-size:12px;">This report is a preliminary self-assessment and is not a formal property inspection, legal review, appraisal, rent guarantee, tenant-quality guarantee, or guaranteed rental outcome. Contact Red Door Property Management at 317.660.1626 or visit reddoorrents.com to request a professional Market Readiness Assessment.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:#f5f5f6;">
                <p style="margin:0;color:#717073;font-size:12px;">Red Door Property Management &middot; ${RED_DOOR_ADDRESS} &middot; 317.660.1626</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return {
    from: SENDER,
    to: params.ownerEmail,
    subject: `Your Market Readiness Report${subjectAddress}`,
    html,
    replyTo: REPLY_TO,
  };
}

export interface LeadSimpleEmailParams {
  email: string;
  firstName?: string;
  propertyAddress?: string;
  phone?: string;
  report: FullReportData;
}

export function buildLeadSimpleEmail(params: LeadSimpleEmailParams): { from: string; to: string; subject: string; text: string } {
  // Same confirmed format as rental-analysis's own LeadSimple email --
  // labeled plain-text lines, lead source inferred by LeadSimple purely
  // from the receiving address (this tool's own, not shared).
  const topPriority = params.report.unresolved[0];
  const text = `Name: ${params.firstName || 'Not provided'}
Email: ${params.email}
Phone Number: ${params.phone || 'Not provided'}
Address: ${params.propertyAddress || 'Not provided'}
Comments: Market Readiness self-check completed. Score: ${params.report.score}% (${params.report.category.heading}). Ready: ${params.report.ready.length}, Needs Attention: ${params.report.needsAttention.length}, Confirm: ${params.report.confirm.length}.${topPriority ? ` Top priority: ${topPriority.question}` : ''}`;

  return {
    from: SENDER,
    to: LEADSIMPLE_INBOUND_ADDRESS,
    subject: 'New Lead',
    text,
  };
}
