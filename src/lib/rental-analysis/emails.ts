// Decision #8 step 12's two emails. Sender identity, the LeadSimple
// inbound address, the Calendly link, and Red Door's real business
// address are all FINAL/confirmed values written directly into
// claude/rental-analysis-tool-build.md (decisions #5, #6, #8) — treated
// as fixed constants here, not secrets, same as the Zapier webhook is
// documented in the build brief itself.

// Sending domain revised 2026-09-20 from mail.reddoorrents.com to
// mail.rdpmindy.com — see claude/rental-analysis-tool-build.md, decision
// #8's "Resend sending domain/address" note for why.
const SENDER = '"Chris Knight, Red Door Property Management" <reports@mail.rdpmindy.com>';
const REPLY_TO = 'cknight@rdpmindy.com';
const LEADSIMPLE_INBOUND_ADDRESS = 'new-deal937b93ae52@newlead.leadsimple.com';
const CALENDLY_URL = 'https://calendly.com/cknight-19/phone-call';
const RED_DOOR_ADDRESS = '3815 River Crossing Parkway, Suite 100, Indianapolis, Indiana 46240';

export interface OwnerEmailParams {
  ownerName: string;
  ownerEmail: string;
  propertyAddress: string;
  estimatedRent: number;
  rangeLow: number;
  rangeHigh: number;
  confidencePercent: number;
  confidenceBucketLabel: string;
  reportUrl: string;
}

export function buildOwnerEmail(params: OwnerEmailParams): { from: string; to: string; subject: string; html: string; replyTo: string } {
  // Headline-only per decision #5 — estimate, range, confidence, one
  // CTA, no charts/tables. Inline styles and a system font stack, since
  // self-hosted web fonts don't render reliably across email clients.
  const html = `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f5f6;font-family:Arial,Helvetica,sans-serif;color:#171717;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f6;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 0;">
                <p style="margin:0 0 4px;color:#717073;font-size:13px;font-weight:bold;letter-spacing:.04em;text-transform:uppercase;">Free Rental Analysis</p>
                <h1 style="margin:0 0 18px;font-size:22px;">${params.propertyAddress}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px;">
                <p style="margin:0 0 6px;color:#717073;font-size:13px;font-weight:bold;letter-spacing:.04em;text-transform:uppercase;">Estimated Monthly Rent</p>
                <p style="margin:0 0 6px;font-size:34px;font-weight:bold;color:#171717;">$${params.estimatedRent.toLocaleString()}/mo</p>
                <p style="margin:0 0 18px;color:#717073;font-size:15px;">Range: $${params.rangeLow.toLocaleString()} &ndash; $${params.rangeHigh.toLocaleString()}/mo</p>
                <p style="display:inline-block;margin:0 0 24px;padding:6px 14px;background:#f5f5f6;border-radius:999px;font-size:14px;font-weight:bold;">
                  ${params.confidencePercent}% &mdash; ${params.confidenceBucketLabel}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;">
                <a href="${params.reportUrl}" style="display:inline-block;padding:14px 24px;background:#8b0e04;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;font-size:15px;">View Full Report &amp; Comparable Properties</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;border-top:1px solid #e4e3e6;">
                <p style="margin:24px 0 0;color:#717073;font-size:13px;">
                  Have questions, or want to talk through what it would look like to have Red Door manage this
                  property? <a href="${CALENDLY_URL}" style="color:#8b0e04;">Schedule a call with Chris Knight</a>.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:#f5f5f6;">
                <p style="margin:0;color:#717073;font-size:12px;">Red Door Property Management &middot; ${RED_DOOR_ADDRESS}</p>
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
    subject: `Your rental analysis for ${params.propertyAddress}`,
    html,
    replyTo: REPLY_TO,
  };
}

export interface LeadSimpleEmailParams {
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  propertyZip: string;
  estimatedRent: number;
  rangeLow: number;
  rangeHigh: number;
  confidencePercent: number;
  reportUrl: string;
}

export function buildLeadSimpleEmail(params: LeadSimpleEmailParams): { from: string; to: string; subject: string; text: string } {
  // Decision #6's exact confirmed format — labeled plain-text lines,
  // lead source inferred by LeadSimple purely from the receiving
  // address, "Comments" carries everything else.
  const text = `Name: ${params.ownerName}
Email: ${params.ownerEmail}
Phone Number: ${params.ownerPhone}
Address: ${params.propertyAddress}
City: ${params.propertyCity}
State: ${params.propertyState}
Zip Code: ${params.propertyZip}
Comments: Rental analysis request for ${params.propertyAddress}. Estimated rent: $${params.estimatedRent}/mo (range $${params.rangeLow}-$${params.rangeHigh}). Confidence: ${params.confidencePercent}%. Full report: ${params.reportUrl}`;

  return {
    from: SENDER,
    to: LEADSIMPLE_INBOUND_ADDRESS,
    subject: 'New Lead',
    text,
  };
}
