import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

export interface YandexVideoResult {
  id: string;
  pos: number;
  title: string;
  description: string;
  domain: string;
  duration: string;
  durationSeconds: number;
  thumbnail: string;
  url: string;
}

export interface YandexVideoSearchResponse {
  success: boolean;
  creator: string;
  query?: string;
  page?: number;
  count?: number;
  results?: YandexVideoResult[];
  error?: string;
}

function toAbsUrl(raw: string): string {
  if (!raw) return "";
  if (raw.startsWith("//")) return "https:" + raw;
  return raw;
}

function safeParseJson(s: string): any {
  try { return JSON.parse(s); } catch { return null; }
}

async function fetchViaProxy(targetUrl: string): Promise<string> {
  const encodedUrl = encodeURIComponent(targetUrl);
  const proxyUrl = `https://corsproxy.io/?${encodedUrl}`;
  const { stdout } = await execAsync(
    `curl -s "${proxyUrl}" -H "User-Agent: ${MOBILE_UA}" -H "Accept: application/json, text/html" -H "Accept-Language: en-US,en;q=0.9" -H "Accept-Encoding: identity" --max-time 25`,
    { maxBuffer: 10 * 1024 * 1024 }
  );
  return stdout;
}

function parseResponse(raw: string, query: string, page: number): YandexVideoSearchResponse {
  const creator = "APIs by Silent Wolf | A tech explorer";

  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON response from Yandex Videos API");
  }

  const results_obj = data?.results;
  if (!results_obj) throw new Error("No results object in Yandex Videos response");

  const serpItems: any[] = results_obj?.search?.serpItems || [];
  const clips: Record<string, any> = results_obj?.clips?.items || {};

  if (serpItems.length === 0) throw new Error("No video results found");

  const results: YandexVideoResult[] = [];

  for (let i = 0; i < serpItems.length; i++) {
    const si = serpItems[i];
    if (si.type !== "videoSnippet") continue;

    const videoId: string = si.props?.videoId;
    if (!videoId) continue;

    const clip = clips[videoId];
    if (!clip) continue;

    // Title: from relatedParams.text (the clean title)
    const title: string = clip.relatedParams?.text || "";
    if (!title) continue;

    // Description
    const description: string = clip.description || "";

    // Thumbnail
    const thumbnail = toAbsUrl(clip.preview?.posterSrc || "");

    // URL: nested in relatedParams.related (JSON string)
    let url = "";
    let domain = "";
    const relatedStr: string = clip.relatedParams?.related || "";
    if (relatedStr) {
      const relatedObj = safeParseJson(relatedStr);
      if (relatedObj?.url) {
        url = relatedObj.url;
        try {
          domain = new URL(url).hostname.replace(/^www\./, "");
        } catch {}
      }
    }

    // Duration — not in the initial response; leave blank
    const durationSeconds = 0;
    const duration = "";

    results.push({
      id: videoId,
      pos: i,
      title,
      description,
      domain,
      duration,
      durationSeconds,
      thumbnail,
      url,
    });
  }

  return { success: true, creator, query, page, count: results.length, results };
}

export async function searchYandexVideos(
  query: string,
  page = 0
): Promise<YandexVideoSearchResponse> {
  const creator = "APIs by Silent Wolf | A tech explorer";
  try {
    const targetUrl = `https://yandex.com/video/touch/search?text=${encodeURIComponent(query)}&p=${page}&format=json`;
    const raw = await fetchViaProxy(targetUrl);

    if (!raw || raw.trim().length < 100) {
      throw new Error("Empty or too-short response received from proxy");
    }

    return parseResponse(raw, query, page);
  } catch (err: any) {
    return {
      success: false,
      creator,
      error: err?.message || "Unknown error while scraping Yandex Videos",
    };
  }
}
