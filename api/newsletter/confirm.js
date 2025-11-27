// Newsletter confirmation endpoint
// GET /api/newsletter/confirm?token=xxx
import { getSubscribersCollection } from '../utils/db.js';
import { isTokenExpired } from '../utils/validation.js';

// Get the frontend URL for redirects
function getFrontendUrl() {
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`;
  }
  return 'http://localhost:5173';
}

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed. Use GET.' 
    });
  }

  const baseUrl = getFrontendUrl();

  try {
    // Get token from query params
    const { token } = req.query;

    // Validate token exists
    if (!token) {
      console.log('[Confirm] No token provided');
      return res.redirect(`${baseUrl}/About?error=invalid_token`);
    }

    // Connect to database
    const collection = await getSubscribersCollection();

    // Find subscriber by token
    const subscriber = await collection.findOne({ 
      confirmationToken: token 
    });

    // Token not found
    if (!subscriber) {
      console.log('[Confirm] Token not found:', token.substring(0, 10) + '...');
      return res.redirect(`${baseUrl}/About?error=invalid_token`);
    }

    // Check if already confirmed
    if (subscriber.status === 'confirmed') {
      console.log('[Confirm] Already confirmed:', subscriber.email);
      return res.redirect(`${baseUrl}/About?error=already_confirmed`);
    }

    // Check if token has expired (7 days)
    if (isTokenExpired(subscriber.subscribedAt, 7)) {
      console.log('[Confirm] Token expired for:', subscriber.email);
      return res.redirect(`${baseUrl}/About?error=token_expired`);
    }

    // Update subscriber status
    const result = await collection.updateOne(
      { _id: subscriber._id },
      {
        $set: {
          status: 'confirmed',
          confirmedAt: new Date(),
        },
        $unset: {
          confirmationToken: '', // Remove token for security
        }
      }
    );

    if (result.modifiedCount === 0) {
      console.error('[Confirm] Failed to update subscriber:', subscriber.email);
      return res.redirect(`${baseUrl}/About?error=confirmation_failed`);
    }

    console.log('[Confirm] Subscription confirmed:', subscriber.email);

    // Redirect to About page with success message
    return res.redirect(`${baseUrl}/About?subscribed=true`);

  } catch (error) {
    console.error('[Confirm] Error:', error);
    return res.redirect(`${baseUrl}/About?error=confirmation_failed`);
  }
}

