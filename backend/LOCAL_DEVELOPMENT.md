# Local Development Setup with Inngest

This guide will help you set up Inngest for local development using ngrok to expose your localhost server to the Inngest platform.

## Prerequisites

1. Node.js and npm installed
2. Inngest account and API keys
3. ngrok installed (or use ngrok via npm)

## Step 1: Environment Configuration

Create your `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Add your Inngest keys to `.env`:

```bash
# Inngest Configuration
INNGEST_EVENT_KEY=your_actual_inngest_event_key
INNGEST_SIGNING_KEY=your_actual_inngest_signing_key
INNGEST_BASE_URL=http://localhost:5000/api/inngest

# Local Development (optional - for ngrok)
NGROK_URL=https://your-ngrok-url.ngrok.io
```

## Step 2: Install ngrok

### Option A: Install ngrok globally
```bash
# Download ngrok from https://ngrok.com/download
# Or install via npm
npm install -g ngrok
```

### Option B: Use ngrok via npm package
```bash
npm install --save-dev ngrok
```

## Step 3: Start Your Development Server

```bash
npm run dev
# or
node src/server.js
```

Your server should be running on `http://localhost:5000`

## Step 4: Expose Your Server with ngrok

### Option A: Using ngrok CLI
```bash
ngrok http 5000
```

### Option B: Using ngrok npm package
```bash
npx ngrok http 5000
```

## Step 5: Configure Inngest

1. Copy the ngrok URL (looks like `https://random-string.ngrok.io`)
2. Add it to your `.env` file:
   ```bash
   NGROK_URL=https://your-actual-ngrok-url.ngrok.io
   ```
3. Restart your server to pick up the new environment variable

## Step 6: Register Your Webhook in Inngest

1. Go to your Inngest dashboard
2. Navigate to your app settings
3. Set the webhook URL to: `https://your-ngrok-url.ngrok.io/api/inngest`
4. Add your signing key for security

## Step 7: Test the Setup

### Test Webhook Health
```bash
curl https://your-ngrok-url.ngrok.io/api/inngest/health
```

Should return:
```json
{
  "status": "ok",
  "message": "Inngest webhook endpoint is active",
  "workflows_registered": 3
}
```

### Test Intent Creation
Create an intent via your API to trigger the workflow:
```bash
curl -X POST http://localhost:5000/api/intents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Test Intent",
    "description": "Testing intent matching workflow",
    "category": "electronics",
    "max_price": 100,
    "location": {
      "city": "New York",
      "state": "NY"
    }
  }'
```

## Development Workflow

### Starting Fresh
1. Start your server: `npm run dev`
2. Start ngrok: `ngrok http 5000`
3. Copy ngrok URL to `.env` as `NGROK_URL`
4. Restart server
5. Test webhook health

### Monitoring
- Check your server logs for Inngest webhook calls
- Monitor Inngest dashboard for workflow executions
- Use ngrok web interface to inspect requests

### Common Issues

**Webhook not receiving events:**
- Verify ngrok URL is correct in `.env`
- Check that server is running on port 5000
- Ensure Inngest webhook URL matches ngrok URL

**CORS errors:**
- Make sure your frontend URL is set in `.env`
- Check ngrok CORS settings if needed

**Authentication issues:**
- Verify Inngest keys are correct
- Check signing key configuration

## Package.json Scripts

Add these helpful scripts to your `package.json`:

```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "dev:ngrok": "concurrently \"npm run dev\" \"ngrok http 5000\"",
    "test:webhook": "curl http://localhost:5000/api/inngest/health",
    "ngrok": "ngrok http 5000"
  }
}
```

Install the required packages:
```bash
npm install --save-dev concurrently nodemon
```

## Security Notes

- Never commit your `.env` file with real API keys
- Use different keys for development and production
- ngrok URLs are temporary - update them when they change
- Consider using Inngest's dev environment for testing

## Next Steps

Once your local setup is working:

1. Test the intent matching workflow end-to-end
2. Verify push notifications work (if configured)
3. Check Socket.IO real-time notifications
4. Monitor workflow execution in Inngest dashboard
5. Set up proper error handling and logging

## Troubleshooting

Check the server logs for these messages:
- "Inngest webhook endpoint is active"
- "Intent matching workflow triggered"
- "Socket notification emitted"

If you see errors, verify:
- Environment variables are loaded correctly
- ngrok tunnel is active
- Inngest keys are valid
- Database connection is working
