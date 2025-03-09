# Affirm API - Cloudflare Worker

This directory contains the Cloudflare Worker code for the Affirm project. The worker serves as the backend API that generates positive affirmations using the Gemini API.

## API Endpoints

- `GET /api/affirmation` - Generates a new positive affirmation
- `POST /api/related-affirmation` - Generates a related affirmation based on a previous one

## Deployment Instructions

1. **Install Wrangler**

   If you haven't already, install Wrangler (Cloudflare Workers CLI):

   ```bash
   npm install -g wrangler
   ```

2. **Authenticate with Cloudflare**

   Log in to your Cloudflare account:

   ```bash
   wrangler login
   ```

3. **Configure the Worker**

   Update the `wrangler.toml` file with your account ID:

   ```toml
   account_id = "your-account-id"
   ```

4. **Set up Gemini API Key**

   You'll need a Gemini API key. Once you have it, add it as a secret:

   ```bash
   wrangler secret put GEMINI_API_KEY
   ```

   When prompted, enter your Gemini API key.

5. **Deploy the Worker**

   Deploy the worker to Cloudflare:

   ```bash
   wrangler publish
   ```

6. **Update Frontend Configuration**

   After deployment, update the API URL in the frontend code to point to your deployed worker.

## Local Development

To test the worker locally:

```bash
wrangler dev
```

This will start a local development server that emulates the Cloudflare Workers environment.

## Customization

You can customize the affirmation prompts by modifying the prompt templates in `index.js`. 