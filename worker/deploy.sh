#!/bin/bash

# Affirm API Worker Deployment Script
# This script deploys the Affirm API Worker to Cloudflare Workers

echo "=========================================="
echo "  Affirm API Worker Deployment"
echo "=========================================="

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "Error: wrangler CLI is not installed."
    echo "Please install it using: npm install -g wrangler"
    exit 1
fi

# Check if we have the required environment variables
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "Warning: CLOUDFLARE_API_TOKEN environment variable is not set."
    echo "You may need to log in with 'wrangler login' if not already logged in."
fi

if [ -z "$GEMINI_API_KEY" ]; then
    echo "Warning: GEMINI_API_KEY environment variable is not set."
    echo "Your worker will need this to generate affirmations."
    echo "Please set it in your Cloudflare environment variables."
fi

# Check if wrangler.toml exists
if [ ! -f "wrangler.toml" ]; then
    echo "Error: wrangler.toml not found."
    echo "Please create a wrangler.toml configuration file."
    exit 1
fi

echo "Deploying worker..."
wrangler deploy

if [ $? -eq 0 ]; then
    echo "=========================================="
    echo "  Deployment Successful!"
    echo "=========================================="
    echo "Your Affirm API Worker has been deployed."
    echo ""
    echo "Next steps:"
    echo "1. Make sure the GEMINI_API_KEY is set in your Cloudflare environment."
    echo "2. Update the frontend API_URL to point to your worker URL."
    echo "3. Test the narrative integration with the frontend."
else
    echo "=========================================="
    echo "  Deployment Failed!"
    echo "=========================================="
    echo "Please check the error messages above."
fi 