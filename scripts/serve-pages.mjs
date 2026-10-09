import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const prefix = "/media-mandala";
const mime = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif",
  ".ico": "image/x-icon", ".mp4": "video/mp4", ".mp3": "audio/mpeg",
  ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf"
};
const server = http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname); }
  catch { res.writeHead(400).end("Bad request"); return; }
  if (pathname === prefix || pathname === prefix + "/") pathname = prefix + "/index.html";
  if (!pathname.startsWith(prefix + "/")) { res.writeHead(404).end("Not found"); return; }
  const relative = pathname.slice(prefix.length + 1);
  const target = path.resolve(root, relative);
  if (!target.startsWith(root + path.sep)) { res.writeHead(403).end("Forbidden"); return; }
  let file = target;
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end("Not found"); return; }
  res.writeHead(200, {
    "Content-Type": mime[path.extname(file).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  fs.createReadStream(file).pipe(res);
});
server.listen(4173, "127.0.0.1", () => console.log("Static test server listening on http://127.0.0.1:4173/media-mandala/"));
