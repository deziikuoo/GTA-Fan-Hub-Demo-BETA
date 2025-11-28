// Email service using SendGrid API
import sgMail from '@sendgrid/mail';

function getSendGridClient() {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY environment variable is not set');
  }
  sgMail.setApiKey(apiKey);
  return sgMail;
}

function getBaseUrl() {
  // Use RAILWAY_PUBLIC_DOMAIN or FRONTEND_URL, fallback to localhost
  return process.env.RAILWAY_PUBLIC_DOMAIN 
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : process.env.FRONTEND_URL || 'https://gta-fan-hub-demo.vercel.app';
}

export async function sendConfirmationEmail(email, token) {
  const baseUrl = getBaseUrl();
  const confirmUrl = `${baseUrl}/api/newsletter/confirm?token=${token}`;
  const unsubscribeUrl = `${baseUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;

  try {
    const sgMail = getSendGridClient();
    
    // Get from address from env or use default
    const fromAddress = process.env.SENDGRID_FROM_EMAIL || 'noreply@gtafanhub.com';
    const fromName = process.env.SENDGRID_FROM_NAME || 'GtaFanHub';
    
    const msg = {
      to: email,
      from: {
        email: fromAddress,
        name: fromName,
      },
      subject: 'Confirm your GtaFanHub subscription',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <meta name="x-apple-disable-message-reformatting">
          <title>Confirm your subscription</title>
          <style type="text/css">
            /* Mobile-specific styles */
            @media only screen and (max-width: 600px) {
              .email-container {
                width: 100% !important;
                max-width: 100% !important;
              }
              .email-content {
                padding: 20px !important;
              }
              .button-container {
                width: 100% !important;
              }
              .button-link {
                display: block !important;
                width: 100% !important;
                padding: 18px 20px !important;
                text-align: center !important;
                -webkit-tap-highlight-color: rgba(255, 107, 157, 0.3);
              }
              .text-link {
                display: block !important;
                padding: 10px 0 !important;
                -webkit-tap-highlight-color: rgba(0, 191, 255, 0.3);
              }
            }
            /* Ensure links are clickable on all devices */
            a {
              -webkit-tap-highlight-color: rgba(0, 191, 255, 0.3);
              cursor: pointer;
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0f; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0a0a0f;">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="margin: 0 auto; max-width: 600px; width: 100%; background: linear-gradient(135deg, rgba(30, 30, 45, 0.95) 0%, rgba(20, 20, 30, 0.98) 100%); border-radius: 16px; border: 1px solid rgba(255, 107, 157, 0.3); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                      <h1 style="margin: 0; font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #FF6B9D 0%, #00BFFF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                        GtaFanHub
                      </h1>
                      <p style="margin: 10px 0 0 0; color: #a0a0b0; font-size: 14px; letter-spacing: 2px; text-transform: uppercase;">
                        Vice City Awaits
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td class="email-content" style="padding: 40px;">
                      <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                        Welcome to the crew! 🎮
                      </h2>
                      <p style="margin: 0 0 25px 0; color: #c0c0d0; font-size: 16px; line-height: 1.6;">
                        Thank you for subscribing to GtaFanHub updates! We're excited to have you join our community of GTA enthusiasts.
                      </p>
                      <p style="margin: 0 0 30px 0; color: #c0c0d0; font-size: 16px; line-height: 1.6;">
                        Please confirm your email address by clicking the button below:
                      </p>
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="button-container" style="margin: 0 auto 30px auto; width: 100%; max-width: 300px;">
                        <tr>
                          <td style="border-radius: 50px; background: linear-gradient(135deg, #FF6B9D 0%, #FF4778 100%); box-shadow: 0 4px 20px rgba(255, 107, 157, 0.4);">
                            <a href="${confirmUrl}" target="_blank" class="button-link" style="display: block; padding: 16px 40px; color: #ffffff !important; font-size: 16px; font-weight: 600; text-decoration: none; letter-spacing: 0.5px; -webkit-tap-highlight-color: rgba(255, 107, 157, 0.3); cursor: pointer;">
                              Confirm Subscription
                            </a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 0 0 15px 0; color: #808090; font-size: 14px;">
                        Or tap this link:
                      </p>
                      <p style="margin: 0 0 30px 0; word-break: break-all;">
                        <a href="${confirmUrl}" class="text-link" style="color: #00BFFF !important; font-size: 16px; text-decoration: underline; -webkit-tap-highlight-color: rgba(0, 191, 255, 0.3); cursor: pointer; display: inline-block; padding: 8px 0;">
                          ${confirmUrl}
                        </a>
                      </p>
                      <div style="background: rgba(0, 191, 255, 0.1); border-radius: 12px; padding: 20px; border-left: 4px solid #00BFFF;">
                        <h3 style="margin: 0 0 12px 0; color: #00BFFF; font-size: 16px; font-weight: 600;">
                          What you'll get:
                        </h3>
                        <ul style="margin: 0; padding: 0 0 0 20px; color: #c0c0d0; font-size: 14px; line-height: 1.8;">
                          <li>Latest GTA 6 news and updates</li>
                          <li>New feature announcements</li>
                          <li>Community highlights and events</li>
                          <li>Exclusive content and early access</li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px 40px; background: rgba(0, 0, 0, 0.3); border-radius: 0 0 16px 16px;">
                      <p style="margin: 0 0 15px 0; color: #606070; font-size: 13px; text-align: center;">
                        If you didn't request this subscription, you can safely ignore this email.
                      </p>
                      <p style="margin: 0 0 15px 0; color: #606070; font-size: 13px; text-align: center;">
                        This confirmation link expires in 7 days.
                      </p>
                      <p style="margin: 0; text-align: center;">
                        <a href="${unsubscribeUrl}" style="color: #808090 !important; font-size: 14px; text-decoration: underline; -webkit-tap-highlight-color: rgba(128, 128, 144, 0.3); cursor: pointer; display: inline-block; padding: 8px 0;">
                          Unsubscribe
                        </a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `Welcome to GtaFanHub!

Thank you for subscribing to our newsletter. Please confirm your email address by visiting:
${confirmUrl}

What you'll get:
- Latest GTA 6 news and updates
- New feature announcements
- Community highlights and events
- Exclusive content and early access

If you didn't request this subscription, you can safely ignore this email.
This confirmation link expires in 7 days.

To unsubscribe: ${unsubscribeUrl}`,
    };

    const result = await sgMail.send(msg);
    console.log('[SendGrid] Confirmation email sent successfully to:', email);
    console.log('[SendGrid] Response status:', result[0]?.statusCode);
    console.log('[SendGrid] Response headers:', result[0]?.headers);
    return { success: true, data: { messageId: result[0]?.headers?.['x-message-id'] || 'sent' } };
  } catch (error) {
    console.error('[SendGrid] Error sending confirmation email:', error);
    console.error('[SendGrid] Error message:', error.message);
    if (error.response) {
      console.error('[SendGrid] Error status code:', error.response.code);
      console.error('[SendGrid] Error response body:', JSON.stringify(error.response.body, null, 2));
    }
    return { success: false, error: error.message || error };
  }
}

export async function sendUnsubscribeConfirmation(email) {
  const baseUrl = getBaseUrl();
  const resubscribeUrl = `${baseUrl}/About`;

  try {
    const sgMail = getSendGridClient();
    
    // Get from address from env or use default
    const fromAddress = process.env.SENDGRID_FROM_EMAIL || 'noreply@gtafanhub.com';
    const fromName = process.env.SENDGRID_FROM_NAME || 'GtaFanHub';
    
    const msg = {
      to: email,
      from: {
        email: fromAddress,
        name: fromName,
      },
      subject: "You've been unsubscribed from GtaFanHub",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <meta name="x-apple-disable-message-reformatting">
          <style type="text/css">
            /* Mobile-specific styles */
            @media only screen and (max-width: 600px) {
              .email-container {
                width: 100% !important;
                max-width: 100% !important;
              }
              .email-content {
                padding: 20px !important;
              }
              .button-container {
                width: 100% !important;
              }
              .button-link {
                display: block !important;
                width: 100% !important;
                padding: 18px 20px !important;
                text-align: center !important;
                -webkit-tap-highlight-color: rgba(0, 191, 255, 0.3);
              }
            }
            /* Ensure links are clickable on all devices */
            a {
              -webkit-tap-highlight-color: rgba(0, 191, 255, 0.3);
              cursor: pointer;
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0f; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0a0a0f;">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="margin: 0 auto; max-width: 600px; width: 100%; background: linear-gradient(135deg, rgba(30, 30, 45, 0.95) 0%, rgba(20, 20, 30, 0.98) 100%); border-radius: 16px; border: 1px solid rgba(255, 107, 157, 0.3); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                      <h1 style="margin: 0; font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #FF6B9D 0%, #00BFFF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                        GtaFanHub
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td class="email-content" style="padding: 40px; text-align: center;">
                      <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                        You've been unsubscribed
                      </h2>
                      <p style="margin: 0 0 25px 0; color: #c0c0d0; font-size: 16px; line-height: 1.6;">
                        We're sorry to see you go! You've been successfully unsubscribed from GtaFanHub updates.
                      </p>
                      <p style="margin: 0 0 30px 0; color: #c0c0d0; font-size: 16px; line-height: 1.6;">
                        You won't receive any more emails from us unless you subscribe again.
                      </p>
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="button-container" style="margin: 0 auto; width: 100%; max-width: 300px;">
                        <tr>
                          <td style="border-radius: 50px; background: linear-gradient(135deg, #00BFFF 0%, #0099CC 100%); box-shadow: 0 4px 20px rgba(0, 191, 255, 0.3);">
                            <a href="${resubscribeUrl}" target="_blank" class="button-link" style="display: block; padding: 14px 32px; color: #ffffff !important; font-size: 16px; font-weight: 600; text-decoration: none; -webkit-tap-highlight-color: rgba(0, 191, 255, 0.3); cursor: pointer;">
                              Changed your mind? Resubscribe
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px 40px; background: rgba(0, 0, 0, 0.3); border-radius: 0 0 16px 16px;">
                      <p style="margin: 0; color: #606070; font-size: 13px; text-align: center;">
                        Thank you for being part of the GtaFanHub community.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `You've been unsubscribed from GtaFanHub

We're sorry to see you go! You've been successfully unsubscribed from GtaFanHub updates.

You won't receive any more emails from us unless you subscribe again.

Changed your mind? Visit ${resubscribeUrl} to resubscribe.

Thank you for being part of the GtaFanHub community.`,
    };

    const result = await sgMail.send(msg);
    console.log('[SendGrid] Unsubscribe confirmation sent successfully to:', email);
    return { success: true, data: { messageId: result[0]?.headers?.['x-message-id'] || 'sent' } };
  } catch (error) {
    console.error('[SendGrid] Error sending unsubscribe confirmation:', error);
    console.error('[SendGrid] Error message:', error.message);
    if (error.response) {
      console.error('[SendGrid] Error status code:', error.response.code);
      console.error('[SendGrid] Error response body:', JSON.stringify(error.response.body, null, 2));
    }
    return { success: false, error: error.message || error };
  }
}
