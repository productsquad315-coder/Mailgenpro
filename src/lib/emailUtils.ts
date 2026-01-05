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

// Generate ESP-ready HTML email with focus on Deliverability (Anti-Spam)
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

  // Deliverability-First Style Config
  const styleConfig = {
    minimal: {
      bg: '#ffffff',
      cardBg: '#ffffff',
      primary: '#111827',
      text: '#374151',
      heading: '#111827',
      borderRadius: '0px',
      border: '0px none',
      font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      isPlain: true
    },
    bold: {
      bg: '#f9fafb',
      cardBg: '#ffffff',
      primary: '#6366f1',
      text: '#1f2937',
      heading: '#000000',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      font: "'Inter', sans-serif",
      isPlain: false
    },
    tech: {
      bg: '#f8fafc',
      cardBg: '#ffffff',
      primary: '#0f172a',
      text: '#334155',
      heading: '#0f172a',
      borderRadius: '4px',
      border: '1px solid #cbd5e1',
      font: "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Monaco, Consolas, monospace",
      isPlain: false
    },
    corporate: {
      bg: '#ffffff',
      cardBg: '#ffffff',
      primary: '#0000ee',
      text: '#000000',
      heading: '#000000',
      borderRadius: '0px',
      border: '0px none',
      font: "'Georgia', serif",
      isPlain: true
    }
  }[templateStyle];

  // Anti-Spam CTA: Text-based hyperlinks are safer than big CSS buttons
  const ctaHTML = includeCTA && ctaLink
    ? `
    <p style="margin: 30px 0;">
      <a href="${ctaLink}" target="_blank" style="color: ${styleConfig.primary}; font-weight: 700; text-decoration: underline; font-size: 17px;">
        ${templateStyle === 'corporate' ? 'Visit Website' : 'Check it out here &rarr;'}
      </a>
    </p>
    `
    : '';

  const watermarkHTML = includeWatermark
    ? `
    <p style="font-size: 11px; color: #9ca3af; margin: 40px 0 0 0; text-align: center; font-family: ${styleConfig.font}; opacity: 0.7;">
      Sent via <a href="https://Mailgenpro.com" target="_blank" style="color: #9ca3af; text-decoration: underline;">Mailgenpro</a>
    </p>
    `
    : '';

  const mainContent = (email.html_content || email.content || "").replace(/\n/g, '<br>');

  // The "Invisible" Template: Purely content-focused
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${email.subject}</title>
  <style>
    body { margin: 0; padding: 20px; background-color: ${styleConfig.bg}; font-family: ${styleConfig.font}; color: ${styleConfig.text}; line-height: 1.6; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: ${styleConfig.cardBg}; border: ${styleConfig.border}; border-radius: ${styleConfig.borderRadius}; padding: ${styleConfig.isPlain ? '0' : '40px'}; }
    h1 { font-size: 22px; font-weight: 800; color: ${styleConfig.heading}; margin-bottom: 24px; line-height: 1.2; }
    a { color: ${styleConfig.primary}; }
    .footer { margin-top: 40px; border-top: 1px solid #eeeeee; padding-top: 20px; font-size: 12px; color: #6b7280; }
    @media (prefers-color-scheme: dark) {
      body { background-color: #121212 !important; color: #e5e7eb !important; }
      .email-container { background-color: #121212 !important; color: #e5e7eb !important; border-color: #374151 !important; }
      h1 { color: #f9fafb !important; }
      a { color: #60a5fa !important; }
    }
  </style>
</head>
<body>
  <div style="display: none; max-height: 0px; overflow: hidden;">${previewText}</div>
  <div class="email-container">
    <div style="font-size: 12px; color: #6b7280; margin-bottom: 20px; ${styleConfig.isPlain ? 'display:none;' : ''}">${brandName}</div>
    <h1>${email.subject}</h1>
    <div>${mainContent}</div>
    ${ctaHTML}
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
      <p>Want out? <a href="{{unsubscribe_url}}">Unsubscribe here</a>.</p>
    </div>
    ${watermarkHTML}
  </div>
</body>
</html>`;
};
