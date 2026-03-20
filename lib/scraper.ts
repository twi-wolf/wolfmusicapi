import { exec } from "child_process";
import { promisify } from "util";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const TEMP_DIR = "/tmp/wolfapi_dl";
try { mkdirSync(TEMP_DIR, { recursive: true }); } catch {}

export const tempFiles = new Map<string, { filePath: string; expiresAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [uuid, entry] of tempFiles.entries()) {
    if (now > entry.expiresAt) {
      try { require("fs").unlinkSync(entry.filePath); } catch {}
      tempFiles.delete(uuid);
    }
  }
}, 5 * 60 * 1000);

const execAsync = promisify(exec);

// ─── Cookies ─────────────────────────────────────────────────────────────────

const COOKIES_PATHS = [
  path.join(process.cwd(), "cookies.txt"),
  "/var/www/wolfmusicapi/cookies.txt",
  path.join(process.env.HOME || "", "cookies.txt"),
];

function getCookiesArg(): string {
  for (const p of COOKIES_PATHS) {
    if (existsSync(p)) {
      console.log(`[yt-dlp] Using cookies from: ${p}`);
      return `--cookies '${p}'`;
    }
  }
  return "";
}

let _cookiesArg: string | null = null;
function ytdlpCookies(): string {
  if (_cookiesArg === null) _cookiesArg = getCookiesArg();
  return _cookiesArg;
}

export function reloadCookies(): void {
  _cookiesArg = null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36";

const Y2MATE_HEADERS = {
  accept: "*/*",
  "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
  origin: "https://v1.y2mate.nu",
  referer: "https://v1.y2mate.nu/",
  "save-data": "on",
  "sec-ch-ua": '"Chromium";v="137", "Not/A)Brand";v="24"',
  "sec-ch-ua-mobile": "?1",
  "sec-ch-ua-platform": '"Android"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "cross-site",
  "user-agent": MOBILE_UA,
};

const Y2MATE_HTML_HEADERS = {
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9",
  "user-agent": MOBILE_UA,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 15000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function safeJsonParse(res: Response, label: string): Promise<any> {
  const text = await res.text();
  if (!text || text.trim().length === 0)
    throw new Error(`${label}: empty response (status ${res.status})`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label}: invalid JSON (status ${res.status})`);
  }
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
    /\/v\/([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
    /\/live\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  return null;
}

// ─── Provider health tracking ─────────────────────────────────────────────────

const providerHealth: Map<
  string,
  { failures: number; lastFailure: number; cooldownUntil: number }
> = new Map();

const HEALTH_CONFIG = {
  maxFailures: 3,
  cooldownMs: 5 * 60 * 1000,
  resetAfterMs: 15 * 60 * 1000,
};

function isProviderHealthy(name: string): boolean {
  const health = providerHealth.get(name);
  if (!health) return true;
  if (Date.now() > health.cooldownUntil) {
    if (Date.now() - health.lastFailure > HEALTH_CONFIG.resetAfterMs)
      providerHealth.delete(name);
    return true;
  }
  return false;
}

function recordProviderFailure(name: string): void {
  const health = providerHealth.get(name) || {
    failures: 0,
    lastFailure: 0,
    cooldownUntil: 0,
  };
  health.failures++;
  health.lastFailure = Date.now();
  if (health.failures >= HEALTH_CONFIG.maxFailures) {
    health.cooldownUntil = Date.now() + HEALTH_CONFIG.cooldownMs;
    console.log(
      `[health] Provider ${name} on cooldown for ${HEALTH_CONFIG.cooldownMs / 1000}s`
    );
  }
  providerHealth.set(name, health);
}

function recordProviderSuccess(name: string): void {
  providerHealth.delete(name);
}

// ─── Provider 1: yt-dlp ──────────────────────────────────────────────────────

async function ytdlpConvert(
  videoId: string,
  format: "mp3" | "mp4"
): Promise<{ downloadUrl: string; title: string }> {
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId))
    throw new Error("yt-dlp: invalid video ID");

  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  // For -g (URL only, no merge), only request pre-merged formats — the + operator returns two URLs
  const formatArg =
    format === "mp3"
      ? "bestaudio[ext=m4a]/bestaudio/best"
      : "best[height<=720][ext=mp4]/best[height<=720][vcodec!=none][acodec!=none]/best[ext=mp4]/best";

  const cookiesArg = ytdlpCookies();
  const cmd = `yt-dlp ${cookiesArg} --no-warnings --print title -f "${formatArg}" -g "${youtubeUrl}" 2>&1`;

  let stdout: string;
  try {
    ({ stdout } = await execAsync(cmd, { timeout: 30000 }));
  } catch (e: any) {
    throw new Error(`yt-dlp: ${(e.stderr || e.stdout || e.message || "unknown").substring(0, 300)}`);
  }

  const lines = stdout.trim().split("\n").filter((l) => l.trim());
  if (lines.length < 2)
    throw new Error(`yt-dlp: no URL returned (${lines.join(" | ").substring(0, 150)})`);

  const title = lines[0] || `video_${videoId}`;
  const downloadUrl = lines[lines.length - 1];

  if (!downloadUrl || !downloadUrl.startsWith("http"))
    throw new Error(`yt-dlp: invalid URL (${downloadUrl?.substring(0, 100)})`);

  return { downloadUrl, title };
}

// ─── Provider 2: FabDL ───────────────────────────────────────────────────────
// Returns direct YouTube CDN URLs — works without cookies or authentication

async function fabdlConvert(
  videoId: string,
  format: "mp3" | "mp4"
): Promise<{ downloadUrl: string; title: string }> {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const type = format === "mp3" ? "mp3" : "mp4";

  const res = await fetchWithTimeout(
    `https://api.fabdl.com/youtube/get?url=${encodeURIComponent(youtubeUrl)}&type=${type}`,
    {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
        Referer: "https://fabdl.com/",
      },
    },
    20000
  );

  if (!res.ok) throw new Error(`fabdl: HTTP ${res.status}`);

  const data = await safeJsonParse(res, "fabdl");
  const result = data?.result ?? data;

  if (data?.error) throw new Error(`fabdl: ${data.error?.message || JSON.stringify(data.error)}`);

  const title = result?.title || `video_${videoId}`;

  if (format === "mp3") {
    const audios: any[] = result?.audios ?? [];
    const best = audios
      .filter((a: any) => a?.url)
      .sort((a: any, b: any) => parseFloat(b.quality || "0") - parseFloat(a.quality || "0"))[0];
    if (best?.url) return { downloadUrl: best.url, title };
    const videos: any[] = result?.videos ?? [];
    const fallback = videos.find((v: any) => v?.url && v?.has_audio);
    if (fallback?.url) return { downloadUrl: fallback.url, title };
  } else {
    const videos: any[] = result?.videos ?? [];
    const best = videos
      .filter((v: any) => v?.url)
      .sort((a: any, b: any) => {
        const qa = parseInt(a.quality || "0");
        const qb = parseInt(b.quality || "0");
        return qb - qa;
      })[0];
    if (best?.url) return { downloadUrl: best.url, title };
  }

  throw new Error("fabdl: no download URL in response");
}

// ─── Provider 3: Cobalt (dynamic instances) ───────────────────────────────────

let cobaltInstancesCache: { instances: string[]; expiresAt: number } | null = null;

const COBALT_FALLBACK_INSTANCES = [
  "https://cobalt-api.meowing.de",
  "https://cobalt-backend.canine.tools",
  "https://cobalt.dark-dragon.digital",
  "https://co.eepy.today",
  "https://cobalt-api.kwiatekmiki.com",
];

async function getCobaltInstances(): Promise<string[]> {
  if (cobaltInstancesCache && Date.now() < cobaltInstancesCache.expiresAt)
    return cobaltInstancesCache.instances;

  try {
    const res = await fetchWithTimeout(
      "https://instances.cobalt.best/api/instances.json",
      { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } },
      8000
    );
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = (await res.json()) as any[];
    const ytInstances = data
      .filter(
        (inst: any) =>
          inst.online === true &&
          inst.services?.youtube === true &&
          inst.cors === true &&
          inst.api &&
          inst.score >= 70
      )
      .sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
      .slice(0, 8)
      .map((inst: any) => `https://${inst.api}`);
    if (ytInstances.length > 0) {
      cobaltInstancesCache = { instances: ytInstances, expiresAt: Date.now() + 30 * 60 * 1000 };
      console.log(`[cobalt] Loaded ${ytInstances.length} dynamic instances`);
      return ytInstances;
    }
  } catch (e: any) {
    console.log(`[cobalt] Failed to fetch instances: ${e.message}`);
  }

  cobaltInstancesCache = {
    instances: COBALT_FALLBACK_INSTANCES,
    expiresAt: Date.now() + 10 * 60 * 1000,
  };
  return COBALT_FALLBACK_INSTANCES;
}

async function cobaltConvert(
  videoId: string,
  format: "mp3" | "mp4"
): Promise<{ downloadUrl: string; title: string }> {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const errors: string[] = [];
  const instances = await getCobaltInstances();

  for (const instance of instances) {
    try {
      const body: any = { url: youtubeUrl };
      if (format === "mp3") {
        body.downloadMode = "audio";
        body.audioFormat = "mp3";
      } else {
        body.downloadMode = "auto";
        body.videoQuality = "1080";
        body.youtubeVideoCodec = "h264";
      }

      const res = await fetchWithTimeout(
        instance,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "User-Agent": USER_AGENT,
          },
          body: JSON.stringify(body),
        },
        15000
      );

      if (res.status === 429 || res.status === 403 || res.status === 401) {
        errors.push(`${instance}: status ${res.status}`);
        continue;
      }
      if (res.status >= 500) {
        errors.push(`${instance}: server error ${res.status}`);
        continue;
      }

      const data = await safeJsonParse(res, `cobalt(${instance})`);

      if (data.status === "error" || data.status === "rate-limit") {
        const code = data.error?.code || data.text || "error";
        errors.push(`${instance}: ${code}`);
        continue;
      }

      const dlUrl = data.url || data.audio;
      if (dlUrl) return { downloadUrl: dlUrl, title: data.filename || `video_${videoId}` };

      if ((data.status === "tunnel" || data.status === "redirect") && data.url)
        return { downloadUrl: data.url, title: data.filename || `video_${videoId}` };

      errors.push(`${instance}: no download URL`);
    } catch (e: any) {
      errors.push(`${instance}: ${e.message}`);
    }
  }

  cobaltInstancesCache = null;
  throw new Error(`Cobalt: all instances failed: ${errors.join("; ")}`);
}

// ─── Provider 4: Piped (dynamic instances) ────────────────────────────────────

const PIPED_FALLBACK_INSTANCES = [
  "https://api.piped.private.coffee",
  "https://pipedapi.kavin.rocks",
  "https://piped-api.privacy.com.de",
  "https://api.piped.yt",
  "https://piped.video/api",
];

let pipedInstancesCache: { instances: string[]; expiresAt: number } | null = null;

async function getPipedInstances(): Promise<string[]> {
  if (pipedInstancesCache && Date.now() < pipedInstancesCache.expiresAt)
    return pipedInstancesCache.instances;

  try {
    const res = await fetchWithTimeout(
      "https://piped-instances.kavin.rocks/",
      { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } },
      8000
    );
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = (await res.json()) as any[];
    const instances = data
      .filter((inst: any) => inst.api_url && (inst.uptime_24h ?? 100) >= 80)
      .sort((a: any, b: any) => (b.uptime_24h ?? 0) - (a.uptime_24h ?? 0))
      .slice(0, 6)
      .map((inst: any) => inst.api_url as string);
    if (instances.length > 0) {
      pipedInstancesCache = { instances, expiresAt: Date.now() + 30 * 60 * 1000 };
      console.log(`[piped] Loaded ${instances.length} dynamic instances`);
      return instances;
    }
  } catch (e: any) {
    console.log(`[piped] Failed to fetch instances: ${e.message}`);
  }

  pipedInstancesCache = {
    instances: PIPED_FALLBACK_INSTANCES,
    expiresAt: Date.now() + 10 * 60 * 1000,
  };
  return PIPED_FALLBACK_INSTANCES;
}

async function pipedConvert(
  videoId: string,
  format: "mp3" | "mp4"
): Promise<{ downloadUrl: string; title: string }> {
  const instances = await getPipedInstances();
  const errors: string[] = [];

  for (const instance of instances) {
    try {
      const res = await fetchWithTimeout(
        `${instance}/streams/${videoId}`,
        { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } },
        12000
      );
      if (!res.ok) {
        errors.push(`piped(${instance}): HTTP ${res.status}`);
        continue;
      }

      const data = await safeJsonParse(res, `piped(${instance})`);
      if (data.error) {
        errors.push(`piped(${instance}): ${data.error}`);
        continue;
      }

      const title = data.title || `video_${videoId}`;

      if (format === "mp3") {
        const best = (data.audioStreams ?? [])
          .filter((s: any) => s.url && s.bitrate)
          .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0];
        if (best) return { downloadUrl: best.url, title };
      } else {
        const best =
          (data.videoStreams ?? [])
            .filter((s: any) => s.url && s.resolution && parseInt(s.resolution) <= 720)
            .sort(
              (a: any, b: any) =>
                parseInt(b.resolution || "0") - parseInt(a.resolution || "0")
            )[0] || (data.videoStreams ?? []).find((s: any) => s.url);
        if (best) return { downloadUrl: best.url, title };
      }

      errors.push(`piped(${instance}): no suitable stream`);
    } catch (e: any) {
      errors.push(`piped(${instance}): ${e.message}`);
    }
  }

  pipedInstancesCache = null;
  throw new Error(`Piped: all instances failed: ${errors.join("; ")}`);
}

// ─── Provider 5: Y2Mate ───────────────────────────────────────────────────────

let y2mateAuthCache: {
  auth: string;
  paramChar: string;
  expiresAt: number;
} | null = null;

async function fetchY2MateAuth(): Promise<{ auth: string; paramChar: string }> {
  if (y2mateAuthCache && Date.now() < y2mateAuthCache.expiresAt)
    return { auth: y2mateAuthCache.auth, paramChar: y2mateAuthCache.paramChar };

  const pageRes = await fetchWithTimeout(
    "https://v1.y2mate.nu/",
    { headers: Y2MATE_HTML_HEADERS },
    10000
  );
  const html = await pageRes.text();

  const jsonMatch = html.match(/var json\s*=\s*JSON\.parse\('([^']+)'\)/);
  if (!jsonMatch) throw new Error("y2mate: failed to extract auth config");

  const json = JSON.parse(jsonMatch[1]);
  let auth = "";
  for (let t = 0; t < json[0].length; t++)
    auth += String.fromCharCode(json[0][t] - json[2][json[2].length - (t + 1)]);
  if (json[1]) auth = auth.split("").reverse().join("");
  if (auth.length > 32) auth = auth.substring(0, 32);
  const paramChar = String.fromCharCode(json[6]);

  y2mateAuthCache = { auth, paramChar, expiresAt: Date.now() + 4 * 60 * 1000 };
  return { auth, paramChar };
}

async function y2mateConvert(
  videoId: string,
  format: "mp3" | "mp4"
): Promise<{ downloadUrl: string; title: string }> {
  const { auth, paramChar } = await fetchY2MateAuth();
  const ts = () => Math.floor(Date.now() / 1000);

  const initRes = await fetchWithTimeout(
    `https://eta.etacloud.org/api/v1/init?${paramChar}=${encodeURIComponent(auth)}&t=${ts()}`,
    { headers: Y2MATE_HEADERS },
    10000
  );
  if (initRes.status === 429) {
    y2mateAuthCache = null;
    throw new Error("y2mate: rate limited (429)");
  }

  const initData = await safeJsonParse(initRes, "y2mate init");
  if (!initData?.convertURL) throw new Error("y2mate: no convertURL in init response");

  const convertUrl = `${initData.convertURL.split("&v=")[0]}&v=${videoId}&f=${format}&t=${ts()}`;
  const convertRes = await fetchWithTimeout(convertUrl, { headers: Y2MATE_HEADERS }, 15000);
  if (convertRes.status === 429) {
    y2mateAuthCache = null;
    throw new Error("y2mate: convert rate limited (429)");
  }

  const data = await safeJsonParse(convertRes, "y2mate convert");
  if (data.error !== 0 && data.error !== "0" && data.error)
    throw new Error("y2mate: convert error: " + JSON.stringify(data));

  if (data.downloadURL)
    return { downloadUrl: data.downloadURL, title: data.title || `video_${videoId}` };

  if (data.progressURL) {
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const pRes = await fetchWithTimeout(
        `${data.progressURL}&t=${ts()}`,
        { headers: Y2MATE_HEADERS },
        10000
      );
      const p = await safeJsonParse(pRes, "y2mate progress");
      if (p.error !== 0 && p.error !== "0" && p.error)
        throw new Error("y2mate: progress error: " + JSON.stringify(p));
      if (p.downloadURL)
        return { downloadUrl: p.downloadURL, title: p.title || data.title || `video_${videoId}` };
    }
    throw new Error("y2mate: conversion timed out");
  }

  if (data.redirectURL) {
    const rRes = await fetchWithTimeout(data.redirectURL, { headers: Y2MATE_HEADERS }, 15000);
    const rData = await safeJsonParse(rRes, "y2mate redirect");
    if (rData.downloadURL)
      return { downloadUrl: rData.downloadURL, title: rData.title || data.title || `video_${videoId}` };
  }

  throw new Error("y2mate: no download URL found");
}

// ─── Search ───────────────────────────────────────────────────────────────────

async function ytdlpSearch(query: string): Promise<{ query: string; items: any[] }> {
  const sanitized = query
    .replace(/[^a-zA-Z0-9\s\-_.,'&!?()]/g, "")
    .substring(0, 200);
  const cookies = ytdlpCookies();
  const { stdout } = await execAsync(
    `yt-dlp ${cookies} --no-warnings --flat-playlist --dump-json 'ytsearch10:${sanitized.replace(/'/g, "'\\''")}' 2>&1`,
    { timeout: 20000, maxBuffer: 1024 * 1024 }
  );

  const items: any[] = [];
  for (const line of stdout.trim().split("\n").filter((l) => l.trim())) {
    try {
      const data = JSON.parse(line);
      if (!data.id) continue;
      const dur = data.duration || 0;
      const mins = Math.floor(dur / 60);
      const secs = dur % 60;
      const sizeMb = dur > 0 ? ((dur * 128 * 1000) / 8 / 1024 / 1024).toFixed(2) : "0";
      items.push({
        title: data.title || "Unknown",
        id: data.id,
        size: `${sizeMb} MB`,
        duration: `${mins}:${String(secs).padStart(2, "0")}`,
        channelTitle: data.channel || data.uploader || "Unknown",
        source: "yt",
      });
    } catch {}
  }
  return { query, items };
}

async function youtubeHtmlSearch(query: string): Promise<{ query: string; items: any[] }> {
  const res = await fetchWithTimeout(
    `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "en-US,en;q=0.9",
        Accept: "text/html",
      },
    },
    10000
  );
  if (!res.ok) throw new Error(`YouTube HTML search: status ${res.status}`);

  const html = await res.text();
  const dataMatch = html.match(/var ytInitialData\s*=\s*({[\s\S]+?});/);
  if (!dataMatch) throw new Error("YouTube HTML search: could not parse response");

  let ytData: any;
  try {
    ytData = JSON.parse(dataMatch[1]);
  } catch {
    throw new Error("YouTube HTML search: invalid JSON");
  }

  const items: any[] = [];
  const contents =
    ytData?.contents?.twoColumnSearchResultsRenderer?.primaryContents
      ?.sectionListRenderer?.contents;
  if (!contents) return { query, items };

  for (const section of contents) {
    for (const renderer of section?.itemSectionRenderer?.contents || []) {
      const video = renderer?.videoRenderer;
      if (!video?.videoId) continue;
      items.push({
        title: video.title?.runs?.[0]?.text || "Unknown",
        id: video.videoId,
        size: "",
        duration: video.lengthText?.simpleText || "",
        channelTitle: video.ownerText?.runs?.[0]?.text || "Unknown",
        source: "yt",
      });
      if (items.length >= 10) break;
    }
    if (items.length >= 10) break;
  }

  return { query, items };
}

export async function searchSongs(query: string) {
  const errors: string[] = [];

  try {
    console.log(`[search] Trying yt-dlp for: ${query}`);
    const result = await ytdlpSearch(query);
    if (result.items.length > 0) {
      console.log(`[search] yt-dlp returned ${result.items.length} results`);
      return result;
    }
    errors.push("yt-dlp: no results");
  } catch (err: any) {
    console.log(`[search] yt-dlp failed: ${err.message}`);
    errors.push(`yt-dlp: ${err.message}`);
  }

  try {
    console.log(`[search] Trying YouTube HTML search for: ${query}`);
    const result = await youtubeHtmlSearch(query);
    if (result.items.length > 0) {
      console.log(`[search] HTML search returned ${result.items.length} results`);
      return result;
    }
    errors.push("html: no results");
  } catch (err: any) {
    console.log(`[search] HTML search failed: ${err.message}`);
    errors.push(`html: ${err.message}`);
  }

  console.log(`[search] All search methods failed: ${errors.join(" | ")}`);
  return { query, items: [] };
}

export async function checkVideo(videoId: string) {
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) throw new Error("Invalid video ID");
  try {
    const { stdout } = await execAsync(
      `yt-dlp ${ytdlpCookies()} --no-warnings --dump-json --skip-download "https://www.youtube.com/watch?v=${videoId}" 2>&1`,
      { timeout: 15000, maxBuffer: 1024 * 1024 }
    );
    const data = JSON.parse(stdout.trim());
    return { id: data.id, title: data.title, duration: data.duration, channel: data.channel || data.uploader, available: true };
  } catch {
    return { id: videoId, available: false };
  }
}

// ─── Provider 6: yt-dlp File Download (server-side, non-IP-locked) ───────────
// Downloads the file to a temp directory and returns a serveable local URL.
// This is the most reliable provider since it actually downloads server-side.

async function ytdlpFileConvert(
  videoId: string,
  format: "mp3" | "mp4"
): Promise<{ downloadUrl: string; title: string }> {
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId))
    throw new Error("ytdlp-file: invalid video ID");

  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const uuid = randomUUID();
  const ext = format === "mp3" ? "mp3" : "mp4";
  const outTemplate = path.join(TEMP_DIR, `${uuid}.%(ext)s`);
  const cookiesArg = ytdlpCookies();

  // ytdlpFile downloads the full file and merges streams with ffmpeg.
  // --no-simulate is required because --print would otherwise skip the actual download.
  const formatArg =
    format === "mp3"
      ? "bestaudio[ext=m4a]/bestaudio/best"
      : "bestvideo[height<=720]+bestaudio/best[height<=720]/bestvideo+bestaudio/best";

  const cmd = [
    `yt-dlp`,
    cookiesArg,
    `--no-warnings`,
    `--no-simulate`,
    `-f "${formatArg}"`,
    format === "mp3" ? `--extract-audio --audio-format mp3 --audio-quality 0` : `--merge-output-format mp4`,
    `--print title`,
    `-o "${outTemplate}"`,
    `"${youtubeUrl}"`,
    `2>&1`,
  ].filter(Boolean).join(" ");

  let stdout: string;
  try {
    ({ stdout } = await execAsync(cmd, { timeout: 120000 }));
  } catch (e: any) {
    throw new Error(`ytdlp-file: ${(e.stderr || e.stdout || e.message || "unknown").substring(0, 300)}`);
  }

  const lines = stdout.trim().split("\n").filter((l) => l.trim());
  const title = lines[0] || `video_${videoId}`;

  const finalPath = path.join(TEMP_DIR, `${uuid}.${ext}`);
  if (!existsSync(finalPath))
    throw new Error(`ytdlp-file: output file not found at ${finalPath}`);

  tempFiles.set(uuid, { filePath: finalPath, expiresAt: Date.now() + 30 * 60 * 1000 });

  return { downloadUrl: `local://${uuid}.${ext}`, title };
}

// ─── Title resolver ──────────────────────────────────────────────────────────

async function fetchRealTitle(videoId: string): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { headers: { "User-Agent": USER_AGENT } },
      8000
    );
    if (!res.ok) return null;
    const data = await res.json() as any;
    return data?.title || null;
  } catch {
    return null;
  }
}

// ─── Provider chain ───────────────────────────────────────────────────────────

type ConvertProvider = {
  name: string;
  fn: (videoId: string, format: "mp3" | "mp4") => Promise<{ downloadUrl: string; title: string }>;
};

const mp3Providers: ConvertProvider[] = [
  { name: "ytdlp",     fn: ytdlpConvert },
  { name: "fabdl",     fn: fabdlConvert },
  { name: "cobalt",    fn: cobaltConvert },
  { name: "piped",     fn: pipedConvert },
  { name: "y2mate",    fn: y2mateConvert },
  { name: "ytdlpFile", fn: ytdlpFileConvert },
];

// MP4 puts ytdlpFile first — it downloads the actual file server-side,
// returning a /files/ URL that is never IP-locked.
// fabdl/cobalt/piped return YouTube CDN URLs locked to their own servers' IPs,
// so the proxy cannot re-serve them. ytdlpFile avoids this entirely.
const mp4Providers: ConvertProvider[] = [
  { name: "ytdlpFile", fn: ytdlpFileConvert },
  { name: "ytdlp",     fn: ytdlpConvert },
  { name: "cobalt",    fn: cobaltConvert },
  { name: "piped",     fn: pipedConvert },
  { name: "fabdl",     fn: fabdlConvert },
  { name: "y2mate",    fn: y2mateConvert },
];

export async function getDownloadInfo(url: string, format: "mp3" | "mp4" = "mp3") {
  const videoId = extractVideoId(url);
  if (!videoId) {
    return {
      success: false,
      error: "Invalid YouTube URL. Please provide a valid YouTube video URL.",
    };
  }

  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const errors: string[] = [];

  const isFallbackTitle = (t: string) => !t || /^video_[a-zA-Z0-9_-]{11}$/.test(t) || t === "Unknown";

  const titlePromise = fetchRealTitle(videoId);

  const allProviders = format === "mp4" ? mp4Providers : mp3Providers;
  const healthyProviders = allProviders.filter((p) => isProviderHealthy(p.name));
  const unhealthy = allProviders.filter((p) => !isProviderHealthy(p.name));
  if (unhealthy.length > 0)
    console.log(`[scraper] Skipping unhealthy: ${unhealthy.map((p) => p.name).join(", ")}`);

  const orderedProviders = healthyProviders.length > 0 ? healthyProviders : allProviders;

  for (const provider of orderedProviders) {
    try {
      console.log(`[scraper] Trying provider: ${provider.name} for ${videoId} (${format})`);
      const result = await provider.fn(videoId, format);

      const isLocal = result.downloadUrl?.startsWith("local://");
      if (!isLocal && (!result.downloadUrl || !result.downloadUrl.startsWith("http"))) {
        throw new Error(`${provider.name}: empty or invalid download URL`);
      }

      const isHls =
        result.downloadUrl.includes(".m3u8") ||
        result.downloadUrl.includes("manifest");
      const audioQuality = isHls ? "128kbps (HLS stream)" : "320kbps";
      const videoQuality = provider.name === "ytdlpFile" ? "720p (server-downloaded)" : "720p";

      recordProviderSuccess(provider.name);

      let title = result.title;
      if (isFallbackTitle(title)) {
        title = (await titlePromise) || title || "Unknown";
      }

      return {
        success: true,
        title,
        videoId,
        format,
        quality: format === "mp3" ? audioQuality : videoQuality,
        downloadUrl: result.downloadUrl,
        isLocalFile: isLocal,
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        thumbnailMq: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        youtubeUrl,
        provider: provider.name,
      };
    } catch (error: any) {
      console.log(`[scraper] Provider ${provider.name} failed: ${error.message}`);
      recordProviderFailure(provider.name);
      errors.push(`${provider.name}: ${error.message}`);
    }
  }

  return {
    success: false,
    error: `All download providers failed. ${errors.join(" | ")}`,
    videoId,
  };
}

export { extractVideoId };
