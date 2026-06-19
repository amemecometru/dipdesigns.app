const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 3000;

let API_KEY = process.env.RECEIVER_API_KEY;
if (!API_KEY) {
  API_KEY = 'wek_' + crypto.randomBytes(18).toString('hex');
  console.warn('[DipDesigns] No RECEIVER_API_KEY set — generated a temporary key for this session:');
  console.warn('[DipDesigns]   ' + API_KEY);
  console.warn('[DipDesigns] In the studio: Settings (gear) → Device Sync → paste this as the "Desktop key".');
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Method not allowed. Use POST.' }));
  }

  const clientApiKey = req.headers['x-api-key'];
  if (!clientApiKey || clientApiKey !== API_KEY) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Unauthorized. Invalid or missing API key.' }));
  }

  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
    try {
      const payload = JSON.parse(body);
      const { filename, content } = payload;
      if (!filename || !content) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Missing filename or content payload.' }));
      }
      const safeFilename = path.basename(filename);
      const targetPath = path.join(__dirname, safeFilename);
      fs.writeFileSync(targetPath, content, 'utf8');
      console.log(`[DipDesigns] ${new Date().toLocaleTimeString()} — wrote ${safeFilename} (${content.length} bytes)`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: `File ${safeFilename} updated.` }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to parse data or write file.' }));
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[DipDesigns] Security bridge active on http://0.0.0.0:${PORT}`);
  console.log('[DipDesigns] Awaiting incoming vibe-code payloads from network…');
});
