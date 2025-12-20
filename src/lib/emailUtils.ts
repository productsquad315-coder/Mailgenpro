// Calculate the day to send email based on drip duration and sequence number
export const calculateSendDay = (dripDuration: string, sequenceNumber: number, totalEmails: number): number => {
  const duration = parseInt(dripDuration.split('-')[0]); // Extract number from "7-day", "14-day", etc.

  if (sequenceNumber === 1) return 1; // First email always on day 1
  if (sequenceNumber === totalEmails) return duration; // Last email on final day

  // Distribute remaining emails evenly across the remaining days
  const remainingDays = duration - 1;
  const remainingEmails = totalEmails - 2; // Excluding first and last
  const daysBetween = remainingDays / (totalEmails - 1);

  return Math.round(1 + (sequenceNumber - 1) * daysBetween);
};

// Generate ESP-ready HTML email with full personalization and ESP compatibility
export const generateESPReadyHTML = (
  email: any,
  brandName: string,
  ctaLink: string | null,
  includeCTA: boolean,
  includeWatermark: boolean,
  templateStyle: 'minimal' | 'bold' | 'tech' | 'corporate' = 'minimal'
): string => {
  // Generate preview text from content (first 100 chars, stripped of HTML)
  const previewText = (email.content || "").substring(0, 100).replace(/\n/g, ' ').trim() + '...';

  // Define style-specific constants
  const styleConfig = {
    minimal: {
      bg: '#f9fafb',
      cardBg: '#ffffff',
      primary: '#6366f1',
      text: '#374151',
      heading: '#111827',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      font: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    },
    bold: {
      bg: '#f3f4f6',
      cardBg: '#ffffff',
      primary: '#6366f1',
      primaryGradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
      text: '#1f2937',
      heading: '#000000',
      borderRadius: '24px',
      border: '2px solid #6366f1',
      font: "'Outfit', 'Inter', sans-serif"
    },
    tech: {
      bg: '#0f172a',
      cardBg: '#1e293b',
      primary: '#38bdf8',
      text: '#94a3b8',
      heading: '#f8fafc',
      borderRadius: '8px',
      border: '1px solid #334155',
      font: "'JetBrains Mono', monospace, sans-serif"
    },
    corporate: {
      bg: '#f1f5f9',
      cardBg: '#ffffff',
      primary: '#0f172a',
      text: '#334155',
      heading: '#0f172a',
      borderRadius: '0px',
      border: '1px solid #cbd5e1',
      font: "'Georgia', serif, sans-serif"
    }
  }[templateStyle];

  const ctaHTML = includeCTA
    ? ctaLink
      ? `
    <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation" style="margin: 32px 0;">
      <tr>
        <td align="${templateStyle === 'corporate' ? 'center' : 'left'}">
          <a href="${ctaLink}" target="_blank" style="display: inline-block; padding: 18px 42px; background: ${styleConfig.primary}; ${styleConfig.primaryGradient ? `background: ${styleConfig.primaryGradient};` : ''} color: #ffffff; text-decoration: none; border-radius: ${styleConfig.borderRadius}; font-weight: 700; font-size: 16px; line-height: 1; text-align: center; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
            Get Started Now
          </a>
        </td>
      </tr>
    </table>
    `
      : ''
    : '';

  const watermarkHTML = includeWatermark
    ? `
    <tr>
      <td style="padding: 24px 40px; border-top: 1px solid ${styleConfig.border.split(' ')[2]}; text-align: center;">
        <p style="font-size: 11px; color: #9ca3af; margin: 0; line-height: 1.5; font-family: ${styleConfig.font}; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 700;">
          Powered by <a href="https://Mailgenpro.com" target="_blank" style="color: ${styleConfig.primary}; text-decoration: none;">Mailgenpro</a>
        </p>
      </td>
    </tr>
    `
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Outfit:wght@400;700&family=JetBrains+Mono&display=swap" rel="stylesheet">
  <title>${email.subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: ${styleConfig.bg}; font-family: ${styleConfig.font}; color: ${styleConfig.text}; }
    .container { width: 100%; max-width: 600px; margin: 40px auto; background-color: ${styleConfig.cardBg}; border-radius: ${styleConfig.borderRadius}; border: ${styleConfig.border}; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
    .content { padding: 40px; line-height: 1.8; font-size: 17px; }
    h1 { margin: 0 0 24px 0; font-size: 28px; font-weight: 800; color: ${styleConfig.heading}; letter-spacing: -0.02em; }
    .footer { padding: 32px 40px; background-color: ${templateStyle === 'tech' ? '#1e293b' : '#f9fafb'}; border-top: 1px solid ${styleConfig.border.split(' ')[2]}; font-size: 13px; color: #64748b; }
    a { color: ${styleConfig.primary}; text-decoration: none; font-weight: 600; }
    @media only screen and (max-width: 600px) { .container { margin: 0; border-radius: 0; } .content { padding: 30px 20px; } }
  </style>
</head>
<body>
  <div style="display: none; max-height: 0px; overflow: hidden;">${previewText}</div>
  <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation" style="background-color: ${styleConfig.bg};">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table class="container" width="600" border="0" cellspacing="0" cellpadding="0" role="presentation">
          <tr>
            <td class="content">
              <div style="font-size: 13px; font-weight: 800; color: ${styleConfig.primary}; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 12px;">
                ${brandName}
              </div>
              <h1>${email.subject}</h1>
              <div style="margin-bottom: 30px;">
                ${(email.html_content || email.content || "").replace(/\n/g, '<br>')}
              </div>
              ${ctaHTML}
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p style="margin: 0 0 10px 0;">&copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
              <p style="margin: 0;">Sent via <a href="https://mailgenpro.com">Mailgenpro</a>. <a href="{{unsubscribe_url}}">Unsubscribe</a></p>
            </td>
          </tr>
          ${watermarkHTML}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
