// Express server for newsletter subscription API
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectToDatabase, getSubscribersCollection } from './utils/db.js';
import { sendConfirmationEmail } from './utils/email.js';
import { validateEmail, sanitizeEmail, generateToken, isValidEmailFormat } from './utils/validation.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'https://gta-fan-hub-demo.vercel.app',
    'https://gta-fan-hub-demo.vercel.app',
    'http://localhost:5173' // For local development
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      hasConnectionString: !!process.env.CONNECTION_STRING,
      hasResendKey: !!process.env.RESEND_API_KEY,
      nodeEnv: process.env.NODE_ENV || 'development',
    }
  });
});

// Rate limiting: Simple in-memory store (use Redis in production)
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record) {
    rateLimitMap.set(ip, { count: 1, firstAttempt: now });
    return false;
  }
  
  if (now - record.firstAttempt > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, firstAttempt: now });
    return false;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return true;
  }
  
  record.count++;
  return false;
}

// Cleanup old rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now - record.firstAttempt > RATE_LIMIT_WINDOW) {
      rateLimitMap.delete(ip);
    }
  }
}, 10 * 60 * 1000); // Every 10 minutes

// Subscribe endpoint
app.post('/api/newsletter/subscribe', async (req, res) => {
  try {
    // Get client IP
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
               req.ip || 
               'unknown';

    // Check rate limit
    if (isRateLimited(ip)) {
      return res.status(429).json({
        success: false,
        message: 'Too many subscription attempts. Please try again later.'
      });
    }

    const { email, source = 'website' } = req.body;

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
    const collection = await getSubscribersCollection();

    // Check if email already exists
    const existing = await collection.findOne({ email: sanitizedEmail });

    if (existing) {
      if (existing.status === 'confirmed') {
        return res.status(400).json({
          success: false,
          message: 'This email is already subscribed.'
        });
      }
      
      if (existing.status === 'pending') {
        const newToken = generateToken();
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
        
        const emailResult = await sendConfirmationEmail(sanitizedEmail, newToken);
        if (!emailResult.success) {
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

    // New subscriber
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

    // Send confirmation email
    const emailResult = await sendConfirmationEmail(sanitizedEmail, token);
    
    if (!emailResult.success) {
      await collection.deleteOne({ email: sanitizedEmail });
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
    console.error('[Subscribe] Error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered.'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again later.'
    });
  }
});

// Confirm subscription endpoint
app.get('/api/newsletter/confirm', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.redirect(`${process.env.FRONTEND_URL || 'https://gta-fan-hub-demo.vercel.app'}/About?error=invalid_token`);
    }

    const collection = await getSubscribersCollection();
    const subscriber = await collection.findOne({ confirmationToken: token });

    if (!subscriber) {
      return res.redirect(`${process.env.FRONTEND_URL || 'https://gta-fan-hub-demo.vercel.app'}/About?error=invalid_token`);
    }

    if (subscriber.status === 'confirmed') {
      return res.redirect(`${process.env.FRONTEND_URL || 'https://gta-fan-hub-demo.vercel.app'}/About?subscribed=true`);
    }

    // Update to confirmed
    await collection.updateOne(
      { confirmationToken: token },
      {
        $set: {
          status: 'confirmed',
          confirmedAt: new Date(),
        },
        $unset: {
          confirmationToken: '',
        }
      }
    );

    return res.redirect(`${process.env.FRONTEND_URL || 'https://gta-fan-hub-demo.vercel.app'}/About?subscribed=true`);
  } catch (error) {
    console.error('[Confirm] Error:', error);
    return res.redirect(`${process.env.FRONTEND_URL || 'https://gta-fan-hub-demo.vercel.app'}/About?error=confirmation_failed`);
  }
});

// Unsubscribe endpoint
app.post('/api/newsletter/unsubscribe', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !isValidEmailFormat(email)) {
      return res.status(400).json({
        success: false,
        message: 'Valid email address is required.'
      });
    }

    const sanitizedEmail = sanitizeEmail(email);
    const collection = await getSubscribersCollection();
    const subscriber = await collection.findOne({ email: sanitizedEmail });

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Email not found in our system.'
      });
    }

    if (subscriber.status === 'unsubscribed') {
      return res.status(400).json({
        success: false,
        message: 'This email is already unsubscribed.'
      });
    }

    await collection.updateOne(
      { email: sanitizedEmail },
      {
        $set: {
          status: 'unsubscribed',
          unsubscribedAt: new Date(),
        }
      }
    );

    // Send unsubscribe confirmation
    const { sendUnsubscribeConfirmation } = await import('./utils/email.js');
    await sendUnsubscribeConfirmation(sanitizedEmail);

    return res.status(200).json({
      success: true,
      message: 'You have been unsubscribed successfully.'
    });
  } catch (error) {
    console.error('[Unsubscribe] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again later.'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Newsletter API server running on port ${PORT}`);
  console.log(`📧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

