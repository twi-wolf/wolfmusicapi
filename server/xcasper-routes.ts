import type { Express, Request, Response } from "express";

const BASE = "https://movieapi.xcasper.space/api";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Referer": "https://movieapi.xcasper.space/",
  "Origin": "https://movieapi.xcasper.space",
  "Accept": "application/json",
};

async function xcasperProxy(path: string): Promise<any> {
  const res = await fetch(`${BASE}${path}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`Upstream returned ${res.status}`);
  return res.json();
}

function wrap(data: any) {
  return {
    success: true,
    creator: "APIs by Silent Wolf | A tech explorer",
    provider: "XCasper Movies API",
    ...data,
  };
}

function err(res: Response, msg: string, status = 400) {
  return res.status(status).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: msg });
}

export function registerXcasperRoutes(app: Express): void {

  app.get("/api/xcasper/search", async (req: Request, res: Response) => {
    const { keyword, q, page = "1", perPage = "10", type } = req.query as Record<string, string>;
    const kw = keyword || q;
    if (!kw) return err(res, "Parameter 'q' or 'keyword' is required.");
    try {
      const subjectType = type === "movie" ? "&subjectType=1" : type === "tv" ? "&subjectType=2" : "";
      const data = await xcasperProxy(`/search?keyword=${encodeURIComponent(kw)}&page=${page}&perPage=${perPage}${subjectType}`);
      return res.json(wrap(data));
    } catch (e: any) { return err(res, e.message, 500); }
  });

  app.get("/api/xcasper/suggest", async (req: Request, res: Response) => {
    const { q, keyword } = req.query as Record<string, string>;
    const kw = q || keyword;
    if (!kw) return err(res, "Parameter 'q' is required.");
    try {
      const data = await xcasperProxy(`/search/suggest?keyword=${encodeURIComponent(kw)}`);
      return res.json(wrap(data));
    } catch (e: any) { return err(res, e.message, 500); }
  });

  app.get("/api/xcasper/trending", async (req: Request, res: Response) => {
    const { page = "0", perPage = "18" } = req.query as Record<string, string>;
    try {
      const data = await xcasperProxy(`/trending?page=${page}&perPage=${perPage}`);
      return res.json(wrap(data));
    } catch (e: any) { return err(res, e.message, 500); }
  });

  app.get("/api/xcasper/browse", async (req: Request, res: Response) => {
    const { type, genre, country, page = "1", perPage = "12" } = req.query as Record<string, string>;
    try {
      const subjectType = type === "tv" ? "2" : "1";
      let qs = `/browse?subjectType=${subjectType}&page=${page}&perPage=${perPage}`;
      if (genre) qs += `&genre=${encodeURIComponent(genre)}`;
      if (country) qs += `&countryName=${encodeURIComponent(country)}`;
      const data = await xcasperProxy(qs);
      return res.json(wrap(data));
    } catch (e: any) { return err(res, e.message, 500); }
  });

  app.get("/api/xcasper/detail", async (req: Request, res: Response) => {
    const { id, subjectId } = req.query as Record<string, string>;
    const sid = id || subjectId;
    if (!sid) return err(res, "Parameter 'id' (subjectId) is required.");
    try {
      const data = await xcasperProxy(`/detail?subjectId=${encodeURIComponent(sid)}`);
      return res.json(wrap(data));
    } catch (e: any) { return err(res, e.message, 500); }
  });

  app.get("/api/xcasper/rich-detail", async (req: Request, res: Response) => {
    const { id, subjectId } = req.query as Record<string, string>;
    const sid = id || subjectId;
    if (!sid) return err(res, "Parameter 'id' (subjectId) is required.");
    try {
      const data = await xcasperProxy(`/rich-detail?subjectId=${encodeURIComponent(sid)}`);
      return res.json(wrap(data));
    } catch (e: any) { return err(res, e.message, 500); }
  });

  app.get("/api/xcasper/recommend", async (req: Request, res: Response) => {
    const { id, subjectId, page = "1", perPage = "10" } = req.query as Record<string, string>;
    const sid = id || subjectId;
    if (!sid) return err(res, "Parameter 'id' (subjectId) is required.");
    try {
      const data = await xcasperProxy(`/recommend?subjectId=${encodeURIComponent(sid)}&page=${page}&perPage=${perPage}`);
      return res.json(wrap(data));
    } catch (e: any) { return err(res, e.message, 500); }
  });

  app.get("/api/xcasper/popular", async (_req: Request, res: Response) => {
    try {
      const data = await xcasperProxy("/popular-search");
      return res.json(wrap(data));
    } catch (e: any) { return err(res, e.message, 500); }
  });

  app.get("/api/xcasper/hot", async (_req: Request, res: Response) => {
    try {
      const data = await xcasperProxy("/hot");
      return res.json(wrap(data));
    } catch (e: any) { return err(res, e.message, 500); }
  });

  app.get("/api/xcasper/ranking", async (_req: Request, res: Response) => {
    try {
      const data = await xcasperProxy("/ranking");
      return res.json(wrap(data));
    } catch (e: any) { return err(res, e.message, 500); }
  });

  app.get("/api/xcasper/homepage", async (_req: Request, res: Response) => {
    try {
      const data = await xcasperProxy("/homepage");
      return res.json(wrap(data));
    } catch (e: any) { return err(res, e.message, 500); }
  });

  app.get("/api/xcasper/showbox/search", async (req: Request, res: Response) => {
    const { q, keyword, type = "movie", limit = "10" } = req.query as Record<string, string>;
    const kw = q || keyword;
    if (!kw) return err(res, "Parameter 'q' is required.");
    try {
      const data = await xcasperProxy(`/showbox/search?keyword=${encodeURIComponent(kw)}&type=${type}&pagelimit=${limit}`);
      return res.json(wrap(data));
    } catch (e: any) { return err(res, e.message, 500); }
  });

  app.get("/api/xcasper/showbox/movie", async (req: Request, res: Response) => {
    const { id } = req.query as Record<string, string>;
    if (!id) return err(res, "Parameter 'id' is required.");
    try {
      const data = await xcasperProxy(`/showbox/movie?id=${encodeURIComponent(id)}`);
      return res.json(wrap(data));
    } catch (e: any) { return err(res, e.message, 500); }
  });

  app.get("/api/xcasper/showbox/tv", async (req: Request, res: Response) => {
    const { id } = req.query as Record<string, string>;
    if (!id) return err(res, "Parameter 'id' is required.");
    try {
      const data = await xcasperProxy(`/showbox/tv?id=${encodeURIComponent(id)}`);
      return res.json(wrap(data));
    } catch (e: any) { return err(res, e.message, 500); }
  });

  app.get("/api/xcasper/newtoxic/search", async (req: Request, res: Response) => {
    const { q, keyword } = req.query as Record<string, string>;
    const kw = q || keyword;
    if (!kw) return err(res, "Parameter 'q' is required.");
    try {
      const data = await xcasperProxy(`/newtoxic/search?keyword=${encodeURIComponent(kw)}`);
      return res.json(wrap(data));
    } catch (e: any) { return err(res, e.message, 500); }
  });

  app.get("/api/xcasper/newtoxic/latest", async (req: Request, res: Response) => {
    const { page = "1" } = req.query as Record<string, string>;
    try {
      const data = await xcasperProxy(`/newtoxic/latest?page=${page}`);
      return res.json(wrap(data));
    } catch (e: any) { return err(res, e.message, 500); }
  });

  app.get("/api/xcasper/newtoxic/featured", async (_req: Request, res: Response) => {
    try {
      const data = await xcasperProxy("/newtoxic/featured");
      return res.json(wrap(data));
    } catch (e: any) { return err(res, e.message, 500); }
  });

  app.get("/api/xcasper/newtoxic/detail", async (req: Request, res: Response) => {
    const { path } = req.query as Record<string, string>;
    if (!path) return err(res, "Parameter 'path' is required (e.g. new/1/Downloads/movie/Avatar-2009.html).");
    try {
      const data = await xcasperProxy(`/newtoxic/detail?path=${encodeURIComponent(path)}`);
      return res.json(wrap(data));
    } catch (e: any) { return err(res, e.message, 500); }
  });

  app.get("/api/xcasper/staff/detail", async (req: Request, res: Response) => {
    const { id, staffId } = req.query as Record<string, string>;
    const sid = id || staffId;
    if (!sid) return err(res, "Parameter 'id' (staffId) is required.");
    try {
      const data = await xcasperProxy(`/staff/detail?staffId=${encodeURIComponent(sid)}`);
      return res.json(wrap(data));
    } catch (e: any) { return err(res, e.message, 500); }
  });

  app.get("/api/xcasper/staff/works", async (req: Request, res: Response) => {
    const { id, staffId, page = "1", perPage = "10" } = req.query as Record<string, string>;
    const sid = id || staffId;
    if (!sid) return err(res, "Parameter 'id' (staffId) is required.");
    try {
      const data = await xcasperProxy(`/staff/works?staffId=${encodeURIComponent(sid)}&page=${page}&perPage=${perPage}`);
      return res.json(wrap(data));
    } catch (e: any) { return err(res, e.message, 500); }
  });

  app.get("/api/xcasper/staff/related", async (req: Request, res: Response) => {
    const { id, staffId } = req.query as Record<string, string>;
    const sid = id || staffId;
    if (!sid) return err(res, "Parameter 'id' (staffId) is required.");
    try {
      const data = await xcasperProxy(`/staff/related?staffId=${encodeURIComponent(sid)}`);
      return res.json(wrap(data));
    } catch (e: any) { return err(res, e.message, 500); }
  });
}
