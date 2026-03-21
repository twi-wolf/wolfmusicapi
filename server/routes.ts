import type { Express } from "express";
import { type Server } from "http";
import { exec } from "child_process";
import { promisify } from "util";
import { createReadStream, existsSync } from "fs";
import { searchSongs, getDownloadInfo, extractVideoId, reloadCookies, tempFiles, resetProviderHealth, getProviderHealthStatus } from "./scraper";
const execAsync = promisify(exec);
import { registerAIRoutes } from "./ai-routes";
import { downloadTikTok } from "../lib/downloaders/tiktok";
import { downloadSnapchat } from "../lib/downloaders/snapchat";
import { downloadInstagram } from "../lib/downloaders/instagram";
import { downloadYouTube } from "../lib/downloaders/youtube";
import { downloadFacebook } from "../lib/downloaders/facebook";
import { downloadTwitter } from "../lib/downloaders/twitter";
import { searchSpotify, downloadSpotify } from "../lib/downloaders/spotify";
import { searchShazam, recognizeShazamFull, getTrackDetails } from "../lib/downloaders/shazam";
import { generateEphoto, listEphotoEffects, EPHOTO_EFFECTS } from "../lib/downloaders/ephoto360";
import { generatePhotofunia, listPhotofuniaEffects } from "../lib/downloaders/photofunia";
import { githubStalk, ipStalk, npmStalk, tiktokStalk, instagramStalk, twitterStalk, telegramStalk, numberPlateStalk } from "../lib/downloaders/stalker";
import { fetchAnimeImage } from "../lib/downloaders/anime";
import { getFunContent, funTypes } from "../lib/downloaders/fun";
import { shortenUrl, shortenerServices } from "../lib/downloaders/urlshortener";
import * as tools from "../lib/downloaders/tools";
import * as security from "../lib/downloaders/security";
import * as sports from "../lib/downloaders/sports";
import * as movie from "../lib/downloaders/movie";
import { listTextproEffects, generateTextpro } from "../lib/downloaders/textpro";
import { imageToSticker, stickerToImage, videoToSticker, stickerToVideo, videoToGif, gifToVideo } from "../lib/downloaders/converter";
import { listAudioEffects, applyAudioEffect } from "../lib/downloaders/audio-effects";
import { allEndpoints as schemaEndpoints, apiCategories as schemaCategories } from "../shared/schema";

function isYouTubeUrl(input: string): boolean {
  return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be|m\.youtube\.com)\//i.test(input) ||
         /^[a-zA-Z0-9_-]{11}$/.test(input);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  registerAIRoutes(app);

  app.get("/api/search", async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q || q.trim().length === 0) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }
      const results = await searchSongs(q.trim());
      return res.json({
        success: true,
        creator: "APIs by Silent Wolf | A tech explorer",
        query: results.query,
        items: results.items,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Search failed" });
    }
  });

  function px(baseUrl: string, url: string | undefined): string | null {
    if (!url || !url.startsWith("http")) return null;
    return `${baseUrl}/proxy?url=${encodeURIComponent(url)}`;
  }

  function addMediaProxyUrls(baseUrl: string, result: any): any {
    if (!result || !result.success) return result;
    const out = { ...result };
    // TikTok
    if (out.videoUrl) out.videoProxyUrl = px(baseUrl, out.videoUrl);
    if (out.videoUrlNoWatermark) out.videoNoWatermarkProxyUrl = px(baseUrl, out.videoUrlNoWatermark);
    if (out.audioUrl) out.audioProxyUrl = px(baseUrl, out.audioUrl);
    // Facebook
    if (out.sdUrl) out.sdProxyUrl = px(baseUrl, out.sdUrl);
    if (out.hdUrl) out.hdProxyUrl = px(baseUrl, out.hdUrl);
    // Snapchat
    if (out.thumbnailUrl) out.thumbnailProxyUrl = px(baseUrl, out.thumbnailUrl);
    if (Array.isArray(out.mediaUrls)) out.mediaProxyUrls = out.mediaUrls.map((u: string) => px(baseUrl, u));
    // Instagram / Twitter: media[] array
    if (Array.isArray(out.media)) {
      out.media = out.media.map((item: any) => ({ ...item, proxyUrl: px(baseUrl, item.url) }));
    }
    // Generic downloadUrl (any other endpoint)
    if (out.downloadUrl && out.downloadUrl.startsWith("http")) out.proxyUrl = px(baseUrl, out.downloadUrl);
    return out;
  }

  function buildUrls(baseUrl: string, result: any): { proxyUrl: string | null; fileUrl: string | null } {
    const rawUrl: string = result.downloadUrl || "";
    if (rawUrl.startsWith("local://")) {
      const filename = rawUrl.replace("local://", "");
      const fileUrl = `${baseUrl}/files/${filename}`;
      return { proxyUrl: fileUrl, fileUrl };
    }
    if (!rawUrl.startsWith("http")) return { proxyUrl: null, fileUrl: null };
    const proxyUrl = `${baseUrl}/proxy?url=${encodeURIComponent(rawUrl)}`;
    return { proxyUrl, fileUrl: null };
  }

  app.get("/files/:filename", (req: any, res: any) => {
    const filename = req.params.filename as string;
    if (!/^[a-f0-9-]{36}\.(mp3|mp4|m4a|webm|mkv|m4v)$/.test(filename)) {
      return res.status(400).json({ error: "Invalid filename" });
    }
    const uuid = filename.replace(/\.[^.]+$/, "");
    const entry = tempFiles.get(uuid);
    if (!entry || !existsSync(entry.filePath)) {
      return res.status(404).json({ error: "File not found or expired" });
    }
    const extMap: Record<string, string> = {
      mp4: "video/mp4", m4v: "video/mp4", mkv: "video/x-matroska",
      webm: "video/webm", mp3: "audio/mpeg", m4a: "audio/mp4",
    };
    const ext = filename.split(".").pop() || "mp4";
    const contentType = extMap[ext] || "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "no-store");
    const stream = createReadStream(entry.filePath);
    stream.pipe(res);
    stream.on("end", () => {
      try { require("fs").unlinkSync(entry.filePath); } catch {}
      tempFiles.delete(uuid);
    });
    stream.on("error", () => {
      if (!res.headersSent) res.status(500).json({ error: "Stream error" });
    });
  });

  const downloadHandler = (format: "mp3" | "mp4") => async (req: any, res: any) => {
    try {
      let url = (req.query.url as string) || (req.query.q as string) || (req.query.name as string);
      if (!url || url.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Provide 'url' (YouTube link) or 'q'/'name' (song name) as a query parameter.",
        });
      }

      url = url.trim();
      const host = req.get("host") || "";
      const protocol = req.protocol || "https";
      const baseUrl = `${protocol}://${host}`;

      if (!isYouTubeUrl(url)) {
        const searchResults = await searchSongs(url);
        if (!searchResults.items || searchResults.items.length === 0) {
          return res.status(404).json({
            success: false,
            error: `No results found for "${url}". Try a different search term.`,
          });
        }

        const firstResult = searchResults.items[0];
        const videoUrl = `https://www.youtube.com/watch?v=${firstResult.id}`;
        const result = await getDownloadInfo(videoUrl, format);
        const { proxyUrl, fileUrl } = buildUrls(baseUrl, result);

        return res.json({
          ...result,
          downloadUrl: fileUrl || result.downloadUrl,
          proxyUrl,
          creator: "APIs by Silent Wolf | A tech explorer",
          searchQuery: url,
          searchResult: {
            title: firstResult.title,
            channelTitle: firstResult.channelTitle,
            duration: firstResult.duration,
          },
        });
      }

      const result = await getDownloadInfo(url, format);
      const { proxyUrl, fileUrl } = buildUrls(baseUrl, result);

      return res.json({
        ...result,
        downloadUrl: fileUrl || result.downloadUrl,
        proxyUrl,
        creator: "APIs by Silent Wolf | A tech explorer",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || "Download failed",
      });
    }
  };

  app.get("/download/audio", downloadHandler("mp3"));
  app.get("/download/ytmp3", downloadHandler("mp3"));
  app.get("/download/dlmp3", downloadHandler("mp3"));
  app.get("/download/mp3", downloadHandler("mp3"));
  app.get("/download/yta", downloadHandler("mp3"));
  app.get("/download/yta2", downloadHandler("mp3"));
  app.get("/download/yta3", downloadHandler("mp3"));
  app.get("/download/mp4", downloadHandler("mp4"));
  app.get("/download/ytmp4", downloadHandler("mp4"));
  app.get("/download/dlmp4", downloadHandler("mp4"));
  app.get("/download/video", downloadHandler("mp4"));
  app.get("/download/hd", downloadHandler("mp4"));

  app.get("/download/lyrics", async (req, res) => {
    try {
      const q = (req.query.q as string) || (req.query.name as string);
      if (!q || q.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Query parameter 'q' is required. Example: /download/lyrics?q=Shape of You" });
      }

      const searchTerm = q.trim();

      const lrclibRes = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(searchTerm)}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      if (lrclibRes.ok) {
        const lrcData = await lrclibRes.json() as any[];
        if (lrcData && lrcData.length > 0) {
          const track = lrcData[0];
          return res.json({
            success: true,
            creator: "APIs by Silent Wolf | A tech explorer",
            query: searchTerm,
            title: track.trackName || track.name,
            author: track.artistName,
            album: track.albumName,
            duration: track.duration,
            lyrics: track.plainLyrics || track.syncedLyrics || "No lyrics text available",
            syncedLyrics: track.syncedLyrics || null,
          });
        }
      }

      return res.status(404).json({
        success: false,
        creator: "APIs by Silent Wolf | A tech explorer",
        error: `No lyrics found for "${searchTerm}". Try "Artist - Song Title" format or just the song name.`,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "Lyrics fetch failed" });
    }
  });

  app.get("/api/trending", async (req, res) => {
    try {
      const country = (req.query.country as string) || "US";
      const ytApiKey = process.env.YOUTUBE_API_KEY || "";
      if (!ytApiKey) {
        const searchResults = await searchSongs("trending music " + country);
        return res.json({
          success: true,
          creator: "APIs by Silent Wolf | A tech explorer",
          country,
          items: searchResults.items.slice(0, 20),
          source: "search",
        });
      }
      const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&chart=mostPopular&videoCategoryId=10&regionCode=${country}&maxResults=20&key=${ytApiKey}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      if (!response.ok) {
        const searchResults = await searchSongs("trending music " + country);
        return res.json({
          success: true,
          creator: "APIs by Silent Wolf | A tech explorer",
          country,
          items: searchResults.items.slice(0, 20),
          source: "search",
        });
      }

      const data = await response.json() as any;
      const items = (data.items || []).map((item: any) => ({
        title: item.snippet?.title,
        channelTitle: item.snippet?.channelTitle,
        videoId: item.id,
        thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url,
        viewCount: item.statistics?.viewCount,
        duration: item.contentDetails?.duration,
        publishedAt: item.snippet?.publishedAt,
      }));

      return res.json({
        success: true,
        creator: "APIs by Silent Wolf | A tech explorer",
        country,
        items,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "Trending fetch failed" });
    }
  });

  app.get("/api/download/tiktok", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || url.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Query parameter 'url' is required. Provide a TikTok video URL.",
        });
      }
      const result = await downloadTikTok(url);
      return res.json(addMediaProxyUrls(baseUrl, result));
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "TikTok download failed" });
    }
  });

  app.get("/api/download/instagram", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || url.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Query parameter 'url' is required. Provide an Instagram post/reel URL.",
        });
      }
      const result = await downloadInstagram(url);
      return res.json(addMediaProxyUrls(baseUrl, result));
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "Instagram download failed" });
    }
  });

  app.get("/api/download/youtube", async (req, res) => {
    try {
      let url = (req.query.url as string) || (req.query.q as string) || (req.query.name as string);
      if (!url || url.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Provide 'url' (YouTube link) or 'q'/'name' (search term) as a query parameter.",
        });
      }

      url = url.trim();

      if (!isYouTubeUrl(url)) {
        const searchResults = await searchSongs(url);
        if (!searchResults.items || searchResults.items.length === 0) {
          return res.status(404).json({ success: false, error: `No results found for "${url}".` });
        }
        url = `https://www.youtube.com/watch?v=${searchResults.items[0].id}`;
      }

      const result = await downloadYouTube(url);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "YouTube download failed" });
    }
  });

  app.get("/api/download/facebook", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || url.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Query parameter 'url' is required. Provide a Facebook video URL.",
        });
      }
      const result = await downloadFacebook(url);
      return res.json(addMediaProxyUrls(baseUrl, result));
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "Facebook download failed" });
    }
  });

  app.get("/api/download/facebook/reel", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || url.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Query parameter 'url' is required. Provide a Facebook Reel URL.",
        });
      }
      const result = await downloadFacebook(url);
      return res.json(addMediaProxyUrls(baseUrl, result));
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "Facebook Reel download failed" });
    }
  });

  app.get("/api/download/youtube/mp3", async (req, res) => {
    try {
      let url = (req.query.url as string) || (req.query.q as string);
      if (!url || url.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Provide 'url' or 'q' parameter." });
      }
      url = url.trim();
      if (!isYouTubeUrl(url)) {
        const searchResults = await searchSongs(url);
        if (!searchResults.items?.length) return res.status(404).json({ success: false, error: `No results for "${url}".` });
        url = `https://www.youtube.com/watch?v=${searchResults.items[0].id}`;
      }
      const result = await getDownloadInfo(url, "mp3");
      return res.json({ ...result, creator: "APIs by Silent Wolf | A tech explorer", format: "mp3" });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "YouTube MP3 download failed" });
    }
  });

  app.get("/api/download/youtube/mp4", async (req, res) => {
    try {
      let url = (req.query.url as string) || (req.query.q as string);
      if (!url || url.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Provide 'url' or 'q' parameter." });
      }
      url = url.trim();
      if (!isYouTubeUrl(url)) {
        const searchResults = await searchSongs(url);
        if (!searchResults.items?.length) return res.status(404).json({ success: false, error: `No results for "${url}".` });
        url = `https://www.youtube.com/watch?v=${searchResults.items[0].id}`;
      }
      const result = await getDownloadInfo(url, "mp4");
      return res.json({ ...result, creator: "APIs by Silent Wolf | A tech explorer", format: "mp4" });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "YouTube MP4 download failed" });
    }
  });

  app.get("/api/download/youtube/info", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || url.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Query parameter 'url' is required." });
      }
      const videoId = extractVideoId(url.trim());
      if (!videoId) return res.status(400).json({ success: false, error: "Invalid YouTube URL." });
      return res.json({
        success: true,
        creator: "APIs by Silent Wolf | A tech explorer",
        videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        thumbnailHD: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "Info fetch failed" });
    }
  });

  app.get("/api/download/youtube/search", async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q || q.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Query parameter 'q' is required." });
      }
      const results = await searchSongs(q.trim());
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", ...results });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "YouTube search failed" });
    }
  });

  app.get("/api/download/tiktok/audio", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || url.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Query parameter 'url' is required." });
      }
      const result = await downloadTikTok(url);
      if (!result.success) return res.json(result);
      return res.json({
        success: true,
        creator: "APIs by Silent Wolf | A tech explorer",
        title: result.title,
        author: result.author,
        audioUrl: result.audioUrl || result.videoUrl,
        note: result.audioUrl ? "Direct audio extracted" : "Audio not separately available, use video URL",
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "TikTok audio extraction failed" });
    }
  });

  app.get("/api/download/tiktok/info", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || url.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Query parameter 'url' is required." });
      }
      const result = await downloadTikTok(url);
      if (!result.success) return res.json(result);
      return res.json({
        success: true,
        creator: "APIs by Silent Wolf | A tech explorer",
        title: result.title,
        author: result.author,
        hasVideo: !!result.videoUrl,
        hasAudio: !!result.audioUrl,
        thumbnail: result.thumbnail || undefined,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "TikTok info fetch failed" });
    }
  });

  app.get("/api/download/snapchat", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || url.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Query parameter 'url' is required. Provide a Snapchat story, spotlight, or profile URL.",
        });
      }
      const result = await downloadSnapchat(url);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "Snapchat download failed" });
    }
  });

  app.get("/api/download/instagram/story", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || url.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Query parameter 'url' is required. Provide an Instagram story URL." });
      }
      const result = await downloadInstagram(url);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "Instagram story download failed" });
    }
  });

  app.get("/api/download/twitter", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || url.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Query parameter 'url' is required. Provide a Twitter/X tweet URL.",
        });
      }
      const result = await downloadTwitter(url);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "Twitter download failed" });
    }
  });

  app.get("/api/download/twitter/info", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || url.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Query parameter 'url' is required. Provide a Twitter/X tweet URL.",
        });
      }
      const result = await downloadTwitter(url);
      if (!result.success) return res.json(result);
      return res.json({
        success: true,
        creator: "APIs by Silent Wolf | A tech explorer",
        title: result.title,
        author: result.author,
        mediaCount: result.media?.length || 0,
        mediaTypes: result.media?.map(m => m.type) || [],
        provider: result.provider,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "Twitter info fetch failed" });
    }
  });

  app.get("/api/spotify/search", async (req, res) => {
    try {
      const q = (req.query.q as string) || (req.query.query as string);
      if (!q || q.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Query parameter 'q' is required. Example: /api/spotify/search?q=Blinding Lights",
        });
      }
      const result = await searchSpotify(q.trim());
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message || "Spotify search failed" });
    }
  });

  app.get("/api/spotify/download", async (req, res) => {
    try {
      const input = (req.query.url as string) || (req.query.q as string) || (req.query.name as string);
      if (!input || input.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Provide 'url' (Spotify track link) or 'q'/'name' (song name). Example: /api/spotify/download?q=Blinding Lights",
        });
      }
      const host = req.get("host") || "";
      const protocol = req.protocol || "https";
      const baseUrl = `${protocol}://${host}`;
      const result = await downloadSpotify(input.trim(), baseUrl);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message || "Spotify download failed" });
    }
  });

  app.get("/api/shazam/search", async (req, res) => {
    try {
      const q = (req.query.q as string) || (req.query.query as string);
      if (!q || q.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Query parameter 'q' is required. Example: /api/shazam/search?q=Shape of You",
        });
      }
      const result = await searchShazam(q.trim());
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message || "Shazam search failed" });
    }
  });

  app.get("/api/shazam/track/:id", async (req, res) => {
    try {
      const trackId = req.params.id;
      if (!trackId) {
        return res.status(400).json({
          success: false,
          error: "Track ID is required. Example: /api/shazam/track/552406075",
        });
      }
      const result = await getTrackDetails(trackId);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message || "Shazam track lookup failed" });
    }
  });

  app.post("/api/shazam/recognize", async (req, res) => {
    try {
      const contentType = req.headers["content-type"] || "";
      let audioBuffer: Buffer;

      if (contentType.includes("octet-stream") || contentType.includes("audio/")) {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        audioBuffer = Buffer.concat(chunks);
      } else {
        const { audio, url: audioUrl } = req.body || {};

        if (audioUrl) {
          const audioRes = await fetch(audioUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
          if (!audioRes.ok) {
            return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Failed to download audio from the provided URL." });
          }
          audioBuffer = Buffer.from(await audioRes.arrayBuffer());
        } else if (audio) {
          audioBuffer = Buffer.from(audio, "base64");
        } else {
          return res.status(400).json({
            success: false,
            creator: "APIs by Silent Wolf | A tech explorer",
            error: "Provide 'audio' (base64-encoded raw PCM s16LE) or 'url' (link to audio file) in the request body.",
          });
        }
      }

      if (audioBuffer.length < 1000) {
        return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Audio data too short." });
      }

      const result = await recognizeShazamFull(audioBuffer);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message || "Shazam recognition failed" });
    }
  });

  app.get("/api/ephoto/list", (_req, res) => {
    return res.json({
      success: true,
      creator: "APIs by Silent Wolf | A tech explorer",
      effects: listEphotoEffects(),
    });
  });

  app.post("/api/ephoto/generate", async (req, res) => {
    try {
      const { effect, text, ...restBody } = req.body;
      if (!effect || !text) {
        return res.status(400).json({
          success: false,
          error: "Parameters 'effect' (effect slug or ID) and 'text' (text to render) are required.",
        });
      }

      const texts: string[] = [text];
      for (let i = 2; i <= 10; i++) {
        const extra = restBody[`text${i}`];
        if (extra) texts.push(extra);
        else break;
      }
      const result = await generateEphoto(effect, texts);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message || "Ephoto generation failed" });
    }
  });

  app.get("/api/photofunia/list", (_req, res) => {
    return res.json({
      success: true,
      creator: "APIs by Silent Wolf | A tech explorer",
      totalEffects: listPhotofuniaEffects().length,
      effects: listPhotofuniaEffects(),
    });
  });

  app.post("/api/photofunia/generate", async (req, res) => {
    try {
      const { effect, text, imageUrl, ...otherParams } = req.body;
      if (!effect) {
        return res.status(400).json({
          success: false,
          error: "Parameter 'effect' (effect ID or slug) is required. Use /api/photofunia/list to see available effects.",
        });
      }

      const textInputs: Record<string, string> = {};
      if (text) textInputs["text"] = text;
      for (const [key, value] of Object.entries(otherParams)) {
        if (typeof value === "string") textInputs[key] = value;
      }

      const result = await generatePhotofunia(effect, textInputs, imageUrl);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message || "PhotoFunia generation failed" });
    }
  });

  app.get("/api/ephoto/:effectId", async (req, res) => {
    try {
      const { effectId } = req.params;
      const text = (req.query.text as string) || "";
      if (!text) {
        return res.status(400).json({ success: false, error: "Query parameter 'text' is required." });
      }
      const texts: string[] = [text];
      for (let i = 2; i <= 10; i++) {
        const extra = req.query[`text${i}`] as string;
        if (extra) texts.push(extra);
      }
      const effect = EPHOTO_EFFECTS.find(e => e.id === effectId || e.slug === effectId);
      const expectedTextCount = effect ? effect.params.filter(p => p.type === "text").length : 1;
      while (texts.length < expectedTextCount) {
        texts.push(texts[0]);
      }
      const result = await generateEphoto(effectId, texts);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message || "Ephoto generation failed" });
    }
  });

  app.get("/api/photofunia/:effectId", async (req, res) => {
    try {
      const { effectId } = req.params;
      const text = (req.query.text as string) || "";
      const imageUrl = req.query.imageUrl as string;
      const textInputs: Record<string, string> = {};
      if (text) textInputs["text"] = text;
      for (const [key, value] of Object.entries(req.query)) {
        if (key !== "text" && key !== "imageUrl" && typeof value === "string") {
          textInputs[key] = value;
        }
      }
      const result = await generatePhotofunia(effectId, textInputs, imageUrl);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message || "PhotoFunia generation failed" });
    }
  });

  app.get("/api/stalk/github", async (req, res) => {
    try {
      const username = req.query.username as string;
      if (!username) return res.status(400).json({ success: false, error: "Query parameter 'username' is required." });
      const result = await githubStalk(username.trim());
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/stalk/ip", async (req, res) => {
    try {
      const ip = req.query.ip as string;
      if (!ip) return res.status(400).json({ success: false, error: "Query parameter 'ip' is required." });
      const result = await ipStalk(ip.trim());
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/stalk/npm", async (req, res) => {
    try {
      const pkg = (req.query.package as string) || (req.query.name as string);
      if (!pkg) return res.status(400).json({ success: false, error: "Query parameter 'package' is required." });
      const result = await npmStalk(pkg.trim());
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/stalk/tiktok", async (req, res) => {
    try {
      const username = req.query.username as string;
      if (!username) return res.status(400).json({ success: false, error: "Query parameter 'username' is required." });
      const result = await tiktokStalk(username.trim());
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/stalk/instagram", async (req, res) => {
    try {
      const username = req.query.username as string;
      if (!username) return res.status(400).json({ success: false, error: "Query parameter 'username' is required." });
      const result = await instagramStalk(username.trim());
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/stalk/twitter", async (req, res) => {
    try {
      const username = req.query.username as string;
      if (!username) return res.status(400).json({ success: false, error: "Query parameter 'username' is required." });
      const result = await twitterStalk(username.trim());
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/stalk/telegram", async (req, res) => {
    try {
      const username = req.query.username as string;
      if (!username) return res.status(400).json({ success: false, error: "Query parameter 'username' is required." });
      const result = await telegramStalk(username.trim());
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/stalk/numberplate", async (req, res) => {
    try {
      const plate = req.query.plate as string;
      if (!plate) return res.status(400).json({ success: false, error: "Query parameter 'plate' is required." });
      const result = await numberPlateStalk(plate.trim());
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  // ============== ANIME ROUTES ==============
  app.get("/api/anime/:type", async (req, res) => {
    try {
      const result = await fetchAnimeImage(req.params.type);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  // ============== FUN ROUTES ==============
  app.get("/api/fun/:type", async (req, res) => {
    try {
      const result = await getFunContent(req.params.type);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  // ============== URL SHORTENER ROUTES ==============
  app.get("/api/short/:service", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'url' query parameter" });
      const result = await shortenUrl(req.params.service, url);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.post("/api/url/imgbb", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'image' parameter (URL or Base64)" });

      let imageData = image;
      if (image.startsWith("http")) {
        const imgRes = await fetch(image, { redirect: "follow" });
        if (!imgRes.ok) throw new Error("Failed to fetch image from URL");
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        imageData = buffer.toString("base64");
      }

      const formBody = new URLSearchParams();
      formBody.append("image", imageData);

      const uploadRes = await fetch("https://freeimage.host/api/1/upload?key=6d207e02198a847aa98d0a2a901485a5&format=json", {
        method: "POST",
        body: formBody,
      });
      const data = await uploadRes.json() as any;

      if (data.status_code !== 200 && !data.image) {
        throw new Error(data.error?.message || data.status_txt || "Image upload failed");
      }

      return res.json({
        success: true,
        creator: "APIs by Silent Wolf | A tech explorer",
        result: {
          url: data.image?.url || data.image?.display_url,
          display_url: data.image?.display_url,
          thumb: data.image?.thumb?.url,
          medium: data.image?.medium?.url,
          title: data.image?.title,
          size: data.image?.size,
          width: data.image?.width,
          height: data.image?.height,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.post("/api/url/catbox", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'url' parameter" });

      const imgRes = await fetch(url, { redirect: "follow" });
      if (!imgRes.ok) throw new Error("Failed to fetch file from URL");
      const buffer = Buffer.from(await imgRes.arrayBuffer());

      const contentType = imgRes.headers.get("content-type") || "application/octet-stream";
      const ext = contentType.includes("png") ? "png" : contentType.includes("gif") ? "gif" : contentType.includes("webp") ? "webp" : "jpg";
      const filename = `upload.${ext}`;

      const boundary = "----FormBoundary" + Math.random().toString(36).slice(2);
      const parts: Buffer[] = [];
      parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="reqtype"\r\n\r\nfileupload\r\n`));
      parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="fileToUpload"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`));
      parts.push(buffer);
      parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));
      const body = Buffer.concat(parts);

      const uploadRes = await fetch("https://catbox.moe/user/api.php", {
        method: "POST",
        headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
        body,
      });
      const result = await uploadRes.text();
      if (!result.startsWith("https://")) throw new Error("Catbox upload failed: " + result);

      return res.json({
        success: true,
        creator: "APIs by Silent Wolf | A tech explorer",
        result: {
          url: result.trim(),
          original: url,
          service: "Catbox.moe",
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  // ============== TOOLS ROUTES ==============
  app.get("/api/tools/qrcode", (req, res) => {
    const text = req.query.text as string;
    if (!text) return res.status(400).json({ success: false, error: "Missing 'text' parameter" });
    const size = parseInt(req.query.size as string) || 300;
    return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result: tools.generateQRCode(text, size) });
  });

  app.get("/api/tools/bible", async (req, res) => {
    try {
      const result = await tools.getBibleVerse(req.query.ref as string);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/tools/dictionary", async (req, res) => {
    try {
      const word = req.query.word as string;
      if (!word) return res.status(400).json({ success: false, error: "Missing 'word' parameter" });
      const result = await tools.getDictionary(word);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/tools/wikipedia", async (req, res) => {
    try {
      const query = req.query.query as string;
      if (!query) return res.status(400).json({ success: false, error: "Missing 'query' parameter" });
      const result = await tools.getWikipedia(query);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/tools/weather", async (req, res) => {
    try {
      const city = req.query.city as string;
      if (!city) return res.status(400).json({ success: false, error: "Missing 'city' parameter" });
      const result = await tools.getWeather(city);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/tools/base64encode", (req, res) => {
    const text = req.query.text as string;
    if (!text) return res.status(400).json({ success: false, error: "Missing 'text' parameter" });
    return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result: tools.base64Encode(text) });
  });

  app.get("/api/tools/base64decode", (req, res) => {
    const text = req.query.text as string;
    if (!text) return res.status(400).json({ success: false, error: "Missing 'text' parameter" });
    return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result: tools.base64Decode(text) });
  });

  app.get("/api/tools/textstats", (req, res) => {
    const text = req.query.text as string;
    if (!text) return res.status(400).json({ success: false, error: "Missing 'text' parameter" });
    return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result: tools.textStats(text) });
  });

  app.get("/api/tools/password", (req, res) => {
    const length = parseInt(req.query.length as string) || 16;
    return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result: tools.generatePassword(length) });
  });

  app.get("/api/tools/lorem", (req, res) => {
    const paragraphs = parseInt(req.query.paragraphs as string) || 1;
    return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result: tools.loremIpsum(paragraphs) });
  });

  app.get("/api/tools/color", (_req, res) => {
    return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result: tools.generateColor() });
  });

  app.get("/api/tools/timestamp", (_req, res) => {
    return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result: tools.getTimestamp() });
  });

  app.get("/api/tools/urlencode", (req, res) => {
    const text = req.query.text as string;
    if (!text) return res.status(400).json({ success: false, error: "Missing 'text' parameter" });
    return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result: tools.urlEncode(text) });
  });

  app.get("/api/tools/urldecode", (req, res) => {
    const text = req.query.text as string;
    if (!text) return res.status(400).json({ success: false, error: "Missing 'text' parameter" });
    return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result: tools.urlDecode(text) });
  });

  app.post("/api/tools/jsonformat", (req, res) => {
    const json = req.body.json as string;
    if (!json) return res.status(400).json({ success: false, error: "Missing 'json' in body" });
    return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result: tools.jsonFormat(json) });
  });

  app.get("/api/tools/email-validate", (req, res) => {
    const email = req.query.email as string;
    if (!email) return res.status(400).json({ success: false, error: "Missing 'email' parameter" });
    return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result: tools.validateEmail(email) });
  });

  app.get("/api/tools/ip-validate", (req, res) => {
    const ip = req.query.ip as string;
    if (!ip) return res.status(400).json({ success: false, error: "Missing 'ip' parameter" });
    return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result: tools.validateIP(ip) });
  });

  app.get("/api/tools/hash", (req, res) => {
    const text = req.query.text as string;
    if (!text) return res.status(400).json({ success: false, error: "Missing 'text' parameter" });
    const algorithm = (req.query.algorithm as string) || "sha256";
    return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result: tools.hashText(text, algorithm) });
  });

  app.get("/api/tools/uuid", (_req, res) => {
    return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result: tools.uuidGenerate() });
  });

  app.get("/api/tools/password-strength", (req, res) => {
    const password = req.query.password as string;
    if (!password) return res.status(400).json({ success: false, error: "Missing 'password' parameter" });
    return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result: tools.checkPasswordStrength(password) });
  });

  app.get("/api/tools/screenshot", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, error: "Missing 'url' parameter" });
      const result = await tools.screenshotUrl(url);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  // ============== SECURITY ROUTES ==============
  app.get("/api/security/whois", async (req, res) => {
    try {
      const domain = req.query.domain as string;
      if (!domain) return res.status(400).json({ success: false, error: "Missing 'domain' parameter" });
      const result = await security.whoisLookup(domain);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/dns", async (req, res) => {
    try {
      const domain = req.query.domain as string;
      if (!domain) return res.status(400).json({ success: false, error: "Missing 'domain' parameter" });
      const result = await security.dnsLookup(domain);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/subdomain", async (req, res) => {
    try {
      const domain = req.query.domain as string;
      if (!domain) return res.status(400).json({ success: false, error: "Missing 'domain' parameter" });
      const result = await security.subdomainScan(domain);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/reverse-ip", async (req, res) => {
    try {
      const ip = req.query.ip as string;
      if (!ip) return res.status(400).json({ success: false, error: "Missing 'ip' parameter" });
      const result = await security.reverseIp(ip);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/geoip", async (req, res) => {
    try {
      const ip = req.query.ip as string;
      if (!ip) return res.status(400).json({ success: false, error: "Missing 'ip' parameter" });
      const result = await security.geoIp(ip);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/portscan", async (req, res) => {
    try {
      const host = req.query.host as string;
      if (!host) return res.status(400).json({ success: false, error: "Missing 'host' parameter" });
      const result = await security.portScan(host);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/headers", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, error: "Missing 'url' parameter" });
      const result = await security.httpHeaders(url);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/ssl", async (req, res) => {
    try {
      const host = req.query.host as string;
      if (!host) return res.status(400).json({ success: false, error: "Missing 'host' parameter" });
      const result = await security.sslCheck(host);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/tls", async (req, res) => {
    try {
      const host = req.query.host as string;
      if (!host) return res.status(400).json({ success: false, error: "Missing 'host' parameter" });
      const result = await security.tlsInfo(host);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/ping", async (req, res) => {
    try {
      const host = req.query.host as string;
      if (!host) return res.status(400).json({ success: false, error: "Missing 'host' parameter" });
      const result = await security.pingHost(host);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/latency", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, error: "Missing 'url' parameter" });
      const result = await security.latencyCheck(url);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/traceroute", async (req, res) => {
    try {
      const host = req.query.host as string;
      if (!host) return res.status(400).json({ success: false, error: "Missing 'host' parameter" });
      const result = await security.traceroute(host);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/asn", async (req, res) => {
    try {
      const ip = req.query.ip as string;
      if (!ip) return res.status(400).json({ success: false, error: "Missing 'ip' parameter" });
      const result = await security.asnLookup(ip);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/mac", async (req, res) => {
    try {
      const mac = req.query.mac as string;
      if (!mac) return res.status(400).json({ success: false, error: "Missing 'mac' parameter" });
      const result = await security.macLookup(mac);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/security-headers", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, error: "Missing 'url' parameter" });
      const result = await security.securityHeaders(url);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/waf", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, error: "Missing 'url' parameter" });
      const result = await security.wafDetect(url);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/firewall", async (req, res) => {
    try {
      const host = req.query.host as string;
      if (!host) return res.status(400).json({ success: false, error: "Missing 'host' parameter" });
      const result = await security.firewallCheck(host);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/robots", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, error: "Missing 'url' parameter" });
      const result = await security.robotsCheck(url);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/sitemap", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, error: "Missing 'url' parameter" });
      const result = await security.sitemapCheck(url);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/cms", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, error: "Missing 'url' parameter" });
      const result = await security.cmsDetect(url);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/techstack", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, error: "Missing 'url' parameter" });
      const result = await security.techStack(url);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/cookies", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, error: "Missing 'url' parameter" });
      const result = await security.cookieScan(url);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/redirects", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, error: "Missing 'url' parameter" });
      const result = await security.redirectCheck(url);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/xss", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, error: "Missing 'url' parameter" });
      const result = await security.xssCheck(url);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/sqli", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, error: "Missing 'url' parameter" });
      const result = await security.sqliCheck(url);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/csrf", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, error: "Missing 'url' parameter" });
      const result = await security.csrfCheck(url);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/clickjack", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, error: "Missing 'url' parameter" });
      const result = await security.clickjackCheck(url);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/directory", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, error: "Missing 'url' parameter" });
      const result = await security.directoryScan(url);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/exposed-files", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, error: "Missing 'url' parameter" });
      const result = await security.exposedFiles(url);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/misconfig", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, error: "Missing 'url' parameter" });
      const result = await security.misconfigCheck(url);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/hash-identify", (req, res) => {
    const hash = req.query.hash as string;
    if (!hash) return res.status(400).json({ success: false, error: "Missing 'hash' parameter" });
    return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result: security.hashIdentify(hash) });
  });

  app.get("/api/security/hash-generate", (req, res) => {
    const text = req.query.text as string;
    if (!text) return res.status(400).json({ success: false, error: "Missing 'text' parameter" });
    const algorithm = (req.query.algorithm as string) || "sha256";
    return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result: security.hashGenerate(text, algorithm) });
  });

  app.get("/api/security/password-strength", (req, res) => {
    const password = req.query.password as string;
    if (!password) return res.status(400).json({ success: false, error: "Missing 'password' parameter" });
    return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result: security.passwordStrength(password) });
  });

  app.get("/api/security/openports", async (req, res) => {
    try {
      const host = req.query.host as string;
      if (!host) return res.status(400).json({ success: false, error: "Missing 'host' parameter" });
      const result = await security.openPorts(host);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/ip-info", async (req, res) => {
    try {
      const ip = req.query.ip as string;
      if (!ip) return res.status(400).json({ success: false, error: "Missing 'ip' parameter" });
      const result = await security.ipInfo(ip);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/url-scan", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, error: "Missing 'url' parameter" });
      const result = await security.urlScan(url);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/phish", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, error: "Missing 'url' parameter" });
      const result = await security.phishCheck(url);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/security/metadata", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, error: "Missing 'url' parameter" });
      const result = await security.metadataExtract(url);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  // ============== SPORTS ROUTES ==============
  app.get("/api/sports/live", async (req, res) => {
    try {
      const result = await sports.getLiveScores(req.query.sport as string);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/sports/search/team", async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'q' parameter" });
      const result = await sports.searchTeam(q);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/sports/search/player", async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'q' parameter" });
      const result = await sports.searchPlayer(q);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/sports/search/league", async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'q' parameter" });
      const result = await sports.searchLeague(q);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/sports/leagues", async (_req, res) => {
    try {
      const result = await sports.getAllLeagues();
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/sports/league/details", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'id' parameter" });
      const result = await sports.getLeagueDetails(id);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/sports/league/seasons", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'id' parameter" });
      const result = await sports.getLeagueSeasons(id);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/sports/league/teams", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'id' parameter" });
      const result = await sports.getTeamsByLeague(id);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/sports/league/table", async (req, res) => {
    try {
      const id = req.query.id as string;
      const season = req.query.season as string;
      if (!id || !season) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'id' and/or 'season' parameter" });
      const result = await sports.getLeagueTable(id, season);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/sports/team/details", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'id' parameter" });
      const result = await sports.getTeamDetails(id);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/sports/team/players", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'id' parameter" });
      const result = await sports.getTeamPlayers(id);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/sports/team/next", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'id' parameter" });
      const result = await sports.getNextEvents(id);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/sports/team/last", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'id' parameter" });
      const result = await sports.getLastEvents(id);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/sports/team/equipment", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'id' parameter" });
      const result = await sports.getTeamEquipment(id);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/sports/player/details", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'id' parameter" });
      const result = await sports.getPlayerDetails(id);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/sports/event/details", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'id' parameter" });
      const result = await sports.getEventDetails(id);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/sports/event/lineup", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'id' parameter" });
      const result = await sports.getEventLineup(id);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/sports/event/stats", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'id' parameter" });
      const result = await sports.getEventStats(id);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/sports/event/highlights", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'id' parameter" });
      const result = await sports.getEventHighlights(id);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/sports/events/day", async (req, res) => {
    try {
      const date = req.query.date as string;
      if (!date) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'date' parameter (YYYY-MM-DD)" });
      const result = await sports.getEventsByDay(date, req.query.sport as string);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/sports/events/round", async (req, res) => {
    try {
      const id = req.query.id as string;
      const round = req.query.round as string;
      const season = req.query.season as string;
      if (!id || !round || !season) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'id', 'round', and/or 'season' parameter" });
      const result = await sports.getEventsByRound(id, round, season);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/sports/teams/country", async (req, res) => {
    try {
      const country = req.query.country as string;
      if (!country) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'country' parameter" });
      const result = await sports.getTeamsByCountry(country, req.query.sport as string);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/sports/leagues/country", async (req, res) => {
    try {
      const country = req.query.country as string;
      if (!country) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'country' parameter" });
      const result = await sports.getLeaguesByCountry(country, req.query.sport as string);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/sports/venue", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'id' parameter" });
      const result = await sports.getVenue(id);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) {
      return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  // ============== SEARCH ROUTES ==============
  app.get("/api/search/wiki", async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'q' parameter" });
      const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
      if (!wikiRes.ok) {
        const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&srlimit=5`);
        const searchData = await searchRes.json() as any;
        const results = searchData.query?.search || [];
        return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", results: results.map((r: any) => ({ title: r.title, snippet: r.snippet?.replace(/<[^>]*>/g, ""), wordcount: r.wordcount, pageId: r.pageid })) });
      }
      const data = await wikiRes.json() as any;
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result: { title: data.title, extract: data.extract, description: data.description, thumbnail: data.thumbnail?.source, url: data.content_urls?.desktop?.page } });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/search/news", async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'q' parameter" });
      const lang = (req.query.lang as string) || "en";
      const newsRes = await fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=${lang}&max=10&apikey=free`, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (newsRes.ok) {
        const data = await newsRes.json() as any;
        if (data.articles) return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", total: data.totalArticles, articles: data.articles.map((a: any) => ({ title: a.title, description: a.description, url: a.url, image: a.image, source: a.source?.name, publishedAt: a.publishedAt })) });
      }
      const wikiNewsRes = await fetch(`https://en.wikinews.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&srlimit=10`);
      const wikiData = await wikiNewsRes.json() as any;
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", source: "WikiNews", results: (wikiData.query?.search || []).map((r: any) => ({ title: r.title, snippet: r.snippet?.replace(/<[^>]*>/g, ""), timestamp: r.timestamp })) });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/search/github", async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'q' parameter" });
      const ghRes = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&per_page=10&sort=stars`, { headers: { "User-Agent": "WolfAPIs/4.0", Accept: "application/vnd.github.v3+json" } });
      if (!ghRes.ok) throw new Error("GitHub API request failed");
      const data = await ghRes.json() as any;
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", total: data.total_count, repos: (data.items || []).map((r: any) => ({ name: r.full_name, description: r.description, stars: r.stargazers_count, forks: r.forks_count, language: r.language, url: r.html_url, topics: r.topics?.slice(0, 5) })) });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/search/npm", async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'q' parameter" });
      const npmRes = await fetch(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(q)}&size=10`);
      if (!npmRes.ok) throw new Error("NPM API request failed");
      const data = await npmRes.json() as any;
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", total: data.total, packages: (data.objects || []).map((o: any) => ({ name: o.package.name, version: o.package.version, description: o.package.description, keywords: o.package.keywords?.slice(0, 5), url: o.package.links?.npm, downloads: o.score?.detail?.popularity })) });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/search/pypi", async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'q' parameter" });
      const pypiRes = await fetch(`https://pypi.org/pypi/${encodeURIComponent(q)}/json`);
      if (pypiRes.ok) {
        const data = await pypiRes.json() as any;
        return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result: { name: data.info.name, version: data.info.version, summary: data.info.summary, author: data.info.author, license: data.info.license, url: data.info.project_url, homepage: data.info.home_page } });
      }
      const searchRes = await fetch(`https://pypi.org/simple/`, { headers: { Accept: "application/vnd.pypi.simple.v1+json" } });
      throw new Error(`Package "${q}" not found on PyPI`);
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/search/stackoverflow", async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'q' parameter" });
      const soRes = await fetch(`https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=${encodeURIComponent(q)}&site=stackoverflow&pagesize=10&filter=withbody`);
      if (!soRes.ok) throw new Error("Stack Overflow API request failed");
      const data = await soRes.json() as any;
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", total: data.total || 0, questions: (data.items || []).map((q: any) => ({ title: q.title, score: q.score, answers: q.answer_count, views: q.view_count, tags: q.tags, url: q.link, isAnswered: q.is_answered })) });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/search/reddit", async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'q' parameter" });
      const sort = (req.query.sort as string) || "relevance";
      const redditRes = await fetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(q)}&sort=${sort}&limit=10`, { headers: { "User-Agent": "WolfAPIs/4.0" } });
      if (!redditRes.ok) throw new Error("Reddit API request failed");
      const data = await redditRes.json() as any;
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", results: (data.data?.children || []).map((c: any) => ({ title: c.data.title, subreddit: c.data.subreddit, author: c.data.author, score: c.data.score, comments: c.data.num_comments, url: `https://reddit.com${c.data.permalink}`, selftext: c.data.selftext?.substring(0, 200) })) });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/search/urbandictionary", async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'q' parameter" });
      const udRes = await fetch(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(q)}`);
      if (!udRes.ok) throw new Error("Urban Dictionary API request failed");
      const data = await udRes.json() as any;
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", word: q, definitions: (data.list || []).slice(0, 5).map((d: any) => ({ definition: d.definition?.replace(/[\[\]]/g, ""), example: d.example?.replace(/[\[\]]/g, ""), author: d.author, thumbsUp: d.thumbs_up, thumbsDown: d.thumbs_down })) });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/search/emoji", async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'q' parameter" });
      const emojiRes = await fetch(`https://emoji-api.com/emojis?search=${encodeURIComponent(q)}&access_key=free`);
      if (emojiRes.ok) {
        const data = await emojiRes.json() as any;
        if (Array.isArray(data)) return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", results: data.slice(0, 10).map((e: any) => ({ character: e.character, unicodeName: e.unicodeName, slug: e.slug, group: e.group, subGroup: e.subGroup })) });
      }
      const openRes = await fetch("https://raw.githubusercontent.com/muan/unicode-emoji-json/main/data-by-emoji.json");
      const allEmoji = await openRes.json() as Record<string, any>;
      const matches = Object.entries(allEmoji).filter(([, v]) => v.name.toLowerCase().includes(q.toLowerCase()) || v.slug.toLowerCase().includes(q.toLowerCase())).slice(0, 10);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", results: matches.map(([emoji, v]) => ({ character: emoji, name: v.name, slug: v.slug, group: v.group })) });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/search/country", async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'q' parameter" });
      const countryRes = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(q)}?fields=name,capital,population,region,subregion,languages,currencies,flags,timezones`);
      if (!countryRes.ok) throw new Error(`No country found for "${q}"`);
      const data = await countryRes.json() as any[];
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", results: data.slice(0, 5).map((c: any) => ({ name: c.name?.common, official: c.name?.official, capital: c.capital?.[0], population: c.population, region: c.region, subregion: c.subregion, languages: c.languages ? Object.values(c.languages) : [], currencies: c.currencies ? Object.values(c.currencies).map((cur: any) => cur.name) : [], flag: c.flags?.png, timezones: c.timezones })) });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  // ============== MOVIE ROUTES ==============
  app.get("/api/movie/search", async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'q' parameter" });
      const result = await movie.searchMovies(q, req.query.page as string);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", ...result });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/movie/info", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'id' parameter" });
      const result = await movie.getMovieInfo(id);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/movie/trailer", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'id' parameter" });
      const result = await movie.getMovieTrailer(id);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", result });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/movie/trending", async (req, res) => {
    try {
      const result = await movie.getTrendingMovies(req.query.time as string);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", ...result });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/movie/popular", async (req, res) => {
    try {
      const result = await movie.getPopularMovies(req.query.page as string);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", ...result });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/movie/upcoming", async (req, res) => {
    try {
      const result = await movie.getUpcomingMovies(req.query.page as string);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", ...result });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/movie/top-rated", async (req, res) => {
    try {
      const result = await movie.getTopRatedMovies(req.query.page as string);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", ...result });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/movie/now-playing", async (req, res) => {
    try {
      const result = await movie.getNowPlayingMovies(req.query.page as string);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", ...result });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/movie/similar", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'id' parameter" });
      const result = await movie.getSimilarMovies(id);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", ...result });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/movie/credits", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'id' parameter" });
      const result = await movie.getMovieCredits(id);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", ...result });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/movie/reviews", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'id' parameter" });
      const result = await movie.getMovieReviews(id);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", ...result });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/movie/genres", async (_req, res) => {
    try {
      const result = await movie.getMovieGenres();
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", ...result });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/movie/discover", async (req, res) => {
    try {
      const result = await movie.discoverMovies(req.query.genre as string, req.query.year as string, req.query.sort as string);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", ...result });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/movie/images", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'id' parameter" });
      const result = await movie.getMovieImages(id);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", ...result });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/movie/trending-all", async (req, res) => {
    try {
      const result = await movie.getTrendingAll(req.query.time as string);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", ...result });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/movie/person", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'id' parameter" });
      const result = await movie.getPersonInfo(id);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", ...result });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  // ============== TEXTPRO ROUTES ==============
  app.get("/api/textpro/list", async (_req, res) => {
    try {
      const effects = await listTextproEffects();
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", total: effects.length, effects });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/textpro/generate", async (req, res) => {
    try {
      const effect = req.query.effect as string;
      const text = req.query.text as string;
      if (!effect) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'effect' parameter. Use /api/textpro/list to see available effects." });
      if (!text) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'text' parameter" });
      const imageUrl = await generateTextpro(effect, text);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", effect, text, imageUrl });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/textpro/:effectId", async (req, res) => {
    try {
      const effectId = req.params.effectId;
      const text = req.query.text as string;
      if (!text) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'text' parameter" });
      const imageUrl = await generateTextpro(effectId, text);
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", effect: effectId, text, imageUrl });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/converter/img-to-sticker", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'url' parameter" });
      const result = await imageToSticker(url);
      return res.json({ ...result, creator: "APIs by Silent Wolf | A tech explorer" });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/converter/sticker-to-img", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'url' parameter" });
      const result = await stickerToImage(url);
      return res.json({ ...result, creator: "APIs by Silent Wolf | A tech explorer" });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/converter/video-to-sticker", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'url' parameter" });
      const result = await videoToSticker(url);
      return res.json({ ...result, creator: "APIs by Silent Wolf | A tech explorer" });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/converter/sticker-to-video", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'url' parameter" });
      const result = await stickerToVideo(url);
      return res.json({ ...result, creator: "APIs by Silent Wolf | A tech explorer" });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/converter/video-to-gif", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'url' parameter" });
      const result = await videoToGif(url);
      return res.json({ ...result, creator: "APIs by Silent Wolf | A tech explorer" });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/converter/gif-to-video", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'url' parameter" });
      const result = await gifToVideo(url);
      return res.json({ ...result, creator: "APIs by Silent Wolf | A tech explorer" });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/audio/list", (_req, res) => {
    try {
      const effects = listAudioEffects();
      return res.json({ success: true, creator: "APIs by Silent Wolf | A tech explorer", count: effects.length, effects });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/audio/:effectId", async (req, res) => {
    try {
      const effectId = req.params.effectId;
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Missing 'url' parameter - provide an audio/video URL" });
      const result = await applyAudioEffect(effectId, url);
      return res.json({ ...result, creator: "APIs by Silent Wolf | A tech explorer" });
    } catch (error: any) { return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message }); }
  });

  app.get("/api/endpoints", (req, res) => {
    const referer = req.headers.referer || "";
    const host = req.headers.host || "";
    const ua = req.headers["user-agent"] || "";

    const isFromOwnSite = referer.includes(host);
    const isBrowser = /Mozilla|Chrome|Safari|Firefox|Edge/i.test(ua);

    if (!isFromOwnSite || !isBrowser) {
      return res.status(403).json({
        success: false,
        error: "This endpoint is restricted to the WolfAPIs dashboard.",
        creator: "APIs by Silent Wolf | A tech explorer",
      });
    }

    return res.json({
      success: true,
      creator: "APIs by Silent Wolf | A tech explorer",
      version: "4.0",
      totalEndpoints: schemaEndpoints.length,
      categories: schemaCategories,
      endpoints: schemaEndpoints,
    });
  });

  app.get("/api/admin/update-ytdlp", async (req, res) => {
    try {
      const { stdout, stderr } = await execAsync("yt-dlp --update-to stable 2>&1", { timeout: 60000 });
      const output = (stdout + stderr).trim();
      reloadCookies();
      return res.json({
        success: true,
        creator: "APIs by Silent Wolf | A tech explorer",
        message: output || "yt-dlp is already up to date",
      });
    } catch (e: any) {
      return res.status(500).json({
        success: false,
        creator: "APIs by Silent Wolf | A tech explorer",
        error: `yt-dlp update failed: ${e.message}`,
      });
    }
  });

  app.get("/api/admin/reload-cookies", (req, res) => {
    reloadCookies();
    return res.json({
      success: true,
      creator: "APIs by Silent Wolf | A tech explorer",
      message: "Cookie cache cleared. Next download will reload cookies from disk.",
    });
  });

  app.get("/api/admin/provider-health", (_req, res) => {
    return res.json({
      success: true,
      creator: "APIs by Silent Wolf | A tech explorer",
      providers: ["ytdlp", "fabdl", "cobalt", "piped", "y2mate"],
      note: "Providers are tried in order. Failed providers are on 5-minute cooldown then retried.",
    });
  });

  // ─── Media/Music Provider Status ──────────────────────────────────────────
  // Quick lightweight probes — cached 2 minutes. Used by the UI status dots.

  let statusCache: { data: any; expiresAt: number } | null = null;

  async function probeUrl(url: string, opts: RequestInit = {}, timeoutMs = 6000): Promise<boolean> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...opts, signal: controller.signal });
      return res.status < 500;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  app.get("/api/media/status", async (_req, res) => {
    if (statusCache && Date.now() < statusCache.expiresAt) {
      return res.json(statusCache.data);
    }

    const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

    const [ytdlp, fabdl, cobalt, piped, y2mate, tiktok, igraphql, spotify, shazam] =
      await Promise.all([
        // ytdlp — check binary exists
        (async () => {
          try {
            const { exec } = await import("child_process");
            const { promisify } = await import("util");
            const execA = promisify(exec);
            await execA("yt-dlp --version", { timeout: 4000 });
            return true;
          } catch { return false; }
        })(),
        // fabdl — check API responds
        probeUrl("https://api.fabdl.com/youtube/get?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ&type=mp3", { headers: { "User-Agent": UA } }),
        // cobalt — check instances registry
        probeUrl("https://instances.cobalt.best/api/instances.json", { headers: { "User-Agent": UA } }),
        // piped — check instances registry
        probeUrl("https://piped-instances.kavin.rocks/", { headers: { "User-Agent": UA } }),
        // y2mate — check auth page
        probeUrl("https://v1.y2mate.nu/", { headers: { "User-Agent": UA } }),
        // tiktok (ssstik) — check API
        probeUrl("https://ssstik.io/", { headers: { "User-Agent": UA } }),
        // instagram graphql — quick check
        probeUrl("https://www.instagram.com/", { headers: { "User-Agent": UA } }),
        // spotify (spotdown)
        probeUrl("https://spotdown.org/", { headers: { "User-Agent": UA } }),
        // shazam
        probeUrl("https://www.shazam.com/", { headers: { "User-Agent": UA } }),
      ]);

    const data = {
      success: true,
      creator: "APIs by Silent Wolf | A tech explorer",
      checkedAt: new Date().toISOString(),
      categories: {
        music: {
          providers: {
            ytdlp: { active: ytdlp, label: "yt-dlp" },
            fabdl: { active: fabdl, label: "FabDL" },
            cobalt: { active: cobalt, label: "Cobalt" },
            piped: { active: piped, label: "Piped" },
            y2mate: { active: y2mate, label: "Y2Mate" },
          },
        },
        "social-media": {
          providers: {
            tiktok: { active: tiktok, label: "TikTok (ssstik)" },
            instagram: { active: igraphql, label: "Instagram" },
            cobalt: { active: cobalt, label: "Cobalt" },
            ytdlp: { active: ytdlp, label: "yt-dlp" },
          },
        },
        spotify: {
          providers: {
            spotdown: { active: spotify, label: "Spotdown" },
          },
        },
        shazam: {
          providers: {
            shazam: { active: shazam, label: "Shazam" },
          },
        },
      },
    };

    statusCache = { data, expiresAt: Date.now() + 2 * 60 * 1000 };
    return res.json(data);
  });

  app.get("/stream", async (req, res) => {
    const q = (req.query.q || req.query.url) as string;
    const type = ((req.query.type as string) || "mp3").toLowerCase() === "mp4" ? "mp4" : "mp3";
    if (!q) return res.status(400).json({ error: "Missing q or url param" });
    try {
      let videoUrl = q;
      if (!isYouTubeUrl(q)) {
        const searchResults = await searchSongs(q.trim());
        if (!searchResults.items || searchResults.items.length === 0) {
          return res.status(404).json({ error: `No results found for "${q}"` });
        }
        videoUrl = `https://www.youtube.com/watch?v=${searchResults.items[0].id}`;
      }

      const info = await getDownloadInfo(videoUrl, type as "mp3" | "mp4");
      if (!info || !info.success || !info.downloadUrl) {
        return res.status(500).json({ error: (info as any)?.error || "Failed to get download URL" });
      }

      const { downloadUrl, title } = info as { downloadUrl: string; title: string };
      const safeName = (title || "download").replace(/[^a-zA-Z0-9_\- ]/g, "").trim() || "download";

      const fileRes = await fetch(downloadUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "*/*",
          "Referer": "https://www.youtube.com/",
        },
        redirect: "follow",
      });

      if (!fileRes.ok) {
        return res.status(fileRes.status).json({ error: `CDN returned ${fileRes.status}` });
      }

      const contentType = fileRes.headers.get("content-type") || (type === "mp4" ? "video/mp4" : "audio/mpeg");
      const contentLength = fileRes.headers.get("content-length");
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}.${type}"`);
      if (contentLength) res.setHeader("Content-Length", contentLength);
      res.setHeader("Cache-Control", "no-cache");

      if (!fileRes.body) return res.status(502).json({ error: "No response body from CDN" });
      const { Readable } = await import("stream");
      const nodeStream = Readable.fromWeb(fileRes.body as import("stream/web").ReadableStream);
      nodeStream.pipe(res);
      nodeStream.on("error", (err) => { if (!res.headersSent) res.status(500).json({ error: err.message }); });
    } catch (err: any) {
      if (!res.headersSent) res.status(500).json({ error: err.message });
    }
  });

  app.get("/debug/provider-health", (_req, res) => {
    return res.json(getProviderHealthStatus());
  });

  app.post("/debug/reset-providers", (req, res) => {
    const name = req.body?.name as string | undefined;
    resetProviderHealth(name);
    return res.json({ cleared: name || "all", health: getProviderHealthStatus() });
  });

  app.get("/debug/ytdlp-file", async (req, res) => {
    const videoId = (req.query.v as string) || "VoH21Knbx0U";
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId))
      return res.status(400).json({ error: "Invalid video ID" });

    const { exec: execRaw } = await import("child_process");
    const { promisify: prom } = await import("util");
    const { mkdirSync, readdirSync, statSync, unlinkSync, existsSync } = await import("fs");
    const { randomUUID } = await import("crypto");
    const xExec = prom(execRaw);
    const TDIR = "/tmp/wolfapi_dl";
    mkdirSync(TDIR, { recursive: true });

    const fmt = `best[height<=720][ext=mp4]/best[height<=720]/best[ext=mp4]/best`;
    const uuid = randomUUID();
    const outTemplate = `${TDIR}/${uuid}.%(ext)s`;
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Mirror exactly what ytdlpFileConvert does — only use cookies if YTDLP_COOKIES env var is set
    const envCookiesPath = process.env.YTDLP_COOKIES;
    const cookiesArg = (envCookiesPath && existsSync(envCookiesPath))
      ? `--cookies '${envCookiesPath}'`
      : "";

    const cmd = [
      `yt-dlp`,
      cookiesArg,
      `--no-warnings`,
      `--no-simulate`,
      `--extractor-args "youtube:player_client=android_music,android,ios,mweb,web"`,
      `--socket-timeout 30`,
      `-f "${fmt}"`,
      `--print title`,
      `-o "${outTemplate}"`,
      `"${youtubeUrl}"`,
      `2>&1`,
    ].filter(Boolean).join(" ");

    let stdout = "";
    let cmdError = null;
    try {
      ({ stdout } = await xExec(cmd, { timeout: 120000 }));
    } catch (e: any) {
      cmdError = (e.stdout || e.stderr || e.message || "unknown");
    }

    const files = readdirSync(TDIR).filter((f: string) => f.startsWith(uuid));
    let fileInfo = null;
    if (files.length > 0) {
      const sz = statSync(`${TDIR}/${files[0]}`).size;
      try { unlinkSync(`${TDIR}/${files[0]}`); } catch {}
      fileInfo = { name: files[0], size_bytes: sz };
    }

    return res.json({
      videoId,
      cmd: cmd.replace(/--cookies '[^']*'/, "--cookies '[REDACTED]'"),
      cookiesArg: cookiesArg ? "FOUND" : "NONE",
      stdout: stdout.substring(0, 500),
      cmdError: cmdError ? String(cmdError).substring(0, 500) : null,
      fileCreated: fileInfo,
      providerHealth: getProviderHealthStatus(),
    });
  });

  app.get("/debug/ytdlp", async (req, res) => {
    const videoId = (req.query.v as string) || "dQw4w9WgXcQ";
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId))
      return res.status(400).json({ error: "Invalid video ID" });

    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } = await import("fs");
    const { randomUUID } = await import("crypto");
    const execAsync = promisify(exec);
    const TDIR = "/tmp/wolfapi_dl";

    const results: Record<string, any> = {};

    // 1. yt-dlp version
    try {
      const { stdout } = await execAsync("yt-dlp --version 2>&1");
      results.version = stdout.trim();
    } catch (e: any) { results.version = `ERROR: ${e.message}`; }

    // 2. ffmpeg availability
    try {
      const { stdout } = await execAsync("ffmpeg -version 2>&1");
      results.ffmpeg = stdout.split("\n")[0].trim();
    } catch { results.ffmpeg = "NOT FOUND"; }

    // 3. Temp dir write test
    try {
      mkdirSync(TDIR, { recursive: true });
      const testFile = `${TDIR}/write_test_${Date.now()}`;
      require("fs").writeFileSync(testFile, "test");
      require("fs").unlinkSync(testFile);
      results.tmp_writable = true;
    } catch (e: any) { results.tmp_writable = `ERROR: ${e.message}`; }

    // 4. URL extraction per client (fast check)
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    for (const client of ["android", "ios", "mweb", "web"]) {
      try {
        const cmd = `yt-dlp --no-warnings --extractor-args "youtube:player_client=${client}" --socket-timeout 15 -f "best[height<=720][ext=mp4]/best[height<=720]/best" -g "${youtubeUrl}" 2>&1`;
        const { stdout } = await execAsync(cmd, { timeout: 20000 });
        const lines = stdout.trim().split("\n").filter(Boolean);
        const url = lines[lines.length - 1] || "";
        results[`url_${client}`] = url.startsWith("http") ? { success: true, url: url.substring(0, 80) + "..." } : { success: false, error: stdout.substring(0, 200) };
      } catch (e: any) {
        results[`url_${client}`] = { success: false, error: (e.stdout || e.stderr || e.message || "unknown").substring(0, 200) };
      }
    }

    // 5. Actual file download test (the critical step)
    try {
      const uuid = randomUUID();
      const outTemplate = `${TDIR}/${uuid}.%(ext)s`;
      const fmt = "best[height<=360][ext=mp4]/best[height<=360]/best[ext=mp4]/best";
      const cmd = `yt-dlp --no-warnings --no-simulate --extractor-args "youtube:player_client=android,ios,mweb,web" --socket-timeout 30 -f "${fmt}" --print title -o "${outTemplate}" "${youtubeUrl}" 2>&1`;
      const { stdout } = await execAsync(cmd, { timeout: 90000 });
      const files = readdirSync(TDIR).filter((f: string) => f.startsWith(uuid));
      if (files.length > 0) {
        const sz = statSync(`${TDIR}/${files[0]}`).size;
        try { unlinkSync(`${TDIR}/${files[0]}`); } catch {}
        results.download_test = { success: true, file: files[0], size_bytes: sz, stdout: stdout.substring(0, 300) };
      } else {
        results.download_test = { success: false, error: "File not created", stdout: stdout.substring(0, 400) };
      }
    } catch (e: any) {
      results.download_test = { success: false, error: (e.stdout || e.stderr || e.message || "unknown").substring(0, 400) };
    }

    return res.json({ videoId, ...results });
  });

  app.get("/proxy", async (req, res) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ error: "Missing url param" });

    let origin = "https://www.youtube.com";
    try { origin = new URL(url).origin; } catch {}

    const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

    const upstreamHeaders: Record<string, string> = {
      "User-Agent": UA,
      "Accept": "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "identity",
      "Referer": origin + "/",
      "Origin": origin,
      "Sec-Fetch-Dest": "video",
      "Sec-Fetch-Mode": "no-cors",
      "Sec-Fetch-Site": "cross-site",
      "Sec-CH-UA": '"Chromium";v="131", "Google Chrome";v="131", "Not_A Brand";v="24"',
      "Sec-CH-UA-Mobile": "?0",
      "Sec-CH-UA-Platform": '"Windows"',
      "DNT": "1",
      "Connection": "keep-alive",
    };

    // Forward Range header so video players can seek
    const rangeHeader = req.headers.range;
    if (rangeHeader) upstreamHeaders["Range"] = rangeHeader;

    try {
      const response = await fetch(url, {
        headers: upstreamHeaders,
        redirect: "follow",
      });

      // 403/401 — the URL may be IP-locked or expired
      if (response.status === 403 || response.status === 401) {
        return res.status(response.status).json({ error: `Upstream blocked (${response.status}) — URL may be IP-locked or expired` });
      }
      if (!response.ok && response.status !== 206) {
        return res.status(response.status).json({ error: `Upstream returned ${response.status}` });
      }

      const contentType = response.headers.get("content-type") || "application/octet-stream";
      const contentLength = response.headers.get("content-length");
      const contentRange = response.headers.get("content-range");
      const acceptRanges = response.headers.get("accept-ranges");

      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Access-Control-Allow-Origin", "*");
      if (contentLength) res.setHeader("Content-Length", contentLength);
      if (contentRange) res.setHeader("Content-Range", contentRange);
      if (acceptRanges) res.setHeader("Accept-Ranges", acceptRanges);
      else res.setHeader("Accept-Ranges", "bytes");

      // Preserve Content-Disposition so browsers trigger download correctly
      const disposition = response.headers.get("content-disposition");
      if (disposition) res.setHeader("Content-Disposition", disposition);

      res.status(response.status);

      if (!response.body) return res.status(502).json({ error: "No response body" });

      const { Readable } = await import("stream");
      const nodeStream = Readable.fromWeb(response.body as import("stream/web").ReadableStream);
      nodeStream.pipe(res);
      nodeStream.on("error", (err: any) => {
        if (!res.headersSent) res.status(500).json({ error: err.message });
      });
    } catch (err: any) {
      if (!res.headersSent) res.status(500).json({ error: err.message });
    }
  });

  return httpServer;
}
