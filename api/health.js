// Health check endpoint for debugging
export default async function handler(req, res) {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      hasConnectionString: !!process.env.CONNECTION_STRING,
      hasResendKey: !!process.env.RESEND_API_KEY,
      vercelUrl: process.env.VERCEL_URL || 'not set',
      nodeEnv: process.env.NODE_ENV || 'not set',
    }
  };

  return res.status(200).json(health);
}

