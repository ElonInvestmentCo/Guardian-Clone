import { createServer } from 'node:http';

const port = process.env.PORT ?? 3000;
createServer((_, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
}).listen(port, () => {
  console.log(`Library health server listening on port ${port}`);
});
