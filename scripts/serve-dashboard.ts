import { createServer } from 'http';
import { readFileSync } from 'fs';
import path from 'path';

const html = readFileSync(path.join(import.meta.dirname, '../src/dashboard/index.html'), 'utf-8');
const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});
server.listen(3000, () => console.log('Dashboard: http://localhost:3000'));
