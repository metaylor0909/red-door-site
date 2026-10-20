// Contact form emails: the staff notification (routed by inquiry type, see
// routeForInquiry below) and the auto-replies for leasing and maintenance
// inquiries.
//
// For owner/business inquiries the notification goes as ONE email to Chris
// Knight with LeadSimple CC'd directly on it — a deliberately different mechanism
// from the rental-analysis tool's LeadSimple integration (a separate,
// strictly-formatted "New Lead" email to a dedicated inbound address; see
// src/lib/rental-analysis/emails.ts). That mechanism is LeadSimple's manual
// email-to-lead parser. This one is LeadSimple's own "Web Forms" feature:
// Michael forwarded LeadSimple's own setup request verbatim (2026-09-22) —
// "Please CC new Owners from Webforms deals from RDPM Contact Form to this
// email address... This will allow our deals to automatically appear in
// LeadSimple" — which describes being CC'd on the regular notification
// email, not a separately-formatted one. Trust LeadSimple's own
// instructions for this address over the other integration's format
// requirements, since they're different features.
const SENDER = '"Red Door Property Management" <reports@mail.rdpmindy.com>';
const STAFF_RECIPIENT = 'cknight@rdpmindy.com';
const LEADSIMPLE_CONTACT_FORM_CC = 'new-leadfc2ef89f93@newlead.leadsimple.com';
const LEASING_TEAM = 'leasing@rdpmindy.com';
const MAINTENANCE_TEAM = 'maintenance@rdpmindy.com';

export type AutoReplyKind = 'leasing' | 'maintenance';

export interface InquiryRoute {
  to: string;
  /** LeadSimple only for owner/business inquiries: renters asking about a
   * home and residents reporting a repair aren't sales leads. */
  cc?: string;
  subjectLabel: string;
  autoReply: AutoReplyKind | null;
}

/** Where a contact-form submission goes, by its self-selected inquiry type
 * (Michael, 2026-10-20). Property Availability -> leasing team, Maintenance
 * Request -> maintenance team, each with an auto-reply and no LeadSimple CC.
 * Everything else, including the Eviction Protection Program form (same
 * endpoint), is unchanged: Chris + LeadSimple. */
export function routeForInquiry(inquiryType: string): InquiryRoute {
  switch (inquiryType) {
    case 'Property Availability':
      return { to: LEASING_TEAM, subjectLabel: 'Property Availability Inquiry', autoReply: 'leasing' };
    case 'Maintenance Request':
      return { to: MAINTENANCE_TEAM, subjectLabel: 'Maintenance Request', autoReply: 'maintenance' };
    default:
      return { to: STAFF_RECIPIENT, cc: LEADSIMPLE_CONTACT_FORM_CC, subjectLabel: 'Contact Form Submission', autoReply: null };
  }
}

export interface ContactNotificationParams {
  name: string;
  email: string;
  phone: string;
  inquiryType: string;
  referralSource: string;
  comment: string;
  smsConsent: boolean;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildContactNotificationEmail(
  raw: ContactNotificationParams
): { from: string; to: string; cc?: string; subject: string; html: string; replyTo: string } {
  const route = routeForInquiry(raw.inquiryType);
  // Every field is visitor-typed; escape before it goes into the HTML body.
  const params = {
    ...raw,
    name: escapeHtml(raw.name),
    email: escapeHtml(raw.email),
    phone: escapeHtml(raw.phone),
    inquiryType: escapeHtml(raw.inquiryType),
    referralSource: escapeHtml(raw.referralSource),
    comment: escapeHtml(raw.comment),
  };
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
                <p style="margin:0 0 4px;color:#717073;font-size:13px;font-weight:bold;letter-spacing:.04em;text-transform:uppercase;">New ${escapeHtml(route.subjectLabel)}</p>
                <h1 style="margin:0 0 18px;font-size:22px;">${params.name}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;">
                  <tr><td style="padding:6px 0;color:#717073;width:140px;">Email</td><td style="padding:6px 0;"><a href="mailto:${params.email}" style="color:#8b0e04;">${params.email}</a></td></tr>
                  <tr><td style="padding:6px 0;color:#717073;">Phone</td><td style="padding:6px 0;">${params.phone || '&mdash;'}</td></tr>
                  <tr><td style="padding:6px 0;color:#717073;">Inquiry Type</td><td style="padding:6px 0;">${params.inquiryType}</td></tr>
                  <tr><td style="padding:6px 0;color:#717073;">Heard About Us Via</td><td style="padding:6px 0;">${params.referralSource}</td></tr>
                  <tr><td style="padding:6px 0;color:#717073;">SMS Consent</td><td style="padding:6px 0;">${params.smsConsent ? 'Yes' : 'No'}</td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 32px;">
                <p style="margin:0 0 6px;color:#717073;font-size:13px;font-weight:bold;letter-spacing:.04em;text-transform:uppercase;">Comment</p>
                <p style="margin:0;font-size:15px;white-space:pre-line;">${params.comment || '(none)'}</p>
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
    to: route.to,
    cc: route.cc,
    subject: `New ${route.subjectLabel} — ${raw.name}`,
    html,
    replyTo: raw.email,
  };
}

// ---------- Auto-replies (wording approved by Michael, 2026-10-20) ----------

const SITE = 'https://www.reddoorrents.com';
const PROPERTY_MELD_URL = 'https://app.propertymeld.com/tenant/red-door-property-management';
const PET_SCREENING_URL = 'https://reddoor.petscreening.com/';

interface AutoReplyContent {
  subject: string;
  signature: string;
  replyTo: string;
  /** Paragraph HTML (already safe: no visitor input except the name). */
  bodyHtml: string;
  bodyText: string;
}

function link(href: string, label: string): string {
  return `<a href="${href}" style="color:#8b0e04;font-weight:bold;">${label}</a>`;
}

function autoReplyContent(kind: AutoReplyKind): AutoReplyContent {
  if (kind === 'maintenance') {
    return {
      subject: 'We received your maintenance request: please also submit it in Property Meld',
      signature: 'The Red Door Maintenance Team',
      replyTo: MAINTENANCE_TEAM,
      bodyHtml: `
        <p>Thank you for contacting Red Door Property Management. We've forwarded your message to our maintenance team.</p>
        <p><strong>To get your request scheduled, please also submit it through Property Meld:</strong><br />${link(PROPERTY_MELD_URL, 'Submit a maintenance request')}</p>
        <p>Property Meld is how our team tracks, schedules and updates every repair. Submitting there lets you add photos, choose times that work for you, and follow the progress of your request. A message through our website contact form can't be scheduled on its own.</p>
        <p><strong>If this is an emergency</strong> that threatens safety or could cause serious damage to the home, such as flooding, a gas smell, no heat in freezing weather, or a fire or electrical hazard, call us right away at <strong>317.660.1626</strong>. For a fire, a gas leak or any danger to life, call <strong>911</strong> first.</p>`,
      bodyText: [
        "Thank you for contacting Red Door Property Management. We've forwarded your message to our maintenance team.",
        `To get your request scheduled, please also submit it through Property Meld:\n${PROPERTY_MELD_URL}`,
        "Property Meld is how our team tracks, schedules and updates every repair. Submitting there lets you add photos, choose times that work for you, and follow the progress of your request. A message through our website contact form can't be scheduled on its own.",
        'If this is an emergency that threatens safety or could cause serious damage to the home, such as flooding, a gas smell, no heat in freezing weather, or a fire or electrical hazard, call us right away at 317.660.1626. For a fire, a gas leak or any danger to life, call 911 first.',
      ].join('\n\n'),
    };
  }
  const listings = `${SITE}/indianapolis-homes-for-rent?areas=all`;
  const criteria = `${SITE}/application-criteria`;
  return {
    subject: 'Thanks for your interest in a Red Door rental home',
    signature: 'The Red Door Leasing Team',
    replyTo: LEASING_TEAM,
    bodyHtml: `
        <p>Thank you for reaching out about a Red Door rental home. Our leasing team has your message and will follow up soon.</p>
        <p>In the meantime, here's how to move forward:</p>
        <ol style="margin:0 0 16px;padding-left:22px;">
          <li style="margin-bottom:10px;"><strong>See every available home.</strong> Current listings, photos and pricing are at ${link(listings, 'reddoorrents.com/indianapolis-homes-for-rent')}.</li>
          <li style="margin-bottom:10px;"><strong>Schedule a showing.</strong> Each listing has a <strong>Schedule a Showing</strong> button, and many of our homes offer self-guided tours you can book at a time that works for you.</li>
          <li style="margin-bottom:10px;"><strong>Review our application criteria.</strong> Our standards for income, credit, rental history and pets are posted at ${link(criteria, 'reddoorrents.com/application-criteria')}. They're applied the same way to every applicant.</li>
          <li><strong>Apply online.</strong> When you've found the right home, use the <strong>Apply Now</strong> button on its listing. Every adult who will live in the home applies separately, and every applicant completes a profile at ${link(PET_SCREENING_URL, 'PetScreening')}, including applicants without pets.</li>
        </ol>
        <p>Questions in the meantime? Reply to this email or call us at <strong>317.660.1626</strong>.</p>`,
    bodyText: [
      'Thank you for reaching out about a Red Door rental home. Our leasing team has your message and will follow up soon.',
      "In the meantime, here's how to move forward:",
      `1. See every available home. Current listings, photos and pricing are at ${listings}`,
      '2. Schedule a showing. Each listing has a Schedule a Showing button, and many of our homes offer self-guided tours you can book at a time that works for you.',
      `3. Review our application criteria. Our standards for income, credit, rental history and pets are posted at ${criteria}. They're applied the same way to every applicant.`,
      `4. Apply online. When you've found the right home, use the Apply Now button on its listing. Every adult who will live in the home applies separately, and every applicant completes a profile at PetScreening (${PET_SCREENING_URL}), including applicants without pets.`,
      'Questions in the meantime? Reply to this email or call us at 317.660.1626.',
    ].join('\n\n'),
  };
}

/** The confirmation sent back to someone who submitted a Property
 * Availability or Maintenance Request inquiry. Replies go to that team. */
export function buildContactAutoReplyEmail(
  kind: AutoReplyKind,
  recipient: { name: string; email: string }
): { from: string; to: string; subject: string; html: string; text: string; replyTo: string } {
  const content = autoReplyContent(kind);
  const firstName = recipient.name.trim().split(/\s+/)[0] || 'there';
  const html = `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f5f6;font-family:Arial,Helvetica,sans-serif;color:#171717;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f6;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border-top:4px solid #8b0e04;">
            <tr>
              <td style="padding:28px 32px 28px;font-size:15px;line-height:1.6;">
                <p>Hi ${escapeHtml(firstName)},</p>
                ${content.bodyHtml}
                <p style="margin:22px 0 0;">Thank you,<br />${content.signature}<br /><span style="color:#717073;">Red Door Property Management &middot; 317.660.1626</span></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  const text = `Hi ${firstName},\n\n${content.bodyText}\n\nThank you,\n${content.signature}\nRed Door Property Management · 317.660.1626`;
  return { from: SENDER, to: recipient.email, subject: content.subject, html, text, replyTo: content.replyTo };
}
