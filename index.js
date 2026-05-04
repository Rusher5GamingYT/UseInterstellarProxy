import http from "node:http";
import path from "node:path";
import bareMuxNode from "@mercuryworkshop/bare-mux/node";
import { server as wisp } from "@mercuryworkshop/wisp-js/server";
import { createBareServer } from "@nebula-services/bare-server-node";
import chalk from "chalk";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import basicAuth from "express-basic-auth";
import rateLimit from "express-rate-limit";
import mime from "mime";
import config from "./config.js";

console.log(chalk.yellow("🚀 Starting server..."));

const __dirname = process.cwd();
const server = http.createServer();
const app = express();
const bareServer = createBareServer("/bare/");
const { baremuxPath } = bareMuxNode;
const epoxyDistPath = path.join(__dirname, "node_modules", "@mercuryworkshop", "epoxy-transport", "dist");
const PORT = process.env.PORT || 8080;

wisp.options.allow_loopback_ips = true;
wisp.options.allow_private_ips = true;

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests, please try again later.",
});

const ghGamesLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests, please try again later.",
});

if (config.challenge !== false) {
  console.log(chalk.green("🔒 Password protection is enabled! Listing logins below"));
  Object.entries(config.users).forEach(([username, password]) => {
    console.log(chalk.blue(`Username: ${username}, Password: ${password}`));
  });
  app.use(basicAuth({ users: config.users, challenge: true }));
}

const ghGamesBases = {
  "/gh-games/1/": "https://raw.githubusercontent.com/qrs/x/fixy/",
  "/gh-games/2/": "https://raw.githubusercontent.com/3v1/V5-Assets/main/",
  "/gh-games/3/": "https://raw.githubusercontent.com/3v1/V5-Retro/master/",
  "/gh-games/4/": "https://raw.githubusercontent.com/xbubbo/V6-Assets/main/",
};
const noMimeExts = new Set([".unityweb"]);

app.get("/gh-games/*", ghGamesLimiter, async (req, res, next) => {
  try {
    let reqTarget;
    for (const [prefix, baseUrl] of Object.entries(ghGamesBases)) {
      if (req.path.startsWith(prefix)) {
        reqTarget = baseUrl + req.path.slice(prefix.length);
        break;
      }
    }
    if (!reqTarget) return next();

    const upstreamHeaders = {};
    if (req.headers["if-none-match"]) {
      upstreamHeaders["If-None-Match"] = req.headers["if-none-match"];
    }

    const asset = await fetch(reqTarget, { headers: upstreamHeaders });

    if (asset.status === 304) {
      return res.sendStatus(304);
    }

    if (!asset.ok) return next();

    const data = Buffer.from(await asset.arrayBuffer());
    const ext = path.extname(reqTarget);
    const contentType = noMimeExts.has(ext) ? "application/octet-stream" : mime.getType(ext);

    const etag = asset.headers.get("etag");
    const lastModified = asset.headers.get("last-modified");

    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      ...(etag && { ETag: etag }),
      ...(lastModified && { "Last-Modified": lastModified }),
    });
    res.end(data);
  } catch (error) {
    console.error("Error fetching asset:", error);
    res.status(500).type("text/html").send("Error fetching the asset");
  }
});

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const transportStaticOptions = {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath);
    if (ext === ".mjs" || ext === ".js") {
      res.type("text/javascript");
    } else if (ext === ".wasm") {
      res.type("application/wasm");
    }
  },
};

app.use(express.static(path.join(__dirname, "static")));
app.use("/bare", cors({ origin: true }));
app.use("/bm", express.static(baremuxPath, transportStaticOptions));
app.use("/ep", express.static(epoxyDistPath, transportStaticOptions));

const routes = [
  { path: "/apps", file: "apps.html" },
  { path: "/games", file: "games.html" },
  { path: "/play.html", file: "games.html" },
  { path: "/settings", file: "settings.html" },
  { path: "/tabs", file: "tabs.html" },
  { path: "/", file: "index.html" },
];

routes.forEach(route => {
  app.get(route.path, generalLimiter, (_req, res) => {
    res.sendFile(path.join(__dirname, "static", route.file));
  });
});

app.use(generalLimiter, (req, res) => {
  res.status(404).sendFile(path.join(__dirname, "static", "404.html"));
});

app.use(generalLimiter, (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).sendFile(path.join(__dirname, "static", "404.html"));
});

server.on("request", (req, res) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeRequest(req, res);
  } else {
    app(req, res);
  }
});

server.on("upgrade", (req, socket, head) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeUpgrade(req, socket, head);
  } else {
    wisp.routeRequest(req, socket, head);
  }
});

server.on("listening", () => {
  console.log(chalk.green(`🌍 Server is running on http://localhost:${PORT}`));
});

server.listen({ port: PORT });
