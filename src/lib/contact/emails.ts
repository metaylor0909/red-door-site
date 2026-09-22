// Contact form staff-notification email. Sent as ONE email to Chris Knight
// with LeadSimple CC'd directly on it — a deliberately different mechanism
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

export interface ContactNotificationParams {
  name: string;
  email: string;
  phone: string;
  inquiryType: string;
  referralSource: string;
  comment: string;
  smsConsent: boolean;
}

export function buildContactNotificationEmail(
  params: ContactNotificationParams
): { from: string; to: string; cc: string; subject: string; html: string; replyTo: string } {
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
                <p style="margin:0 0 4px;color:#717073;font-size:13px;font-weight:bold;letter-spacing:.04em;text-transform:uppercase;">New Contact Form Submission</p>
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
    to: STAFF_RECIPIENT,
    cc: LEADSIMPLE_CONTACT_FORM_CC,
    subject: `New Contact Form Submission — ${params.name}`,
    html,
    replyTo: params.email,
  };
}
