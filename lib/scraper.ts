import { exec } from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";
import path from "path";

const execAsync = promisify(exec);

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
  if (_cookiesArg === null) {
    _cookiesArg = getCookiesArg();
  }
  return _cookiesArg;
}

export function reloadCookies(): void {
  _cookiesArg = null;
}

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const Y2MATE_HEADERS = {
  "accept": "*/*",
  "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
  "origin": "https://v1.y2mate.nu",
  "referer": "https://v1.y2mate.nu/",
  "save-data": "on",
  "sec-ch-ua": '"Chromium";v="137", "Not/A)Brand";v="24"',
  "sec-ch-ua-mobile": "?1",
  "sec-ch-ua-platform": '"Android"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "cross-site",
  "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
};

const Y2MATE_HTML_HEADERS = {
  "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9",
  "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
};

async function safeJsonParse(res: Response, label: string): Promise<any> {
  const text = await res.text();
  if (!text || text.trim().length === 0) {
    throw new Error(`${label}: Empty response (status ${res.status})`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label}: Invalid JSON response (status ${res.status})`);
  }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
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

  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  return null;
}

const providerHealth: Map<string, { failures: number; lastFailure: number; cooldownUntil: number }> = new Map();

const HEALTH_CONFIG = {
  maxFailures: 3,
  cooldownMs: 5 * 60 * 1000,
  resetAfterMs: 15 * 60 * 1000,
};

function isProviderHealthy(name: string): boolean {
  const health = providerHealth.get(name);
  if (!health) return true;

  if (Date.now() > health.cooldownUntil) {
    if (Date.now() - health.lastFailure > HEALTH_CONFIG.resetAfterMs) {
      providerHealth.delete(name);
    }
    return true;
  }

  return false;
}

function recordProviderFailure(name: string): void {
  const health = providerHealth.get(name) || { failures: 0, lastFailure: 0, cooldownUntil: 0 };
  health.failures++;
  health.lastFailure = Date.now();

  if (health.failures >= HEALTH_CONFIG.maxFailures) {
    health.cooldownUntil = Date.now() + HEALTH_CONFIG.cooldownMs;
    console.log(`[health] Provider ${name} disabled for ${HEALTH_CONFIG.cooldownMs / 1000}s after ${health.failures} failures`);
  }

  providerHealth.set(name, health);
}

function recordProviderSuccess(name: string): void {
  providerHealth.delete(name);
}

// ─── INNERTUBE API (YouTube's own internal API — most reliable) ───────────────
// Uses TV/embedded clients that don't require PO tokens (YouTube's new auth)

const INNERTUBE_CLIENTS = [
  {
    name: "TVHTML5_SIMPLY_EMBEDDED_PLAYER",
    clientNameId: "85",
    clientName: "TVHTML5_SIMPLY_EMBEDDED_PLAYER",
    clientVersion: "2.0",
    userAgent: USER_AGENT,
    apiKey: "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
    thirdParty: { embedUrl: "https://www.youtube.com/" },
  },
  {
    name: "WEB_EMBEDDED_PLAYER",
    clientNameId: "56",
    clientName: "WEB_EMBEDDED_PLAYER",
    clientVersion: "2.20250101.00.00",
    userAgent: USER_AGENT,
    apiKey: "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
    thirdParty: { embedUrl: "https://www.youtube.com/" },
  },
  {
    name: "TVHTML5",
    clientNameId: "7",
    clientName: "TVHTML5",
    clientVersion: "7.20250101.14.00",
    userAgent: "Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/538.1 (KHTML, like Gecko) Version/6.0 TV Safari/538.1",
    apiKey: "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
  },
];

async function innertubeConvert(videoId: string, format: "mp3" | "mp4"): Promise<{
  downloadUrl: string;
  title: string;
}> {
  const errors: string[] = [];

  for (const client of INNERTUBE_CLIENTS) {
    try {
      const context: any = {
        client: {
          clientName: client.clientName,
          clientVersion: client.clientVersion,
          hl: "en",
          gl: "US",
          utcOffsetMinutes: 0,
        },
      };

      if (client.thirdParty) {
        context.thirdParty = client.thirdParty;
      }

      const body: any = {
        videoId,
        context,
        contentCheckOk: true,
        racyCheckOk: true,
      };

      const res = await fetchWithTimeout(
        `https://www.youtube.com/youtubei/v1/player?key=${client.apiKey}&prettyPrint=false`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": client.userAgent,
            "X-Youtube-Client-Name": client.clientNameId,
            "X-Youtube-Client-Version": client.clientVersion,
            "Origin": "https://www.youtube.com",
            "Referer": "https://www.youtube.com/",
            Accept: "application/json",
          },
          body: JSON.stringify(body),
        },
        15000
      );

      if (!res.ok) {
        errors.push(`InnerTube(${client.name}): HTTP ${res.status}`);
        continue;
      }

      const data = await safeJsonParse(res, `InnerTube(${client.name})`);

      const playabilityStatus = data?.playabilityStatus?.status;
      if (playabilityStatus && playabilityStatus !== "OK") {
        errors.push(`InnerTube(${client.name}): playabilityStatus=${playabilityStatus} - ${data?.playabilityStatus?.reason || ""}`);
        continue;
      }

      const streamingData = data?.streamingData;
      if (!streamingData) {
        errors.push(`InnerTube(${client.name}): no streamingData`);
        continue;
      }

      const title = data?.videoDetails?.title || `video_${videoId}`;

      if (format === "mp3") {
        const adaptiveFormats: any[] = streamingData.adaptiveFormats || [];
        const audioFormats = adaptiveFormats
          .filter((f: any) => f.mimeType?.startsWith("audio/") && f.url)
          .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

        if (audioFormats.length > 0) {
          return { downloadUrl: audioFormats[0].url, title };
        }

        const allFormats: any[] = [...(streamingData.formats || []), ...adaptiveFormats];
        const anyAudio = allFormats.find((f: any) => f.mimeType?.includes("audio") && f.url);
        if (anyAudio) return { downloadUrl: anyAudio.url, title };
      } else {
        const formats: any[] = [
          ...(streamingData.formats || []),
          ...(streamingData.adaptiveFormats || []),
        ];

        const videoFormats = formats
          .filter((f: any) =>
            f.mimeType?.startsWith("video/mp4") &&
            f.url &&
            f.height &&
            f.height <= 480
          )
          .sort((a: any, b: any) => (b.height || 0) - (a.height || 0));

        if (videoFormats.length > 0) {
          return { downloadUrl: videoFormats[0].url, title };
        }

        const anyVideo = formats
          .filter((f: any) => f.mimeType?.startsWith("video/") && f.url)
          .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

        if (anyVideo.length > 0) {
          return { downloadUrl: anyVideo[0].url, title };
        }
      }

      errors.push(`InnerTube(${client.name}): no suitable stream found in response`);
    } catch (e: any) {
      errors.push(`InnerTube(${client.name}): ${e.message}`);
    }
  }

  throw new Error(`InnerTube: all clients failed: ${errors.join("; ")}`);
}

// ─── YT-DLP ──────────────────────────────────────────────────────────────────

async function ytdlpSearch(query: string): Promise<{ query: string; items: any[] }> {
  try {
    const sanitized = query.replace(/[^a-zA-Z0-9\s\-_.,'&!?()]/g, "").substring(0, 200);
    const cookies = ytdlpCookies();
    const { stdout } = await execAsync(
      `yt-dlp ${cookies} --no-warnings --flat-playlist --dump-json 'ytsearch10:${sanitized.replace(/'/g, "'\\''")}' 2>&1`,
      { timeout: 20000, maxBuffer: 1024 * 1024 }
    );

    const lines = stdout.trim().split("\n").filter(l => l.trim());
    const items: any[] = [];

    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        if (data.id) {
          const durationSec = data.duration || 0;
          const minutes = Math.floor(durationSec / 60);
          const seconds = durationSec % 60;
          const durationStr = `${minutes}:${String(seconds).padStart(2, "0")}`;

          const fileSizeMb = durationSec > 0 ? ((durationSec * 128 * 1000) / 8 / 1024 / 1024).toFixed(2) : "0";

          items.push({
            title: data.title || "Unknown",
            id: data.id,
            size: `${fileSizeMb} MB`,
            duration: durationStr,
            channelTitle: data.channel || data.uploader || "Unknown",
            source: "yt",
          });
        }
      } catch {
        continue;
      }
    }

    return { query, items };
  } catch (err: any) {
    throw new Error(`yt-dlp search failed: ${err.message}`);
  }
}

async function youtubeHtmlSearch(query: string): Promise<{ query: string; items: any[] }> {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const res = await fetchWithTimeout(searchUrl, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "en-US,en;q=0.9",
      Accept: "text/html",
    },
  }, 10000);

  if (!res.ok) throw new Error(`YouTube HTML search failed: status ${res.status}`);
  const html = await res.text();

  const dataMatch = html.match(/var ytInitialData\s*=\s*({[\s\S]+?});/);
  if (!dataMatch) throw new Error("YouTube HTML search: Could not parse response");

  let ytData: any;
  try {
    ytData = JSON.parse(dataMatch[1]);
  } catch {
    throw new Error("YouTube HTML search: Invalid JSON");
  }

  const items: any[] = [];
  const contents = ytData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;

  if (!contents) return { query, items };

  for (const section of contents) {
    const renderers = section?.itemSectionRenderer?.contents || [];
    for (const renderer of renderers) {
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
    console.log(`[search] Trying yt-dlp search for: ${query}`);
    const result = await ytdlpSearch(query);
    if (result.items.length > 0) {
      console.log(`[search] yt-dlp returned ${result.items.length} results`);
      return result;
    }
    errors.push("yt-dlp: no results");
  } catch (err: any) {
    console.log(`[search] yt-dlp search failed: ${err.message}`);
    errors.push(`yt-dlp: ${err.message}`);
  }

  try {
    console.log(`[search] Trying YouTube HTML search for: ${query}`);
    const result = await youtubeHtmlSearch(query);
    if (result.items.length > 0) {
      console.log(`[search] YouTube HTML returned ${result.items.length} results`);
      return result;
    }
    errors.push("YouTube HTML: no results");
  } catch (err: any) {
    console.log(`[search] YouTube HTML search failed: ${err.message}`);
    errors.push(`YouTube HTML: ${err.message}`);
  }

  console.log(`[search] All search methods failed: ${errors.join(" | ")}`);
  return { query, items: [] };
}

export async function checkVideo(videoId: string) {
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    throw new Error("Invalid video ID");
  }

  try {
    const { stdout } = await execAsync(
      `yt-dlp ${ytdlpCookies()} --no-warnings --dump-json --skip-download "https://www.youtube.com/watch?v=${videoId}" 2>&1`,
      { timeout: 15000, maxBuffer: 1024 * 1024 }
    );

    const data = JSON.parse(stdout.trim());
    return {
      id: data.id,
      title: data.title,
      duration: data.duration,
      channel: data.channel || data.uploader,
      available: true,
    };
  } catch {
    return { id: videoId, available: false };
  }
}

async function ytdlpConvert(videoId: string, format: "mp3" | "mp4"): Promise<{
  downloadUrl: string;
  title: string;
}> {
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    throw new Error("yt-dlp: Invalid video ID");
  }

  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const formatArg = format === "mp3"
    ? "bestaudio[ext=m4a]/bestaudio/best"
    : "best[height<=480][ext=mp4]/best[ext=mp4]/best";

  const cookiesArg = ytdlpCookies();
  const cmd = `yt-dlp ${cookiesArg} --no-warnings --print title -f "${formatArg}" -g "${youtubeUrl}" 2>&1`;

  let stdout: string;
  try {
    const result = await execAsync(cmd, { timeout: 30000 });
    stdout = result.stdout;
  } catch (e: any) {
    const stderr = e.stderr || e.stdout || e.message || "unknown error";
    throw new Error(`yt-dlp: Command failed: ${stderr.substring(0, 300)}`);
  }

  const lines = stdout.trim().split("\n").filter(l => l.trim());

  if (lines.length < 2) {
    throw new Error(`yt-dlp: Could not extract URL (output: ${lines.join(" | ").substring(0, 200)})`);
  }

  const title = lines[0] || `video_${videoId}`;
  const downloadUrl = lines[lines.length - 1];

  if (!downloadUrl || !downloadUrl.startsWith("http")) {
    throw new Error(`yt-dlp: No valid URL returned (got: ${downloadUrl?.substring(0, 100)})`);
  }

  return { downloadUrl, title };
}

// ─── Y2MATE ───────────────────────────────────────────────────────────────────

let y2mateAuthCache: { auth: string; paramChar: string; expiresAt: number } | null = null;

async function fetchY2MateAuth(): Promise<{ auth: string; paramChar: string }> {
  if (y2mateAuthCache && Date.now() < y2mateAuthCache.expiresAt) {
    return { auth: y2mateAuthCache.auth, paramChar: y2mateAuthCache.paramChar };
  }

  const pageRes = await fetchWithTimeout("https://v1.y2mate.nu/", {
    headers: Y2MATE_HTML_HEADERS,
  }, 10000);
  const html = await pageRes.text();

  const jsonMatch = html.match(/var json\s*=\s*JSON\.parse\('([^']+)'\)/);
  if (!jsonMatch) throw new Error("Failed to extract y2mate auth config");

  const json = JSON.parse(jsonMatch[1]);

  let auth = "";
  for (let t = 0; t < json[0].length; t++) {
    auth += String.fromCharCode(json[0][t] - json[2][json[2].length - (t + 1)]);
  }
  if (json[1]) auth = auth.split("").reverse().join("");
  if (auth.length > 32) auth = auth.substring(0, 32);

  const paramChar = String.fromCharCode(json[6]);

  y2mateAuthCache = { auth, paramChar, expiresAt: Date.now() + 4 * 60 * 1000 };

  return { auth, paramChar };
}

async function y2mateConvert(videoId: string, format: "mp3" | "mp4"): Promise<{
  downloadUrl: string;
  title: string;
}> {
  const { auth, paramChar } = await fetchY2MateAuth();
  const ts = () => Math.floor(Date.now() / 1000);

  const initRes = await fetchWithTimeout(
    `https://eta.etacloud.org/api/v1/init?${paramChar}=${encodeURIComponent(auth)}&t=${ts()}`,
    { headers: Y2MATE_HEADERS },
    10000
  );

  if (initRes.status === 429) {
    y2mateAuthCache = null;
    throw new Error("y2mate rate limited (429)");
  }

  const initData = await safeJsonParse(initRes, "y2mate init");

  if (!initData?.convertURL) {
    throw new Error("y2mate init failed or no convertURL returned");
  }

  const convertUrl = `${initData.convertURL.split("&v=")[0]}&v=${videoId}&f=${format}&t=${ts()}`;
  const convertRes = await fetchWithTimeout(convertUrl, { headers: Y2MATE_HEADERS }, 15000);

  if (convertRes.status === 429) {
    y2mateAuthCache = null;
    throw new Error("y2mate convert rate limited (429)");
  }

  const data = await safeJsonParse(convertRes, "y2mate convert");

  if (data.error !== 0 && data.error !== "0" && data.error) {
    throw new Error("y2mate convert error: " + JSON.stringify(data));
  }

  if (data.downloadURL) {
    return { downloadUrl: data.downloadURL, title: data.title || `video_${videoId}` };
  }

  if (data.progressURL) {
    const maxAttempts = 20;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const pRes = await fetchWithTimeout(`${data.progressURL}&t=${ts()}`, { headers: Y2MATE_HEADERS }, 10000);
      const p = await safeJsonParse(pRes, "y2mate progress");

      if (p.error !== 0 && p.error !== "0" && p.error) {
        throw new Error("y2mate progress error: " + JSON.stringify(p));
      }

      if (p.downloadURL) {
        return { downloadUrl: p.downloadURL, title: p.title || data.title || `video_${videoId}` };
      }
    }
    throw new Error("y2mate conversion timed out");
  }

  if (data.redirectURL) {
    const rRes = await fetchWithTimeout(data.redirectURL, { headers: Y2MATE_HEADERS }, 15000);
    const rData = await safeJsonParse(rRes, "y2mate redirect");
    if (rData.downloadURL) {
      return { downloadUrl: rData.downloadURL, title: rData.title || data.title || `video_${videoId}` };
    }
  }

  throw new Error("y2mate: no download URL found in response");
}

// ─── PIPED (open-source YouTube proxy with direct stream URLs) ────────────────

const PIPED_FALLBACK_INSTANCES = [
  "https://api.piped.private.coffee",
  "https://pipedapi.kavin.rocks",
  "https://piped-api.privacy.com.de",
  "https://api.piped.yt",
  "https://piped.video/api",
];

let pipedInstancesCache: { instances: string[]; expiresAt: number } | null = null;

async function getPipedInstances(): Promise<string[]> {
  if (pipedInstancesCache && Date.now() < pipedInstancesCache.expiresAt) {
    return pipedInstancesCache.instances;
  }

  try {
    const res = await fetchWithTimeout("https://piped-instances.kavin.rocks/", {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    }, 8000);

    if (!res.ok) throw new Error(`status ${res.status}`);

    const data = await res.json() as any[];

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
    console.log(`[piped] Failed to fetch dynamic instances: ${e.message} — using fallback list`);
  }

  pipedInstancesCache = { instances: PIPED_FALLBACK_INSTANCES, expiresAt: Date.now() + 10 * 60 * 1000 };
  return PIPED_FALLBACK_INSTANCES;
}

async function pipedConvert(videoId: string, format: "mp3" | "mp4"): Promise<{
  downloadUrl: string;
  title: string;
}> {
  const instances = await getPipedInstances();
  const errors: string[] = [];

  for (const instance of instances) {
    try {
      const res = await fetchWithTimeout(`${instance}/streams/${videoId}`, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json",
        },
      }, 12000);

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
        const audioStreams: any[] = data.audioStreams || [];
        const best = audioStreams
          .filter((s: any) => s.url && s.bitrate)
          .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0];
        if (best) return { downloadUrl: best.url, title };
      } else {
        const videoStreams: any[] = data.videoStreams || [];
        const best = videoStreams
          .filter((s: any) => s.url && s.resolution && parseInt(s.resolution) <= 480)
          .sort((a: any, b: any) => parseInt(b.resolution || "0") - parseInt(a.resolution || "0"))[0]
          || videoStreams.filter((s: any) => s.url)[0];
        if (best) return { downloadUrl: best.url, title };
      }

      errors.push(`piped(${instance}): no suitable stream in response`);
    } catch (e: any) {
      errors.push(`piped(${instance}): ${e.message}`);
    }
  }

  pipedInstancesCache = null;
  throw new Error(`Piped: all instances failed: ${errors.join("; ")}`);
}

// ─── COBALT (dynamic instances) ───────────────────────────────────────────────

let cobaltInstancesCache: { instances: string[]; expiresAt: number } | null = null;

const COBALT_FALLBACK_INSTANCES = [
  "https://cobalt-api.meowing.de",
  "https://cobalt-backend.canine.tools",
  "https://cobalt.dark-dragon.digital",
  "https://co.eepy.today",
  "https://cobalt-api.kwiatekmiki.com",
];

async function getCobaltInstances(): Promise<string[]> {
  if (cobaltInstancesCache && Date.now() < cobaltInstancesCache.expiresAt) {
    return cobaltInstancesCache.instances;
  }

  try {
    const res = await fetchWithTimeout("https://instances.cobalt.best/api/instances.json", {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    }, 8000);

    if (!res.ok) throw new Error(`status ${res.status}`);

    const data = await res.json() as any[];

    const ytInstances = data
      .filter((inst: any) =>
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
    console.log(`[cobalt] Failed to fetch dynamic instances: ${e.message} — using fallback list`);
  }

  cobaltInstancesCache = { instances: COBALT_FALLBACK_INSTANCES, expiresAt: Date.now() + 10 * 60 * 1000 };
  return COBALT_FALLBACK_INSTANCES;
}

async function cobaltConvert(videoId: string, format: "mp3" | "mp4"): Promise<{
  downloadUrl: string;
  title: string;
}> {
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
        body.videoQuality = "480";
      }

      const res = await fetchWithTimeout(instance, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": USER_AGENT,
        },
        body: JSON.stringify(body),
      }, 15000);

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
        errors.push(`${instance}: ${data.error?.code || data.text || "error"}`);
        continue;
      }

      const dlUrl = data.url || data.audio;
      if (dlUrl) {
        return { downloadUrl: dlUrl, title: data.filename || `video_${videoId}` };
      }

      if ((data.status === "tunnel" || data.status === "redirect") && data.url) {
        return { downloadUrl: data.url, title: data.filename || `video_${videoId}` };
      }

      errors.push(`${instance}: no download URL in response`);
    } catch (e: any) {
      errors.push(`${instance}: ${e.message}`);
    }
  }

  cobaltInstancesCache = null;
  throw new Error(`All Cobalt instances failed: ${errors.join("; ")}`);
}

// ─── VEVIOZ ───────────────────────────────────────────────────────────────────

async function veviozConvert(videoId: string, format: "mp3" | "mp4"): Promise<{
  downloadUrl: string;
  title: string;
}> {
  const endpoints = [
    format === "mp3"
      ? `https://api.vevioz.com/api/button/mp3/${videoId}`
      : `https://api.vevioz.com/api/button/mp4/${videoId}`,
    format === "mp3"
      ? `https://api.vevioz.com/api/widget/mp3/${videoId}`
      : `https://api.vevioz.com/api/widget/mp4/${videoId}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetchWithTimeout(endpoint, {
        headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      }, 12000);

      if (!res.ok) continue;

      const html = await res.text();

      const urlMatch = html.match(/href="(https?:\/\/[^"]+\.(?:mp3|mp4|m4a)[^"]*)"/i)
        || html.match(/href="(https?:\/\/dl[^"]+)"/i)
        || html.match(/href="(https?:\/\/[^"]*download[^"]*)"/i);

      if (!urlMatch) continue;

      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].replace(/\s*-\s*vevioz.*$/i, "").trim() : `video_${videoId}`;

      return { downloadUrl: urlMatch[1], title };
    } catch {
      continue;
    }
  }

  throw new Error("Vevioz: All endpoints failed");
}

// ─── SAVEFROM ─────────────────────────────────────────────────────────────────

async function saveFromConvert(videoId: string, format: "mp3" | "mp4"): Promise<{
  downloadUrl: string;
  title: string;
}> {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const res = await fetchWithTimeout("https://worker.sf-tools.com/savefrom.php", {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json, text/javascript, */*; q=0.01",
      Origin: "https://en.savefrom.net",
      Referer: "https://en.savefrom.net/",
    },
    body: new URLSearchParams({
      sf_url: youtubeUrl,
      sf_submit: "",
      new: "2",
      lang: "en",
      app: "",
      country: "en",
      os: "Windows",
      browser: "Chrome",
      channel: "main",
      sf_page: "https://en.savefrom.net/",
    }).toString(),
  }, 15000);

  const text = await res.text();
  if (!text || text.trim().length === 0) throw new Error("SaveFrom: empty response");

  let data: any;
  try { data = JSON.parse(text); } catch { throw new Error("SaveFrom: invalid JSON"); }

  if (Array.isArray(data) && data.length > 0) {
    const item = data[0];
    if (item.url) {
      const title = item.meta?.title || item.title || `video_${videoId}`;
      if (format === "mp3" && item.url_audio) return { downloadUrl: item.url_audio, title };
      return { downloadUrl: item.url, title };
    }
    if (item.hosting === "youtube" && item.sd?.url) {
      return { downloadUrl: format === "mp3" && item.audio?.url ? item.audio.url : item.sd.url, title: item.meta?.title || `video_${videoId}` };
    }
  }

  if (data.url) return { downloadUrl: data.url, title: data.meta?.title || `video_${videoId}` };

  throw new Error("SaveFrom: no download URL found");
}

// ─── CNVMP3 ───────────────────────────────────────────────────────────────────

async function cnvmp3Convert(videoId: string, format: "mp3" | "mp4"): Promise<{
  downloadUrl: string;
  title: string;
}> {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const res = await fetchWithTimeout(`https://api.cnvmp3.com/fetch?url=${encodeURIComponent(youtubeUrl)}`, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
      Origin: "https://cnvmp3.com",
      Referer: "https://cnvmp3.com/",
    },
  }, 15000);

  if (!res.ok) throw new Error(`cnvmp3: status ${res.status}`);

  const data = await safeJsonParse(res, "cnvmp3");

  if (data.error) throw new Error(`cnvmp3: ${data.error}`);

  const title = data.title || data.meta?.title || `video_${videoId}`;

  if (format === "mp3") {
    const audioUrl = data.audio_url || data.url?.audio || data.links?.audio;
    if (audioUrl) return { downloadUrl: audioUrl, title };
  }

  const videoUrl = data.video_url || data.url?.video || data.links?.video || data.url;
  if (videoUrl && typeof videoUrl === "string") return { downloadUrl: videoUrl, title };

  throw new Error("cnvmp3: no download URL in response");
}

// ─── PROVIDER CHAIN ───────────────────────────────────────────────────────────

type ConvertProvider = {
  name: string;
  fn: (videoId: string, format: "mp3" | "mp4") => Promise<{ downloadUrl: string; title: string }>;
};

const providers: ConvertProvider[] = [
  { name: "innertube", fn: innertubeConvert },
  { name: "piped", fn: pipedConvert },
  { name: "ytdlp", fn: ytdlpConvert },
  { name: "cobalt", fn: cobaltConvert },
  { name: "y2mate", fn: y2mateConvert },
  { name: "vevioz", fn: veviozConvert },
  { name: "savefrom", fn: saveFromConvert },
  { name: "cnvmp3", fn: cnvmp3Convert },
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

  const healthyProviders = providers.filter(p => isProviderHealthy(p.name));
  const unhealthyProviders = providers.filter(p => !isProviderHealthy(p.name));

  if (unhealthyProviders.length > 0) {
    console.log(`[scraper] Skipping unhealthy providers: ${unhealthyProviders.map(p => p.name).join(", ")}`);
  }

  const orderedProviders = healthyProviders.length > 0 ? healthyProviders : providers;

  for (const provider of orderedProviders) {
    try {
      console.log(`[scraper] Trying provider: ${provider.name} for ${videoId} (${format})`);
      const result = await provider.fn(videoId, format);

      const isHlsOrM4a = result.downloadUrl.includes(".m3u8") || result.downloadUrl.includes("manifest");
      const audioQuality = isHlsOrM4a ? "128kbps (HLS stream)" : "192kbps";

      recordProviderSuccess(provider.name);

      return {
        success: true,
        title: result.title || "Unknown",
        videoId,
        format,
        quality: format === "mp3" ? audioQuality : "360p",
        downloadUrl: result.downloadUrl,
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
