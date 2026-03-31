import { createServer } from 'http';
import { readFileSync } from 'fs';
import path from 'path';

const dashboardDir = path.join(import.meta.dirname, '../src/dashboard');
const html = readFileSync(path.join(dashboardDir, 'index.html'), 'utf-8');
const linktreeHtml = readFileSync(path.join(dashboardDir, 'linktree.html'), 'utf-8');

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
