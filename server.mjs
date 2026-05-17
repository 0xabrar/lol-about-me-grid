import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { createServer } from "node:http";

const root = process.cwd();
const port = Number(process.env.PORT || 4173);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".glb": "model/gltf-binary",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
};

function sendFile(response, filePath) {
  response.writeHead(200, {
    "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream",
  });
  createReadStream(filePath).pipe(response);
}

function resolvePath(urlPath) {
  const pathname = decodeURIComponent(urlPath.split("?")[0]);
  const routeFile = pathname === "/viewer" || pathname === "/viewer/" ? "viewer/index.html" : "";

  if (routeFile) {
    const routePath = resolve(root, routeFile);
    return existsSync(routePath) ? routePath : null;
  }

  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const requested = resolve(root, `.${safePath}`);

  if (!requested.startsWith(root)) {
    return null;
  }

  if (existsSync(requested) && statSync(requested).isFile()) {
    return requested;
  }

  const indexPath = join(root, "index.html");
  return existsSync(indexPath) ? indexPath : null;
}

createServer((request, response) => {
  const filePath = resolvePath(request.url || "/");
  if (!filePath) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  sendFile(response, filePath);
}).listen(port, () => {
  console.log(`Serving http://127.0.0.1:${port}`);
});
