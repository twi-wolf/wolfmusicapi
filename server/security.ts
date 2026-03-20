import type { Request, Response, NextFunction } from "express";
import helmet from "helmet";

const CREATOR = "APIs by Silent Wolf | A tech explorer";
const isDev = process.env.NODE_ENV !== "production";

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

export function antiClone(req: Request, res: Response, next: NextFunction) {
  if (!req.path.startsWith("/api/")) return next();
  const path = req.path;

  if (path === "/api/endpoints/list" || path === "/api/all-endpoints") {
    const referer = req.headers.referer || req.headers.origin || "";
    const host = req.headers.host || "";
    const ua = req.headers["user-agent"] || "";

    const isFromOwnSite = referer.includes(host) || referer === "";
    const isBrowser = /Mozilla|Chrome|Safari|Firefox|Edge/i.test(ua);

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
