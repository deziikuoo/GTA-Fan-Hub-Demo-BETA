// Newsletter subscription endpoint
// POST /api/newsletter/subscribe
import { getSubscribersCollection } from '../utils/db.js';
import { sendConfirmationEmail } from '../utils/email.js';
import { validateEmail, sanitizeEmail, generateToken } from '../utils/validation.js';

// Rate limiting: Track subscription attempts per IP
// In production, use Redis or similar for distributed rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 3; // Max attempts per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Check if IP has exceeded rate limit
 * @param {string} ip - IP address
 * @returns {boolean} - True if rate limited
 */
function isRateLimited(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record) {
    rateLimitMap.set(ip, { count: 1, firstAttempt: now });
    return false;
  }
  
  // Reset if window has passed
  if (now - record.firstAttempt > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, firstAttempt: now });
    return false;
  }
  
  // Check if exceeded
  if (record.count >= RATE_LIMIT_MAX) {
    return true;
  }
  
  // Increment count
  record.count++;
  return false;
}

/**
 * Clean up old rate limit entries (call periodically)
 */
function cleanupRateLimits() {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now - record.firstAttempt > RATE_LIMIT_WINDOW) {
      rateLimitMap.delete(ip);
    }
  }
}

// Helper function to parse JSON body
// Vercel automatically parses JSON bodies, but we handle both cases
function getJsonBody(req) {
  // Vercel parses JSON automatically, so req.body should be an object
  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
    return req.body;
  }
  // If it's a string, try to parse it
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (e) {
      return {};
    }
  }
  return {};
}

async function subscribeHandler(req, res) {
  // Clean up rate limits on each request (instead of setInterval)
  cleanupRateLimits();

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed. Use POST.' 
    });
  }

  // Check environment variables early
  if (!process.env.CONNECTION_STRING) {
    console.error('[Subscribe] CONNECTION_STRING environment variable is missing');
    return res.status(500).json({
      success: false,
      message: 'Server configuration error. Please contact support.'
    });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('[Subscribe] RESEND_API_KEY environment variable is missing');
    return res.status(500).json({
      success: false,
      message: 'Server configuration error. Please contact support.'
    });
  }

  try {
    // Get client IP for rate limiting
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
               req.headers['x-real-ip'] || 
               req.connection?.remoteAddress || 
               'unknown';

    // Check rate limit
    if (isRateLimited(ip)) {
      console.log('[Subscribe] Rate limit exceeded for IP:', ip);
      return res.status(429).json({
        success: false,
        message: 'Too many subscription attempts. Please try again later.'
      });
    }

    // Parse request body
    // Vercel automatically parses JSON bodies when Content-Type is application/json
    const body = getJsonBody(req);
    
    const { email, source = 'website' } = body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.'
      });
    }

    // Validate email
    const validation = validateEmail(email);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.reason
      });
    }

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email);

    // Connect to database
    let collection;
    try {
      collection = await getSubscribersCollection();
      console.log('[Subscribe] Database connection successful');
    } catch (dbError) {
      console.error('[Subscribe] Database connection error:', dbError);
      console.error('[Subscribe] Database error stack:', dbError.stack);
      return res.status(500).json({
        success: false,
        message: 'Database connection error. Please try again later.'
      });
    }

    // Check if email already exists
    const existing = await collection.findOne({ email: sanitizedEmail });

    if (existing) {
      // If already confirmed, don't allow re-subscription
      if (existing.status === 'confirmed') {
        return res.status(400).json({
          success: false,
          message: 'This email is already subscribed.'
        });
      }
      
      // If pending, resend confirmation email
      if (existing.status === 'pending') {
        // Generate new token
        const newToken = generateToken();
        
        // Update with new token
        await collection.updateOne(
          { email: sanitizedEmail },
          {
            $set: {
              confirmationToken: newToken,
              subscribedAt: new Date(),
              source,
              ipAddress: ip,
              userAgent: req.headers['user-agent'] || 'unknown',
            }
          }
        );
        
        // Resend confirmation email
        const emailResult = await sendConfirmationEmail(sanitizedEmail, newToken);
        
        if (!emailResult.success) {
          console.error('[Subscribe] Failed to resend confirmation email:', emailResult.error);
          return res.status(500).json({
            success: false,
            message: 'Failed to send confirmation email. Please try again.'
          });
        }
        
        return res.status(200).json({
          success: true,
          message: 'Confirmation email resent. Please check your inbox.'
        });
      }
      
      // If unsubscribed, allow re-subscription
      if (existing.status === 'unsubscribed') {
        const newToken = generateToken();
        
        await collection.updateOne(
          { email: sanitizedEmail },
          {
            $set: {
              status: 'pending',
              confirmationToken: newToken,
              subscribedAt: new Date(),
              source,
              ipAddress: ip,
              userAgent: req.headers['user-agent'] || 'unknown',
            },
            $unset: {
              unsubscribedAt: '',
            }
          }
        );
        
        const emailResult = await sendConfirmationEmail(sanitizedEmail, newToken);
        
        if (!emailResult.success) {
          return res.status(500).json({
            success: false,
            message: 'Failed to send confirmation email. Please try again.'
          });
        }
        
        return res.status(200).json({
          success: true,
          message: 'Welcome back! Please check your email to confirm your subscription.'
        });
      }
    }

    // New subscriber - generate token and save
    const token = generateToken();
    
    const subscriber = {
      email: sanitizedEmail,
      status: 'pending',
      confirmationToken: token,
      subscribedAt: new Date(),
      source,
      ipAddress: ip,
      userAgent: req.headers['user-agent'] || 'unknown',
    };

    await collection.insertOne(subscriber);
    console.log('[Subscribe] New subscriber added:', sanitizedEmail);

    // Send confirmation email
    const emailResult = await sendConfirmationEmail(sanitizedEmail, token);
    
    if (!emailResult.success) {
      // Delete the subscriber if email fails
      await collection.deleteOne({ email: sanitizedEmail });
      console.error('[Subscribe] Failed to send confirmation email, subscriber removed:', sanitizedEmail);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send confirmation email. Please try again.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Please check your email to confirm your subscription.'
    });

  } catch (error) {
    // Comprehensive error logging
    console.error('[Subscribe] ========== ERROR START ==========');
    console.error('[Subscribe] Error name:', error.name);
    console.error('[Subscribe] Error message:', error.message);
    console.error('[Subscribe] Error stack:', error.stack);
    console.error('[Subscribe] Error code:', error.code);
    console.error('[Subscribe] Environment check:', {
      hasConnectionString: !!process.env.CONNECTION_STRING,
      hasResendKey: !!process.env.RESEND_API_KEY,
      nodeEnv: process.env.NODE_ENV,
      vercelUrl: process.env.VERCEL_URL
    });
    console.error('[Subscribe] ========== ERROR END ==========');
    
    // Check for missing environment variables
    if (!process.env.CONNECTION_STRING) {
      console.error('[Subscribe] CONNECTION_STRING is not set');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error. Please contact support.'
      });
    }
    
    if (!process.env.RESEND_API_KEY) {
      console.error('[Subscribe] RESEND_API_KEY is not set');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error. Please contact support.'
      });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered.'
      });
    }
    
    // Handle MongoDB connection errors
    if (error.message && (error.message.includes('MongoServerError') || error.message.includes('MongoNetworkError') || error.message.includes('MongoTimeoutError'))) {
      console.error('[Subscribe] MongoDB error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Database connection error. Please try again later.'
      });
    }
    
    // Handle Resend API errors
    if (error.message && error.message.includes('Resend')) {
      console.error('[Subscribe] Resend API error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Email service error. Please try again later.'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again later.',
      // Include error details in development or if VERCEL_ENV is preview/development
      ...((process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') && { 
        error: error.message,
        errorName: error.name,
        errorCode: error.code
      })
    });
  }
}

// Export handler with top-level error catching
export default async function handler(req, res) {
  try {
    return await subscribeHandler(req, res);
  } catch (error) {
    // Catch any errors that occur before our handler runs
    console.error('[Subscribe] Top-level error:', error);
    console.error('[Subscribe] Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
      ...(process.env.VERCEL_ENV === 'preview' && {
        error: error.message
      })
    });
  }
}

