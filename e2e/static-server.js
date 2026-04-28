const fs = require('fs');
const http = require('http');
const path = require('path');

const root = path.join(__dirname, '..', 'dist');
const host = '127.0.0.1';
const port = 8081;

const types = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
};

http
  .createServer((request, response) => {
    const urlPath = decodeURIComponent((request.url || '/').split('?')[0]);
    const requestedPath = path.normalize(path.join(root, urlPath));
    const filePath = requestedPath.startsWith(root) && fs.existsSync(requestedPath) && fs.statSync(requestedPath).isFile()
      ? requestedPath
      : path.join(root, 'index.html');

    fs.readFile(filePath, (error, content) => {
      if (error) {
        response.writeHead(500);
        response.end('Server error');
        return;
      }

      response.writeHead(200, { 'Content-Type': types[path.extname(filePath)] || 'application/octet-stream' });
      response.end(content);
    });
  })
  .listen(port, host);
