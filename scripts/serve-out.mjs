// Маленький статический сервер для папки out/ со сжатием — как на обычном хостинге.
// Нужен для честного замера Lighthouse. Запуск: npm run serve  →  http://localhost:3219
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const ROOT = path.resolve("out");
const PORT = Number(process.env.PORT || 3219);
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp",
  ".avif": "image/avif", ".woff2": "font/woff2", ".ico": "image/x-icon",
  ".mp4": "video/mp4", ".vtt": "text/vtt; charset=utf-8",
};
const TEXT = new Set([".html", ".js", ".css", ".json", ".txt", ".xml", ".svg"]);

http
  .createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p.endsWith("/")) p += "index.html";
    let file = path.join(ROOT, p);
    if (!file.startsWith(ROOT)) return res.writeHead(403).end();
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404, { "content-type": TYPES[".html"] });
      return res.end(fs.readFileSync(path.join(ROOT, "404.html")));
    }
    const ext = path.extname(file);
    const headers = {
      "content-type": TYPES[ext] || "application/octet-stream",
      "cache-control": p.startsWith("/_next/static/") || p.startsWith("/images/")
        ? "public, max-age=31536000, immutable"
        : "public, max-age=0, must-revalidate",
    };
    const body = fs.readFileSync(file);
    if (TEXT.has(ext) && /\bgzip\b/.test(req.headers["accept-encoding"] || "")) {
      headers["content-encoding"] = "gzip";
      return res.writeHead(200, headers).end(zlib.gzipSync(body));
    }
    res.writeHead(200, headers).end(body);
  })
  .listen(PORT, () => console.log(`out/ → http://localhost:${PORT}`));
