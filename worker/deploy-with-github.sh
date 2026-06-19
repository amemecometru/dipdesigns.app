#!/bin/bash
# Deploy jump-studio worker with GitHub OAuth secrets
set -e

echo "=== Deploying jump-studio ==="
echo "NOTE: After rotating your GitHub secrets, run:"
echo ""
echo "  wrangler secret put GITHUB_CLIENT_ID   --name jump-studio"
echo "  wrangler secret put GITHUB_CLIENT_SECRET --name jump-studio"
echo ""
echo "Paste your values when prompted."
echo ""

# Set secrets (will prompt for values)
wrangler secret put GITHUB_CLIENT_ID --name jump-studio
wrangler secret put GITHUB_CLIENT_SECRET --name jump-studio

# Deploy the worker
wrangler deploy --name jump-studio

echo ""
echo "=== Deployed! ==="
echo "GitHub callback: https://workers.dipdesigns.app/api/auth/github/callback"
echo "Google callback: https://workers.dipdesigns.app/api/auth/google/callback"
echo ""
echo "Update GitHub OAuth App settings:"
echo "  Homepage URL: https://workers.dipdesigns.app"
echo "  Authorization callback URL: https://workers.dipdesigns.app/api/auth/github/callback"
echo ""
echo "Update Google Cloud Console:"
echo "  Add redirect URI: https://workers.dipdesigns.app/api/auth/google/callback"
