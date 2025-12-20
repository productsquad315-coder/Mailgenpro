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
  includeWatermark: boolean
): string => {
  // Generate preview text from content (first 100 chars, stripped of HTML)
  const previewText = (email.content || "").substring(0, 100).replace(/\n/g, ' ').trim() + '...';

  const ctaHTML = includeCTA
    ? ctaLink
      ? `
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${ctaLink}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="10%" stroke="f" fillcolor="#6366f1">
      <w:anchorlock/>
      <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">Get Started Now</center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation" style="margin: 32px 0;">
      <tr>
        <td align="left">
          <a href="${ctaLink}" target="_blank" style="display: inline-block; padding: 16px 36px; background: #6366f1; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; line-height: 1; mso-padding-alt: 0; text-align: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
            <!--[if mso]><i style="letter-spacing: 36px; mso-font-width: -100%; mso-text-raise: 30pt;">&nbsp;</i><![endif]-->
            <span style="mso-text-raise: 15pt;">Get Started Now</span>
            <!--[if mso]><i style="letter-spacing: 36px; mso-font-width: -100%;">&nbsp;</i><![endif]-->
          </a>
        </td>
      </tr>
    </table>
    <!--<![endif]-->
    `
      : `
    <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation" style="margin: 32px 0;">
      <tr>
        <td align="left">
          <div style="display: inline-block; padding: 16px 36px; background: #6366f1; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; border-radius: 8px; font-weight: 600; font-size: 16px; line-height: 1; text-align: center;">
            Get Started Now
          </div>
        </td>
      </tr>
    </table>
    `
    : '';

  const watermarkHTML = includeWatermark
    ? `
    <tr>
      <td style="padding: 24px 40px; border-top: 1px solid #f3f4f6; text-align: center;">
        <p style="font-size: 11px; color: #9ca3af; margin: 0; line-height: 1.5; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; letter-spacing: 0.025em; text-transform: uppercase; font-weight: 500;">
          Powered by <a href="https://Mailgenpro.com" target="_blank" style="color: #6366f1; text-decoration: none; font-weight: 700;">Mailgenpro</a>
        </p>
      </td>
    </tr>
    `
    : '';

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <style>
    * { font-family: sans-serif !important; }
  </style>
  <![endif]-->
  <title>${email.subject}</title>
  <style>
    /* Reset styles */
    body {
      margin: 0 !important;
      padding: 0 !important;
      -webkit-text-size-adjust: 100% !important;
      -ms-text-size-adjust: 100% !important;
      -webkit-font-smoothing: antialiased !important;
      background-color: #f9fafb;
    }
    img {
      border: 0 !important;
      outline: none !important;
      -ms-interpolation-mode: bicubic;
    }
    table {
      border-collapse: collapse !important;
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }
    td, a, span {
      border-collapse: collapse;
      mso-line-height-rule: exactly;
    }
    
    /* Responsive styles */
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        margin: 0 !important;
        border-radius: 0 !important;
      }
      .email-content {
        padding: 32px 24px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all;">
    ${previewText}
  </div>
  
  <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation" style="background-color: #f9fafb; padding: 40px 0;">
    <tr>
      <td align="center">
        <table class="email-container" width="600" border="0" cellspacing="0" cellpadding="0" role="presentation" style="background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 0 40px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
                <tr>
                  <td>
                    <div style="font-size: 14px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
                      ${brandName.toUpperCase()}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="email-content" style="padding: 10px 40px 40px 40px; color: #374151; line-height: 1.7; font-size: 16px;">
              <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: #111827; letter-spacing: -0.025em; line-height: 1.2;">
                ${email.subject}
              </h1>
              
              <div style="margin-bottom: 32px; color: #4b5563;">
                <p style="margin: 0 0 16px 0;">Hi {{first_name}},</p>
                ${(email.html_content || email.content || "").replace(/\{\{/g, '{{').replace(/\}\}/g, '}}')}
              </div>
              
              ${ctaHTML}
              
              <div style="margin-top: 40px; padding-top: 32px; border-top: 1px solid #f3f4f6;">
                <p style="margin: 0; font-size: 15px; font-weight: 500; color: #111827;">Best regards,</p>
                <p style="margin: 4px 0 0 0; font-size: 15px; color: #6b7280;">The ${brandName} Team</p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background-color: #f9fafb; border-top: 1px solid #f3f4f6; text-align: left;">
              <p style="margin: 0 0 12px 0; font-size: 12px; line-height: 1.5; color: #9ca3af;">
                You're receiving this because you're a valued part of the ${brandName} community. 
                If you'd rather not hear from us, you can <a href="{{unsubscribe_url}}" target="_blank" style="color: #6366f1; text-decoration: none; font-weight: 600;">unsubscribe here</a>.
              </p>
              <table border="0" cellspacing="0" cellpadding="0" role="presentation">
                <tr>
                  <td style="font-size: 12px; color: #9ca3af;">
                    &copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.
                  </td>
                </tr>
              </table>
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
