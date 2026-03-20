import type { Request, Response, NextFunction } from "express";
import helmet from "helmet";

const CREATOR = "APIs by Silent Wolf | A tech explorer";
const isDev = process.env.NODE_ENV !== "production";

const ipRequestCounts = new Map<string, { count: number; windowStart: number; blocked: boolean; blockExpires: number }>();

const suspiciousPatterns = [
  /curl\b/i,
  /wget\b/i,
  /python-requests/i,
  /scrapy/i,
  /puppeteer/i,
  /playwright/i,
  /selenium/i,
  /headless/i,
  /bot(?!.*google|.*bing|.*yahoo|.*duckduck)/i,
  /spider(?!.*google|.*bing)/i,
  /crawler/i,
  /scraper/i,
  /httpclient/i,
  /java\/\d/i,
  /libwww/i,
  /apache-http/i,
  /go-http-client/i,
  /node-fetch/i,
  /axios/i,
  /undici/i,
  /got\//i,
  /postman/i,
  /insomnia/i,
  /httpie/i,
];

const cloneDetectionPaths = [
  "/api/endpoints",
  "/api/categories",
  "/api/list",
  "/api/schema",
  "/api/docs",
  "/api/all",
  "/api/config",
  "/api/manifest",
  "/api/sitemap",
  "/api/swagger",
  "/api/openapi",
  "/.env",
  "/robots.txt",
  "/sitemap.xml",
  "/.git",
  "/package.json",
  "/tsconfig.json",
  "/webpack.config",
  "/vite.config",
  "/node_modules",
  "/src",
  "/server",
  "/lib",
  "/shared",
];

function getClientIP(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || req.ip || "unknown";
}

function isSuspiciousUA(ua: string): boolean {
  if (!ua || ua.length < 10) return true;
  return suspiciousPatterns.some(p => p.test(ua));
}

export function securityHeaders() {
  if (isDev) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"],
        frameAncestors: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xFrameOptions: false,
  });
}

const WHITELISTED_IPS = [
  "136.109.115.21",
];

export function antiScraping(req: Request, res: Response, next: NextFunction) {
  if (!req.path.startsWith("/api/") && !req.path.startsWith("/download/")) {
    return next();
  }

  const ua = req.headers["user-agent"] || "";
  const ip = getClientIP(req);

  if (WHITELISTED_IPS.includes(ip)) return next();
  const path = req.path.toLowerCase();
  const now = Date.now();

  const record = ipRequestCounts.get(ip);
  if (record) {
    if (record.blocked && now < record.blockExpires) {
      return res.status(403).json({
        success: false,
        error: "Access temporarily blocked due to suspicious activity.",
        creator: CREATOR,
      });
    }
    if (record.blocked && now >= record.blockExpires) {
      record.blocked = false;
      record.count = 0;
      record.windowStart = now;
    }
  }

  for (const blocked of cloneDetectionPaths) {
    if (path === blocked || path.startsWith(blocked + "/")) {
      if (path === "/robots.txt") {
        res.setHeader("Content-Type", "text/plain");
        return res.send("User-agent: *\nDisallow: /api/\nDisallow: /download/\nDisallow: /server/\nDisallow: /lib/\nDisallow: /shared/\n");
      }

      const entry = ipRequestCounts.get(ip) || { count: 0, windowStart: now, blocked: false, blockExpires: 0 };
      entry.count += 5;
      if (entry.count > 20) {
        entry.blocked = true;
        entry.blockExpires = now + 30 * 60 * 1000;
      }
      ipRequestCounts.set(ip, entry);

      return res.status(404).json({ error: "Not found" });
    }
  }

  if (req.path.startsWith("/api/") || req.path.startsWith("/download/")) {
    if (isSuspiciousUA(ua)) {
      const entry = ipRequestCounts.get(ip) || { count: 0, windowStart: now, blocked: false, blockExpires: 0 };
      entry.count += 2;
      if (entry.count > 30) {
        entry.blocked = true;
        entry.blockExpires = now + 15 * 60 * 1000;
      }
      ipRequestCounts.set(ip, entry);
    }

    const entry = ipRequestCounts.get(ip) || { count: 0, windowStart: now, blocked: false, blockExpires: 0 };
    if (now - entry.windowStart > 5 * 60 * 1000) {
      entry.count = 0;
      entry.windowStart = now;
    }
    entry.count += 1;
    ipRequestCounts.set(ip, entry);

    if (entry.count > 200) {
      entry.blocked = true;
      entry.blockExpires = now + 60 * 60 * 1000;
      return res.status(429).json({
        success: false,
        error: "Excessive requests detected. You have been temporarily blocked for 1 hour.",
        creator: CREATOR,
      });
    }
  }

  next();
}

export function antiClone(req: Request, res: Response, next: NextFunction) {
  if (!req.path.startsWith("/api/")) return next();
  const path = req.path;

  if (path === "/api/endpoints/list" || path === "/api/all-endpoints") {
    const referer = req.headers.referer || req.headers.origin || "";
    const host = req.headers.host || "";
    const ua = req.headers["user-agent"] || "";

    const isFromOwnSite = referer.includes(host) || referer === "";
    const isBrowser = /Mozilla|Chrome|Safari|Firefox|Edge/i.test(ua) && !isSuspiciousUA(ua);

    if (!isFromOwnSite || !isBrowser) {
      return res.status(403).json({
        success: false,
        error: "Access denied. This endpoint is for internal use only.",
        creator: CREATOR,
      });
    }
  }

  next();
}

export function responseFingerprint(_req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    if (body && typeof body === "object" && !Array.isArray(body)) {
      body._powered = "WolfAPIs";
      body._ts = Date.now();
    }
    return originalJson(body);
  };
  next();
}

export function blockDirectSourceAccess(req: Request, res: Response, next: NextFunction) {
  if (isDev) return next();

  const path = req.path.toLowerCase();
  const blockedExtensions = [".ts", ".tsx", ".map", ".env", ".lock", ".toml"];
  const blockedDirs = ["/server/", "/lib/", "/shared/", "/.local/", "/node_modules/", "/.git/"];

  if (path.startsWith("/api/") || path.startsWith("/download/") || path.startsWith("/assets/")) {
    return next();
  }

  for (const dir of blockedDirs) {
    if (path.startsWith(dir)) {
      return res.status(404).json({ error: "Not found" });
    }
  }

  for (const ext of blockedExtensions) {
    if (path.endsWith(ext)) {
      return res.status(404).json({ error: "Not found" });
    }
  }

  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRequestCounts.entries()) {
    if (!record.blocked && now - record.windowStart > 10 * 60 * 1000) {
      ipRequestCounts.delete(ip);
    }
    if (record.blocked && now > record.blockExpires) {
      ipRequestCounts.delete(ip);
    }
  }
}, 5 * 60 * 1000);
