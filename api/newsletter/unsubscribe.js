// Newsletter unsubscribe endpoint
// GET /api/newsletter/unsubscribe?email=xxx
// POST /api/newsletter/unsubscribe { email: 'xxx' }
import { getSubscribersCollection } from '../utils/db.js';
import { sendUnsubscribeConfirmation } from '../utils/email.js';
import { sanitizeEmail, isValidEmailFormat } from '../utils/validation.js';

// Get the frontend URL for redirects
function getFrontendUrl() {
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`;
  }
  return 'http://localhost:5173';
}

export default async function handler(req, res) {
  const baseUrl = getFrontendUrl();
  
  // Handle both GET (from email link) and POST (from form) requests
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed. Use GET or POST.' 
    });
  }

  try {
    // Get email from query params (GET) or body (POST)
    let email;
    if (req.method === 'GET') {
      email = req.query.email;
    } else {
      email = req.body?.email;
    }

    // Validate email
    if (!email) {
      if (req.method === 'GET') {
        return res.redirect(`${baseUrl}/About?error=invalid_email`);
      }
      return res.status(400).json({
        success: false,
        message: 'Email address is required.'
      });
    }

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email);

    // Validate format
    if (!isValidEmailFormat(sanitizedEmail)) {
      if (req.method === 'GET') {
        return res.redirect(`${baseUrl}/About?error=invalid_email`);
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid email format.'
      });
    }

    // Connect to database
    const collection = await getSubscribersCollection();

    // Find subscriber
    const subscriber = await collection.findOne({ email: sanitizedEmail });

    // Subscriber not found
    if (!subscriber) {
      console.log('[Unsubscribe] Email not found:', sanitizedEmail);
      if (req.method === 'GET') {
        return res.redirect(`${baseUrl}/About?error=not_subscribed`);
      }
      return res.status(404).json({
        success: false,
        message: 'Email not found in our subscription list.'
      });
    }

    // Already unsubscribed
    if (subscriber.status === 'unsubscribed') {
      console.log('[Unsubscribe] Already unsubscribed:', sanitizedEmail);
      if (req.method === 'GET') {
        return res.redirect(`${baseUrl}/About?unsubscribed=true`);
      }
      return res.status(200).json({
        success: true,
        message: 'You are already unsubscribed.'
      });
    }

    // Update subscriber status
    const result = await collection.updateOne(
      { _id: subscriber._id },
      {
        $set: {
          status: 'unsubscribed',
          unsubscribedAt: new Date(),
        },
        $unset: {
          confirmationToken: '', // Remove any pending token
        }
      }
    );

    if (result.modifiedCount === 0) {
      console.error('[Unsubscribe] Failed to update subscriber:', sanitizedEmail);
      if (req.method === 'GET') {
        return res.redirect(`${baseUrl}/About?error=unsubscribe_failed`);
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to unsubscribe. Please try again.'
      });
    }

    console.log('[Unsubscribe] Successfully unsubscribed:', sanitizedEmail);

    // Send unsubscribe confirmation email (don't wait for it)
    sendUnsubscribeConfirmation(sanitizedEmail).catch(err => {
      console.error('[Unsubscribe] Failed to send confirmation email:', err);
    });

    // Return appropriate response
    if (req.method === 'GET') {
      return res.redirect(`${baseUrl}/About?unsubscribed=true`);
    }

    return res.status(200).json({
      success: true,
      message: 'You have been successfully unsubscribed.'
    });

  } catch (error) {
    console.error('[Unsubscribe] Error:', error);
    
    if (req.method === 'GET') {
      return res.redirect(`${baseUrl}/About?error=unsubscribe_failed`);
    }
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again later.'
    });
  }
}

