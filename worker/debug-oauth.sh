#!/bin/bash
# Run this to check what URL the GitHub button is trying to open
cd ~/dipdesigns/worker

# Add a quick debug endpoint to index.js to verify secrets are accessible
python3 << 'PYEOF'
import re

with open('index.js', 'r') as f:
    content = f.read()

# Add a debug endpoint BEFORE the default case in the switch
debug_endpoint = """      case '/api/debug':
        return new Response(JSON.stringify({
          github_client_id_set: !!env.GITHUB_CLIENT_ID,
          github_client_id_preview: env.GITHUB_CLIENT_ID ? env.GITHUB_CLIENT_ID.substring(0, 8) + '...' : null,
          google_client_id_set: !!env.GOOGLE_CLIENT_ID,
          google_client_id_preview: env.GOOGLE_CLIENT_ID ? env.GOOGLE_CLIENT_ID.substring(0, 8) + '...' : null,
          base_url: env.OAUTH_REDIRECT_URL || 'not set',
          kv_available: !!env.WEBHOOKS_KV,
          ledger_available: !!env.CREDIT_LEDGER,
        }), {
          headers: { 'Content-Type': 'application/json', ...cors },
        });
"""

# Find the case '/api/health' block and add debug after it
old_block = """      case '/api/health':
        return new Response(JSON.stringify({ status: 'ok', model: CONFIG.MODEL }), {
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      default:"""

new_block = """      case '/api/health':
        return new Response(JSON.stringify({ status: 'ok', model: CONFIG.MODEL }), {
          headers: { 'Content-Type': 'application/json', ...cors },
        });
""" + debug_endpoint + """      default:"""

content = content.replace(old_block, new_block)

with open('index.js', 'w') as f:
    f.write(content)

print("Debug endpoint added at /api/debug")
PYEOF

# Also add debug logging to handleOAuth
python3 << 'PYEOF'
with open('index.js', 'r') as f:
    content = f.read()

# Add logging to the redirect URL construction
old_redirect = """    if (provider === 'github') {
      redirectUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(baseUrl + '/api/auth/github/callback')}&state=${state}&scope=read:user,user:email`;"""

new_redirect = """    if (provider === 'github') {
      console.log('DEBUG: GITHUB_CLIENT_ID =', env.GITHUB_CLIENT_ID, 'baseUrl =', baseUrl);
      if (!env.GITHUB_CLIENT_ID) {
        return new Response(JSON.stringify({ error: 'GITHUB_CLIENT_ID not configured', debug: { baseUrl, provider } }), { status: 500, headers: { 'Content-Type': 'application/json', ...cors } });
      }
      redirectUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(baseUrl + '/api/auth/github/callback')}&state=${state}&scope=read:user,user:email`;"""

content = content.replace(old_redirect, new_redirect)

with open('index.js', 'w') as f:
    f.write(content)

print("Debug logging added to handleOAuth")
PYEOF

# Deploy
touch index.js
wrangler deploy --name jump-studio

echo ""
echo "=== Deployed ==="
echo "Visit: https://workers.dipdesigns.app/api/debug"
echo "Visit: https://workers.dipdesigns.app/api/auth/github"
echo ""
echo "After clicking the GitHub button, check the URL in your browser's address bar."
echo "If it shows client_id=undefined or client_id=, the secret is not accessible."
