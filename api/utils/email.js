// Email service using Resend API
import { Resend } from 'resend';

// Initialize Resend client (lazy initialization to ensure env vars are loaded)
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }
  return new Resend(apiKey);
}

// Get base URL for links
function getBaseUrl() {
  // Use VERCEL_URL if available, otherwise fall back to localhost
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    // VERCEL_URL doesn't include protocol
    return vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`;
  }
  return 'http://localhost:5173';
}

/**
 * Send confirmation email to new subscriber
 * @param {string} email - Subscriber email address
 * @param {string} token - Confirmation token
 * @returns {Promise<{success: boolean, error?: any}>}
 */
export async function sendConfirmationEmail(email, token) {
  const baseUrl = getBaseUrl();
  const confirmUrl = `${baseUrl}/api/newsletter/confirm?token=${token}`;
  const unsubscribeUrl = `${baseUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;

  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: 'GtaFanHub <onboarding@resend.dev>', // Change to your verified domain in production
      to: email,
      subject: 'Confirm your GtaFanHub subscription',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirm your subscription</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0f;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0a0a0f;">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background: linear-gradient(135deg, rgba(30, 30, 45, 0.95) 0%, rgba(20, 20, 30, 0.98) 100%); border-radius: 16px; border: 1px solid rgba(255, 107, 157, 0.3); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
                  
                  <!-- Header -->
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
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                        Welcome to the crew! 🎮
                      </h2>
                      <p style="margin: 0 0 25px 0; color: #c0c0d0; font-size: 16px; line-height: 1.6;">
                        Thank you for subscribing to GtaFanHub updates! We're excited to have you join our community of GTA enthusiasts.
                      </p>
                      <p style="margin: 0 0 30px 0; color: #c0c0d0; font-size: 16px; line-height: 1.6;">
                        Please confirm your email address by clicking the button below:
                      </p>
                      
                      <!-- CTA Button -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 30px auto;">
                        <tr>
                          <td style="border-radius: 50px; background: linear-gradient(135deg, #FF6B9D 0%, #FF4778 100%); box-shadow: 0 4px 20px rgba(255, 107, 157, 0.4);">
                            <a href="${confirmUrl}" target="_blank" style="display: inline-block; padding: 16px 40px; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; letter-spacing: 0.5px;">
                              Confirm Subscription
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Fallback Link -->
                      <p style="margin: 0 0 15px 0; color: #808090; font-size: 14px;">
                        Or copy and paste this link into your browser:
                      </p>
                      <p style="margin: 0 0 30px 0; word-break: break-all;">
                        <a href="${confirmUrl}" style="color: #00BFFF; font-size: 13px; text-decoration: underline;">
                          ${confirmUrl}
                        </a>
                      </p>
                      
                      <!-- What to expect -->
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
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background: rgba(0, 0, 0, 0.3); border-radius: 0 0 16px 16px;">
                      <p style="margin: 0 0 15px 0; color: #606070; font-size: 13px; text-align: center;">
                        If you didn't request this subscription, you can safely ignore this email.
                      </p>
                      <p style="margin: 0 0 15px 0; color: #606070; font-size: 13px; text-align: center;">
                        This confirmation link expires in 7 days.
                      </p>
                      <p style="margin: 0; text-align: center;">
                        <a href="${unsubscribeUrl}" style="color: #808090; font-size: 12px; text-decoration: underline;">
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
      text: `
Welcome to GtaFanHub!

Thank you for subscribing to our newsletter. Please confirm your email address by visiting the following link:

${confirmUrl}

What you'll get:
- Latest GTA 6 news and updates
- New feature announcements
- Community highlights and events
- Exclusive content and early access

If you didn't request this subscription, you can safely ignore this email.

This confirmation link expires in 7 days.

To unsubscribe: ${unsubscribeUrl}
      `.trim(),
    });

    if (error) {
      console.error('[Resend] Error sending confirmation email:', error);
      return { success: false, error };
    }

    console.log('[Resend] Confirmation email sent to:', email, 'ID:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('[Resend] Exception sending confirmation email:', error);
    return { success: false, error };
  }
}

/**
 * Send unsubscribe confirmation email
 * @param {string} email - Subscriber email address
 * @returns {Promise<{success: boolean, error?: any}>}
 */
export async function sendUnsubscribeConfirmation(email) {
  const baseUrl = getBaseUrl();
  const resubscribeUrl = `${baseUrl}/About`;

  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: 'GtaFanHub <onboarding@resend.dev>', // Change to your verified domain in production
      to: email,
      subject: "You've been unsubscribed from GtaFanHub",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Unsubscribed</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0f;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0a0a0f;">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background: linear-gradient(135deg, rgba(30, 30, 45, 0.95) 0%, rgba(20, 20, 30, 0.98) 100%); border-radius: 16px; border: 1px solid rgba(255, 107, 157, 0.3); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                      <h1 style="margin: 0; font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #FF6B9D 0%, #00BFFF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                        GtaFanHub
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px; text-align: center;">
                      <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                        You've been unsubscribed
                      </h2>
                      <p style="margin: 0 0 25px 0; color: #c0c0d0; font-size: 16px; line-height: 1.6;">
                        We're sorry to see you go! You've been successfully unsubscribed from GtaFanHub updates.
                      </p>
                      <p style="margin: 0 0 30px 0; color: #c0c0d0; font-size: 16px; line-height: 1.6;">
                        You won't receive any more emails from us unless you subscribe again.
                      </p>
                      
                      <!-- Resubscribe Button -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                        <tr>
                          <td style="border-radius: 50px; background: linear-gradient(135deg, #00BFFF 0%, #0099CC 100%); box-shadow: 0 4px 20px rgba(0, 191, 255, 0.3);">
                            <a href="${resubscribeUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none;">
                              Changed your mind? Resubscribe
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
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
      text: `
You've been unsubscribed from GtaFanHub

We're sorry to see you go! You've been successfully unsubscribed from GtaFanHub updates.

You won't receive any more emails from us unless you subscribe again.

Changed your mind? Visit ${resubscribeUrl} to resubscribe.

Thank you for being part of the GtaFanHub community.
      `.trim(),
    });

    if (error) {
      console.error('[Resend] Error sending unsubscribe confirmation:', error);
      return { success: false, error };
    }

    console.log('[Resend] Unsubscribe confirmation sent to:', email);
    return { success: true, data };
  } catch (error) {
    console.error('[Resend] Exception sending unsubscribe confirmation:', error);
    return { success: false, error };
  }
}

