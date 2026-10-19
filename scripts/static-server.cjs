const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8", ".ico": "image/x-icon" };

/** 僅讀取已建置檔案，不做網址改寫、業務 API 或設備連線。 */
function createStaticServer(outRoot, basePath = "") {
  return http.createServer(async (request, response) => {
    try {
      if (!["GET", "HEAD"].includes(request.method)) { response.writeHead(405).end(); return; }
      let pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
      if (basePath) { if (pathname === basePath) pathname = "/"; else if (pathname.startsWith(`${basePath}/`)) pathname = pathname.slice(basePath.length); else { response.writeHead(404).end(); return; } }
      let target = path.resolve(outRoot, `.${pathname}`);
      if (!target.startsWith(`${outRoot}${path.sep}`) && target !== outRoot) { response.writeHead(403).end(); return; }
      const info = await fs.stat(target); if (info.isDirectory()) target = path.join(target, "index.html");
      const content = await fs.readFile(target); response.writeHead(200, { "Content-Type": mime[path.extname(target)] || "application/octet-stream", "Cache-Control": "no-store" }); response.end(request.method === "HEAD" ? undefined : content);
    } catch { response.writeHead(404).end(); }
  });
}
module.exports = { createStaticServer };
