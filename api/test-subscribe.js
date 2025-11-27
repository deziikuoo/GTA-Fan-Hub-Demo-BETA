// Minimal test endpoint to verify function structure works
export default async function handler(req, res) {
  try {
    console.log('[Test] Function called');
    console.log('[Test] Method:', req.method);
    console.log('[Test] Headers:', JSON.stringify(req.headers));
    console.log('[Test] Body:', req.body);
    console.log('[Test] Environment:', {
      hasConnectionString: !!process.env.CONNECTION_STRING,
      hasResendKey: !!process.env.RESEND_API_KEY,
    });

    return res.status(200).json({
      success: true,
      message: 'Test endpoint works',
      method: req.method,
      hasBody: !!req.body,
      bodyType: typeof req.body,
      env: {
        hasConnectionString: !!process.env.CONNECTION_STRING,
        hasResendKey: !!process.env.RESEND_API_KEY,
      }
    });
  } catch (error) {
    console.error('[Test] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}

