// Thin wrapper around Resend's send API. See claude/rental-analysis-tool-
// build.md, decision #8's "Transactional email vendor" note — Resend,
// sending through the mail.rdpmindy.com subdomain (isolated from
// rdpmindy.com's own root-domain SPF/DKIM for real staff email).

export interface SendEmailParams {
  from: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
}

export async function sendEmail(params: SendEmailParams, apiKey: string): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      reply_to: params.replyTo,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend send failed: ${response.status} ${await response.text()}`);
  }
}
