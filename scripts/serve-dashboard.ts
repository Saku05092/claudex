import "dotenv/config";
import { createServer } from 'http';
import { readFileSync } from 'fs';
import path from 'path';

const dashboardDir = path.join(import.meta.dirname, '../src/dashboard');
let html = readFileSync(path.join(dashboardDir, 'index.html'), 'utf-8');
const linktreeHtml = readFileSync(path.join(dashboardDir, 'linktree.html'), 'utf-8');

// Inject Supabase config from .env into the dashboard HTML
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (supabaseUrl && supabaseKey) {
  const configScript = `<script>window.CLAUDEX_SUPABASE_URL="${supabaseUrl}";window.CLAUDEX_SUPABASE_KEY="${supabaseKey}";</script>`;
  html = html.replace('</head>', configScript + '\n</head>');
  console.log('[Dashboard] Supabase auth enabled');
} else {
  console.log('[Dashboard] Warning: SUPABASE_URL/SUPABASE_ANON_KEY not set. Auth disabled.');
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost:3000');

  if (url.pathname === '/links') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(linktreeHtml);
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});
server.listen(3000, () => console.log('Dashboard: http://localhost:3000'));
