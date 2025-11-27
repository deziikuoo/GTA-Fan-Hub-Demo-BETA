# GtaFanHub Newsletter API Backend

Express.js backend for newsletter subscription functionality, designed to run on Railway.

Uses SendGrid for email delivery (free tier: 100 emails/day, no domain verification required).

## Setup Instructions

### 1. Deploy to Railway

1. Go to [Railway.app](https://railway.app) and sign up/login
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"** (or upload the `backend` folder)
4. Railway will auto-detect Node.js and install dependencies

### 2. Set Environment Variables

In Railway dashboard, go to your project → **Variables** tab, add:

```
CONNECTION_STRING=mongodb+srv://username:password@cluster.mongodb.net/GTAFanHub?retryWrites=true&w=majority
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@gtafanhub.com
SENDGRID_FROM_NAME=GtaFanHub
FRONTEND_URL=https://gta-fan-hub-demo.vercel.app
PORT=3000
```

### 3. Update Frontend API URL

In your Vercel frontend (`src/views/About.vue`), update the fetch URL:

```javascript
const response = await fetch("YOUR_RAILWAY_URL/api/newsletter/subscribe", {
  // ... rest of the code
});
```

Replace `YOUR_RAILWAY_URL` with your Railway deployment URL (e.g., `https://your-app.railway.app`)

### 4. Test

- Health check: `https://your-app.railway.app/health`
- Subscribe: POST to `https://your-app.railway.app/api/newsletter/subscribe`

## Local Development

```bash
cd backend
npm install
npm run dev
```

Create a `.env` file:
```
CONNECTION_STRING=your_mongodb_connection_string
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@gtafanhub.com
SENDGRID_FROM_NAME=GtaFanHub
FRONTEND_URL=http://localhost:5173
PORT=3000
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/newsletter/subscribe` - Subscribe to newsletter
- `GET /api/newsletter/confirm?token=xxx` - Confirm subscription
- `POST /api/newsletter/unsubscribe` - Unsubscribe

