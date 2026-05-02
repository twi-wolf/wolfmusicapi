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

  app.get("/api/xcasper/trailer", async (req: Request, res: Response) => {
    const { id } = req.query as Record<string, string>;
    if (!id) return err(res, "Parameter 'id' (subjectId) is required — get it from /api/xcasper/search results.");
    try {
      const data = await xcasperProxy(`/rich-detail?subjectId=${encodeURIComponent(id)}`);
      const d = data?.data ?? data;
      if (!d?.trailerUrl) {
        return res.status(404).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "No trailer available for this title." });
      }
      return res.json({
        success: true,
        creator: "APIs by Silent Wolf | A tech explorer",
        provider: "XCasper",
        subjectId: id,
        title: d.title ?? null,
        type: d.subjectType === 1 ? "movie" : d.subjectType === 2 ? "tv" : "unknown",
        trailerUrl: d.trailerUrl,
        trailerCover: d.trailerCover ?? null,
        imdbRating: d.imdbRatingValue ?? null,
        genre: d.genre ?? null,
        releaseDate: d.releaseDate ?? null,
        duration: d.duration ?? null,
        cover: d.cover?.url ?? null,
      });
    } catch (e: any) { return err(res, e.message, 500); }
  });

  app.get("/api/xcasper/ranking-content", async (req: Request, res: Response) => {
    const { id, genre, page = "1", perPage = "12" } = req.query as Record<string, string>;
    const RANKING_GENRE_MAP: Record<string, string> = {
      "997144265920760504": "Popular",
      "8216283712045280":   "Nollywood",
      "6050680843129996568":"Action",
      "8614980535946986176":"Horror",
      "9139789616411735224":"Romance",
      "8599868521717400352":"Comedy",
      "7486582804437256712":"Adventure",
    };
    const resolvedGenre = genre || (id ? RANKING_GENRE_MAP[id] : null);
    if (!resolvedGenre) return err(res, "Provide 'id' (ranking category ID from /api/xcasper/ranking) or 'genre' (e.g. Action, Horror, Comedy, Romance, Nollywood).");
    const genreForApi = resolvedGenre === "Popular" ? "" : resolvedGenre;
    try {
      const qs = `/browse?type=movie&page=${page}&perPage=${perPage}${genreForApi ? `&genre=${encodeURIComponent(genreForApi)}` : ""}`;
      const data = await xcasperProxy(qs);
      return res.json({ ...wrap(data), category: resolvedGenre, rankingId: id || null });
    } catch (e: any) { return err(res, e.message, 500); }
  });

  app.get("/api/xcasper/ratings", async (req: Request, res: Response) => {
    const { q, title, imdbid, t } = req.query as Record<string, string>;
    const query = q || title;
    const imdb = imdbid || t;
    if (!query && !imdb) return err(res, "Provide 'q' (movie/show title) or 'imdbid' (IMDb ID like tt0848228).");
    const OMDB_KEY = "trilogy";
    try {
      const params = imdb
        ? `i=${encodeURIComponent(imdb)}&plot=short`
        : `t=${encodeURIComponent(query!)}&type=movie`;
      const r = await fetch(`https://www.omdbapi.com/?${params}&apikey=${OMDB_KEY}`, { headers: { "User-Agent": "Mozilla/5.0" } });
      const d = await r.json() as any;
      if (d.Response === "False") return res.status(404).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: d.Error || "Title not found." });
      return res.json({
        success: true,
        creator: "APIs by Silent Wolf | A tech explorer",
        provider: "OMDB",
        imdbId: d.imdbID,
        title: d.Title,
        year: d.Year,
        type: d.Type,
        rated: d.Rated,
        runtime: d.Runtime,
        genre: d.Genre,
        director: d.Director,
        actors: d.Actors,
        plot: d.Plot,
        language: d.Language,
        country: d.Country,
        poster: d.Poster !== "N/A" ? d.Poster : null,
        imdbRating: d.imdbRating !== "N/A" ? d.imdbRating : null,
        imdbVotes: d.imdbVotes !== "N/A" ? d.imdbVotes : null,
        ratings: (d.Ratings || []).map((x: any) => ({ source: x.Source, value: x.Value })),
        boxOffice: d.BoxOffice !== "N/A" ? d.BoxOffice : null,
        awards: d.Awards !== "N/A" ? d.Awards : null,
      });
    } catch (e: any) { return err(res, e.message, 500); }
  });

  app.get("/api/xcasper/omdb-search", async (req: Request, res: Response) => {
    const { q, s, type = "movie", page = "1" } = req.query as Record<string, string>;
    const kw = q || s;
    if (!kw) return err(res, "Parameter 'q' (search keyword) is required.");
    const OMDB_KEY = "trilogy";
    try {
      const r = await fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(kw)}&type=${type}&page=${page}&apikey=${OMDB_KEY}`, { headers: { "User-Agent": "Mozilla/5.0" } });
      const d = await r.json() as any;
      if (d.Response === "False") return res.status(404).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: d.Error || "No results found." });
      return res.json({
        success: true,
        creator: "APIs by Silent Wolf | A tech explorer",
        provider: "OMDB",
        keyword: kw,
        type,
        page: parseInt(page),
        totalResults: parseInt(d.totalResults || "0"),
        results: (d.Search || []).map((x: any) => ({
          imdbId: x.imdbID,
          title: x.Title,
          year: x.Year,
          type: x.Type,
          poster: x.Poster !== "N/A" ? x.Poster : null,
        })),
      });
    } catch (e: any) { return err(res, e.message, 500); }
  });
}
