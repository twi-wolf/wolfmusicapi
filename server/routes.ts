import type { Express } from "express";
import { type Server } from "http";
import { searchSongs, getDownloadInfo, extractVideoId } from "./scraper";
import { registerAIRoutes } from "./ai-routes";
import { downloadTikTok } from "../lib/downloaders/tiktok";
import { downloadInstagram } from "../lib/downloaders/instagram";
import { downloadYouTube } from "../lib/downloaders/youtube";
import { downloadFacebook } from "../lib/downloaders/facebook";
import { searchSpotify, downloadSpotify } from "../lib/downloaders/spotify";
import { searchShazam, recognizeShazamFull, getTrackDetails } from "../lib/downloaders/shazam";
import { generateEphoto, listEphotoEffects } from "../lib/downloaders/ephoto360";
import { generatePhotofunia, listPhotofuniaEffects } from "../lib/downloaders/photofunia";
import { githubStalk, ipStalk, npmStalk, tiktokStalk, instagramStalk, twitterStalk, waChannelStalk } from "../lib/downloaders/stalker";
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

        return res.json({
          ...result,
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
      return res.json({
        ...result,
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
      return res.json(result);
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
      return res.json(result);
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
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "Facebook download failed" });
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
      const { effect, text, text2 } = req.body;
      if (!effect || !text) {
        return res.status(400).json({
          success: false,
          error: "Parameters 'effect' (effect slug or ID) and 'text' (text to render) are required.",
        });
      }

      const texts = text2 ? [text, text2] : [text];
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
      const result = await generateEphoto(effectId, [text]);
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

  app.get("/api/stalk/whatsapp", async (req, res) => {
    try {
      const query = req.query.query as string;
      if (!query) return res.status(400).json({ success: false, error: "Query parameter 'query' is required." });
      const result = await waChannelStalk(query.trim());
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "APIs by Silent Wolf | A tech explorer", error: error.message });
    }
  });

  app.get("/api/endpoints", (_req, res) => {
    return res.json({
      success: true,
      creator: "APIs by Silent Wolf | A tech explorer",
      version: "4.0",
      totalEndpoints: schemaEndpoints.length,
      categories: schemaCategories,
      endpoints: schemaEndpoints,
    });
  });

  return httpServer;
}
