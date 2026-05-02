import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLoader } from "@/components/PageLoader";
import { Button } from "@/components/ui/button";
import {
  Music,
  Video,
  Copy,
  Check,
  Zap,
  Code2,
  Loader2,
  Play,
  Terminal,
  MessageSquare,
  Image,
  Camera,
  Youtube,
  Facebook,
  Music2,
  AudioLines,
  X,
  ChevronRight,
  ChevronLeft,
  Menu,
  Sparkles,
  Wand2,
  Send,
  ImagePlus,
  Eye,
  Home as HomeIcon,
  Globe,
  Shield,
  Cpu,
  ArrowUpRight,
  ArrowLeft,
  Bell,
  Cat,
  Laugh,
  Link,
  Wrench,
  ShieldCheck,
  Trophy,
  BookOpen,
  ExternalLink,
  Github,
  Search,
  Film,
  Type,
  RefreshCw,
  Headphones,
  Share2,
  ChevronDown,
  Server,
  Code,
  TrendingUp,
} from "lucide-react";
import { allEndpoints, apiCategories, ephotoEffectsList, photofuniaEffectsList, TEXTPRO_EFFECTS, AUDIO_EFFECTS_LIST, EPHOTO_SUBCATEGORIES, PHOTOFUNIA_SUBCATEGORIES, type ApiEndpoint } from "@shared/schema";
import wolfLogo from "../assets/wolf-logo.png";

type ProviderInfo = { active: boolean; label: string };
type MediaStatusData = {
  categories: Record<string, { providers: Record<string, ProviderInfo> }>;
};

const MEDIA_STATUS_CATEGORIES = ["music", "social-media", "spotify", "shazam"];

function getCategoryOverallStatus(catStatus?: { providers: Record<string, ProviderInfo> }): "green" | "yellow" | "red" | null {
  if (!catStatus) return null;
  const all = Object.values(catStatus.providers);
  const activeCount = all.filter((p) => p.active).length;
  if (activeCount === all.length) return "green";
  if (activeCount > 0) return "yellow";
  return "red";
}

function ProviderDots({ categoryId, status }: { categoryId: string; status?: MediaStatusData }) {
  const catStatus = status?.categories?.[categoryId];
  if (!catStatus) return null;
  const providers = Object.entries(catStatus.providers);
  return (
    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
      {providers.map(([key, p]) => (
        <div
          key={key}
          title={`${p.label}: ${p.active ? "Online" : "Offline"}`}
          data-testid={`status-dot-${categoryId}-${key}`}
          className="flex items-center gap-0.5"
        >
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{
              background: p.active ? "#00ff00" : "#ff4444",
              boxShadow: p.active ? "0 0 5px rgba(0,255,0,0.7)" : "none",
            }}
          />
          <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>{p.label}</span>
        </div>
      ))}
    </div>
  );
}

const categoryIcons: Record<string, typeof MessageSquare> = {
  "ai-chat": MessageSquare,
  "ai-tools": Wand2,
  "ai-image": Image,
  music: Music,
  "social-media": Share2,
  spotify: Music2,
  shazam: AudioLines,
  ephoto: Sparkles,
  photofunia: ImagePlus,
  stalker: Eye,
  anime: Cat,
  fun: Laugh,
  urlshortener: Link,
  tools: Wrench,
  security: ShieldCheck,
  sports: Trophy,
  search: Search,
  movie: Film,
  textpro: Type,
  converter: RefreshCw,
  "audio-fx": Headphones,
  economy: TrendingUp,
};

const heroData: Record<string, { tagline: string; title: string; description: string }> = {
  "ai-chat": {
    tagline: "MULTI-PROVIDER AI HUB",
    title: "35+ AI Chat Models",
    description: "GPT-4o, Claude, Mistral, Gemini, DeepSeek, LLaMA, Mixtral, WormGPT, Replit AI, and more. All through a single unified API.",
  },
  "ai-tools": {
    tagline: "AI-POWERED UTILITIES",
    title: "Smart AI Tools",
    description: "Translation, summarization, and code generation powered by advanced AI models.",
  },
  "ai-image": {
    tagline: "VISUAL AI",
    title: "AI Image Search",
    description: "Search and discover images using AI-powered visual search.",
  },
  music: {
    tagline: "MUSIC & MEDIA HUB",
    title: "15 Download Endpoints",
    description: "YouTube search, MP3/MP4 download, lyrics with synced timestamps, and trending music charts.",
  },
  "social-media": {
    tagline: "MULTI-PLATFORM DOWNLOADER",
    title: "14 Social Media Endpoints",
    description: "Download from YouTube, TikTok, Instagram, Facebook, and Twitter/X. Video, audio, reels, stories, and more.",
  },
  spotify: {
    tagline: "MUSIC STREAMING",
    title: "Spotify Tools",
    description: "Search Spotify tracks and download as high-quality MP3 files.",
  },
  shazam: {
    tagline: "MUSIC RECOGNITION",
    title: "Shazam Integration",
    description: "Search songs, recognize music from audio, and get track details.",
  },
  ephoto: {
    tagline: "TEXT EFFECTS ENGINE",
    title: `${ephotoEffectsList.length} Text Effects`,
    description: "Neon, 3D, fire, glitch, and artistic text effects via Ephoto360. Each effect is an individual GET endpoint.",
  },
  photofunia: {
    tagline: "PHOTO EFFECTS ENGINE",
    title: `${photofuniaEffectsList.length}+ Photo Effects`,
    description: "Filters, lab effects, billboards, cards, frames, faces, posters, drawings, magazines, galleries, and more via PhotoFunia.",
  },
  stalker: {
    tagline: "OSINT & PROFILE LOOKUP",
    title: "7 Stalker Tools",
    description: "GitHub, Twitter/X, Instagram, TikTok, IP geolocation, NPM, and WhatsApp channel lookup.",
  },
  anime: {
    tagline: "ANIME IMAGE & REACTION API",
    title: "30 Anime Endpoints",
    description: "Waifu, neko, shinobu, megumin, and 26+ anime reaction GIFs from waifu.pics & nekos.best.",
  },
  fun: {
    tagline: "FUN & TEXT CONTENT",
    title: "37 Fun Endpoints",
    description: "Jokes, quotes, pickup lines, roasts, compliments, trivia, dares, riddles, shayari, and more.",
  },
  urlshortener: {
    tagline: "URL SHORTENING & IMAGE HOSTING",
    title: "9 URL Services",
    description: "Shorten URLs with TinyURL, is.gd, v.gd, CleanURI, Chilp.it, clck.ru, da.gd, plus upload images to ImgBB and Catbox.",
  },
  tools: {
    tagline: "DEVELOPER & UTILITY TOOLS",
    title: "21 Tool Endpoints",
    description: "QR codes, Bible verses, dictionary, weather, passwords, Base64, hashing, UUID, and more.",
  },
  security: {
    tagline: "ETHICAL HACKING & SECURITY",
    title: "38 Security Endpoints",
    description: "DNS, WHOIS, port scanning, SSL checks, WAF detection, vulnerability scans, and OSINT tools.",
  },
  sports: {
    tagline: "LIVE SPORTS DATA API",
    title: "24 Sports Endpoints",
    description: "Live scores, fixtures, standings, team & player info, event stats, lineups, and highlights via TheSportsDB.",
  },
  search: {
    tagline: "UNIVERSAL SEARCH API",
    title: "10 Search Endpoints",
    description: "Wikipedia, news, GitHub repos, NPM packages, Stack Overflow, Reddit, Urban Dictionary, country info, and more.",
  },
  movie: {
    tagline: "MOVIE DATABASE API",
    title: "13 Movie Endpoints",
    description: "Search movies, get trailers, trending, popular, upcoming, top rated, cast & crew, reviews, and discover by genre via TMDB.",
  },
  textpro: {
    tagline: "TEXT EFFECT GENERATOR",
    title: `${TEXTPRO_EFFECTS.length} Text Effects`,
    description: "Generate stunning text effects including neon, 3D, chrome, fire, glitter, graffiti, vintage, and more styles.",
  },
  converter: {
    tagline: "WHATSAPP MEDIA CONVERTER",
    title: "6 Converter Endpoints",
    description: "Convert between images, stickers, videos, and GIFs for WhatsApp bots. Image↔Sticker, Video↔Sticker, Video↔GIF.",
  },
  "audio-fx": {
    tagline: "AUDIO EFFECTS ENGINE",
    title: `${AUDIO_EFFECTS_LIST.length} Audio Effects`,
    description: "Bass boost, robot, echo, nightcore, 8D audio, reverb, chipmunk, vaporwave, karaoke, distortion, and more. Get audio data with ready-to-use ffmpeg filter commands.",
  },
  "economy": {
    tagline: "FINANCIAL DATA API",
    title: "10 Economy Endpoints",
    description: "Live forex rates, crypto prices, stock market data, gold prices, GDP, inflation, central bank rates, financial news, and crypto wallet lookups — all in one place.",
  },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      data-testid="button-copy"
      className="p-1.5 rounded-md transition-colors"
      style={{ color: copied ? "#00ff00" : "rgba(255,255,255,0.3)" }}
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

const SYSTEM_PROMPT_PRESETS = [
  { label: "Helpful Assistant", value: "You are a helpful, friendly assistant. Answer clearly and concisely." },
  { label: "Code Expert", value: "You are an expert programmer. Write clean, well-documented code with explanations. Use best practices and modern patterns." },
  { label: "Creative Writer", value: "You are a creative writer. Write engaging, vivid, and imaginative content with rich descriptions and compelling narratives." },
  { label: "Math Tutor", value: "You are a patient math tutor. Explain mathematical concepts step-by-step, showing all work clearly. Use examples to illustrate." },
  { label: "Translator", value: "You are a professional translator. Translate text accurately while preserving tone, context, and cultural nuances." },
  { label: "Summarizer", value: "You are a concise summarizer. Provide clear, brief summaries that capture the key points and main ideas." },
  { label: "Debate Partner", value: "You are a skilled debate partner. Present well-reasoned arguments from multiple perspectives, backed by logic and evidence." },
  { label: "ELI5 (Explain Simply)", value: "You explain complex topics in simple terms that a 5-year-old could understand. Use analogies and everyday examples." },
  { label: "Storyteller", value: "You are a master storyteller. Create captivating stories with vivid characters, plot twists, and emotional depth." },
  { label: "Business Advisor", value: "You are a business advisor. Provide strategic, actionable business advice with market insights and practical recommendations." },
  { label: "Fitness Coach", value: "You are a knowledgeable fitness coach. Provide exercise routines, nutrition tips, and wellness advice tailored to individual needs." },
  { label: "Pirate Mode", value: "You are a pirate! Respond to everything in pirate speak with 'Arrr!' and nautical references. Be fun and entertaining." },
];

function TestPopup({
  endpoint,
  baseUrl,
  onClose,
}: {
  endpoint: ApiEndpoint;
  baseUrl: string;
  onClose: () => void;
}) {
  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    endpoint.params.forEach((p) => { if (p.default) defaults[p.name] = p.default; });
    return defaults;
  });
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const isAiChat = endpoint.category === "ai-chat";

  const parsedResult: any = (() => { try { return result ? JSON.parse(result) : null; } catch { return null; } })();
  const resultImageUrl: string | null = parsedResult?.url && typeof parsedResult.url === "string" && parsedResult.url.includes("image.pollinations.ai") ? parsedResult.url : null;

  const getInputValue = (name: string) => inputs[name] ?? "";

  const updateInput = (name: string, value: string) => {
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const buildPath = (basePath: string) => {
    let resolved = basePath;
    endpoint.params.forEach((p) => {
      if (inputs[p.name] && resolved.includes(`:${p.name}`)) {
        resolved = resolved.replace(`:${p.name}`, encodeURIComponent(inputs[p.name]));
      }
    });
    return resolved;
  };

  const isPathParam = (paramName: string) => endpoint.path.includes(`:${paramName}`);

  const getFullUrl = () => {
    if (endpoint.method === "POST") return `${baseUrl}${endpoint.path}`;
    const resolvedPath = buildPath(endpoint.path);
    const params = endpoint.params
      .filter((p) => inputs[p.name] && !isPathParam(p.name))
      .map((p) => `${p.name}=${encodeURIComponent(inputs[p.name])}`)
      .join("&");
    return params ? `${baseUrl}${resolvedPath}?${params}` : `${baseUrl}${resolvedPath}`;
  };

  const handleExecute = async () => {
    setLoading(true);
    setResult(null);
    try {
      let res: Response;
      if (endpoint.method === "POST") {
        const body: Record<string, string> = {};
        endpoint.params.forEach((p) => {
          if (inputs[p.name]) body[p.name] = inputs[p.name];
        });
        if (Object.keys(body).length === 0 && endpoint.params.length > 0) {
          body[endpoint.params[0].name] = "Hello!";
        }
        res = await fetch(endpoint.path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        const resolvedPath = buildPath(endpoint.path);
        const params = endpoint.params
          .filter((p) => inputs[p.name] && !isPathParam(p.name))
          .map((p) => `${p.name}=${encodeURIComponent(inputs[p.name])}`)
          .join("&");
        res = await fetch(`${resolvedPath}${params ? `?${params}` : ""}`);
      }
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResult(JSON.stringify({ error: err.message }, null, 2));
    }
    setLoading(false);
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 200, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      data-testid="popup-test-overlay"
    >
      <div
        className="w-full max-w-2xl rounded-xl overflow-hidden"
        style={{
          background: "#000000",
          border: "1px solid rgba(0,255,0,0.2)",
          maxHeight: "90vh",
        }}
        data-testid="popup-test-content"
      >
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid rgba(0,255,0,0.1)" }}
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4" style={{ color: "#00ff00" }} />
            <span className="text-sm font-bold tracking-wider" style={{ color: "#ffffff", fontFamily: "'Orbitron', sans-serif" }}>
              API TESTER
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: "rgba(255,255,255,0.4)" }}
            data-testid="button-close-popup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 52px)" }}>
          <div className="px-5 py-4 space-y-4">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span
                className="font-mono text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0"
                style={{
                  background: endpoint.method === "POST" ? "rgba(59,130,246,0.12)" : "rgba(0,255,0,0.12)",
                  color: endpoint.method === "POST" ? "#60a5fa" : "#00ff00",
                  border: endpoint.method === "POST" ? "1px solid rgba(59,130,246,0.2)" : "1px solid rgba(0,255,0,0.2)",
                }}
              >
                {endpoint.method}
              </span>
              <code className="text-sm font-mono break-all min-w-0" style={{ color: "#ffffff" }}>
                {endpoint.path}
              </code>
              {endpoint.provider && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded ml-auto"
                  style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)" }}
                >
                  {endpoint.provider}
                </span>
              )}
            </div>

            <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
              {endpoint.description}
            </p>

            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono"
              style={{ background: "rgba(0,255,0,0.03)", border: "1px solid rgba(0,255,0,0.1)" }}
            >
              <span style={{ color: "rgba(255,255,255,0.3)" }} className="flex-1 truncate" data-testid="text-full-url">
                {getFullUrl()}
              </span>
              <CopyButton text={getFullUrl()} />
            </div>

            {endpoint.params.length > 0 && (
              <div className="space-y-3">
                <span className="text-[10px] font-semibold tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
                  PARAMETERS
                </span>
                {endpoint.params.map((p) => (
                  <div key={p.name} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <code
                        className="font-mono px-1.5 py-0.5 rounded text-[11px]"
                        style={{ background: "rgba(0,255,0,0.06)", color: "#00ff00", border: "1px solid rgba(0,255,0,0.15)" }}
                      >
                        {p.name}
                      </code>
                      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                        {p.type}
                      </span>
                      {p.required && (
                        <span className="text-[9px] font-bold" style={{ color: "#ff4444" }}>
                          REQ
                        </span>
                      )}
                      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {p.description}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={getInputValue(p.name)}
                      onChange={(e) => updateInput(p.name, e.target.value)}
                      placeholder={p.default || p.description}
                      className="w-full px-3 py-2 rounded-lg text-sm font-mono outline-none transition-colors"
                      style={{
                        background: "#0a0a0a",
                        border: "1px solid rgba(0,255,0,0.12)",
                        color: "#ffffff",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,255,0,0.4)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(0,255,0,0.12)")}
                      data-testid={`input-${p.name}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleExecute();
                      }}
                    />
                    {isAiChat && p.name === "system" && (
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>
                            PRESET PROMPTS
                          </span>
                          <div className="flex-1 h-px" style={{ background: "rgba(0,255,0,0.08)" }} />
                        </div>
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) updateInput("system", e.target.value);
                          }}
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
                          style={{
                            background: "#0a0a0a",
                            border: "1px solid rgba(0,255,0,0.12)",
                            color: "#ffffff",
                            appearance: "none",
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2300ff00' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "right 12px center",
                            paddingRight: "2rem",
                          }}
                          data-testid="select-system-preset"
                        >
                          <option value="" style={{ background: "#0a0a0a" }}>Select a preset...</option>
                          {SYSTEM_PROMPT_PRESETS.map((preset) => (
                            <option key={preset.label} value={preset.value} style={{ background: "#0a0a0a" }}>
                              {preset.label}
                            </option>
                          ))}
                        </select>
                        <div className="flex flex-wrap gap-1.5">
                          {SYSTEM_PROMPT_PRESETS.slice(0, 6).map((preset) => (
                            <button
                              key={preset.label}
                              onClick={() => updateInput("system", preset.value)}
                              className="px-2 py-1 rounded text-[10px] transition-colors"
                              style={{
                                background: inputs.system === preset.value ? "rgba(0,255,0,0.12)" : "rgba(255,255,255,0.03)",
                                border: inputs.system === preset.value ? "1px solid rgba(0,255,0,0.3)" : "1px solid rgba(255,255,255,0.06)",
                                color: inputs.system === preset.value ? "#00ff00" : "rgba(255,255,255,0.4)",
                              }}
                              data-testid={`button-preset-${preset.label.toLowerCase().replace(/\s+/g, "-")}`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleExecute}
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-bold tracking-wider transition-all"
              style={{
                background: "transparent",
                border: "1px solid #00ff00",
                color: "#00ff00",
                opacity: loading ? 0.6 : 1,
              }}
              data-testid="button-execute"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Executing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" /> Execute Request
                </span>
              )}
            </button>

            {result && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
                    RESPONSE
                  </span>
                  <CopyButton text={result} />
                </div>
                {resultImageUrl && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-semibold tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
                      IMAGE PREVIEW
                    </span>
                    <div
                      className="rounded-lg overflow-hidden flex items-center justify-center"
                      style={{ border: "1px solid rgba(0,255,0,0.2)", background: "#0a0a0a", minHeight: "120px" }}
                    >
                      <img
                        src={resultImageUrl}
                        alt="AI Generated"
                        className="w-full object-contain"
                        style={{ maxHeight: "320px" }}
                        data-testid="img-generated-result"
                      />
                    </div>
                    <a
                      href={resultImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-mono transition-opacity hover:opacity-80"
                      style={{ color: "#00ff00" }}
                      data-testid="link-open-image"
                    >
                      OPEN FULL SIZE ↗
                    </a>
                  </div>
                )}
                <pre
                  className="text-xs font-mono p-4 rounded-lg overflow-auto"
                  style={{
                    background: "#0a0a0a",
                    border: "1px solid rgba(0,255,0,0.12)",
                    color: "#00ff00",
                    maxHeight: "300px",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                  data-testid="text-response"
                >
                  {result}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EndpointCard({
  endpoint,
  onTry,
}: {
  endpoint: ApiEndpoint;
  onTry: (ep: ApiEndpoint) => void;
}) {
  return (
    <div
      data-testid={`card-endpoint-${endpoint.path}`}
      className="relative rounded-lg p-4 space-y-3 transition-all cursor-pointer group"
      style={{
        background: "#000000",
        border: "1px solid rgba(0,255,0,0.12)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(0,255,0,0.35)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(0,255,0,0.12)";
      }}
      onClick={() => onTry(endpoint)}
    >
      <ArrowUpRight
        className="absolute top-3 right-3 w-3.5 h-3.5 transition-opacity"
        style={{ color: "rgba(0,255,0,0.3)" }}
      />
      <div className="flex items-center gap-2 flex-wrap pr-6 overflow-hidden">
        <span
          className="font-mono text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0"
          style={{
            background: endpoint.method === "POST" ? "rgba(59,130,246,0.1)" : "rgba(0,255,0,0.1)",
            color: endpoint.method === "POST" ? "#60a5fa" : "#00ff00",
            border: endpoint.method === "POST" ? "1px solid rgba(59,130,246,0.2)" : "1px solid rgba(0,255,0,0.2)",
          }}
        >
          {endpoint.method}
        </span>
        <code className="text-sm font-mono truncate min-w-0" style={{ color: "#ffffff" }}>
          {endpoint.path}
        </code>
      </div>
      {endpoint.provider && (
        <span
          className="text-[10px] px-1.5 py-0.5 rounded"
          style={{ background: "rgba(0,255,0,0.06)", color: "rgba(0,255,0,0.5)", border: "1px solid rgba(0,255,0,0.1)" }}
        >
          {endpoint.provider}
        </span>
      )}
      <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
        {endpoint.description}
      </p>
    </div>
  );
}

function EffectTable({
  endpoints,
  onTry,
}: {
  endpoints: ApiEndpoint[];
  onTry: (ep: ApiEndpoint) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid rgba(0,255,0,0.12)", background: "#000000" }}>
      <table className="w-full text-left" style={{ minWidth: "600px" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(0,255,0,0.12)" }}>
            <th className="px-4 py-3 text-[10px] font-bold tracking-wider" style={{ color: "#00ff00", width: "50px" }}>SN</th>
            <th className="px-4 py-3 text-[10px] font-bold tracking-wider" style={{ color: "#00ff00" }}>ENDPOINT</th>
            <th className="px-4 py-3 text-[10px] font-bold tracking-wider hidden sm:table-cell" style={{ color: "#00ff00" }}>DESCRIPTION</th>
            <th className="px-4 py-3 text-[10px] font-bold tracking-wider hidden md:table-cell" style={{ color: "#00ff00" }}>REQUIRED</th>
            <th className="px-4 py-3 text-[10px] font-bold tracking-wider hidden lg:table-cell" style={{ color: "#00ff00", width: "80px" }}>STATUS</th>
            <th className="px-4 py-3 text-[10px] font-bold tracking-wider" style={{ color: "#00ff00", width: "80px" }}>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {endpoints.map((ep, index) => {
            const name = ep.path.split("/").pop() || ep.path;
            const effectName = ep.description.replace(/^Generate\s+/, "").replace(/\s+via\s+.*$/, "");
            return (
              <tr
                key={ep.path}
                className="transition-colors cursor-pointer"
                style={{ borderBottom: "1px solid rgba(0,255,0,0.06)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,255,0,0.03)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                onClick={() => onTry(ep)}
                data-testid={`row-effect-${name}`}
              >
                <td className="px-4 py-3">
                  <span className="text-sm font-bold" style={{ color: "#00ff00" }}>{index + 1}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <span className="text-sm font-bold block" style={{ color: "#ffffff" }}>{effectName}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(0,255,0,0.1)", color: "#00ff00", border: "1px solid rgba(0,255,0,0.15)" }}>
                        GET
                      </span>
                      <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.15)" }}>
                        JSON
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{ep.description}</span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {ep.params.map(p => p.name).join(", ")}
                  </span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full" style={{ background: "rgba(0,255,0,0.08)", color: "#00ff00", border: "1px solid rgba(0,255,0,0.15)" }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#00ff00" }} />
                    Active
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    className="text-[10px] font-bold px-3 py-1.5 rounded-md transition-colors"
                    style={{
                      background: "transparent",
                      color: "#00ff00",
                      border: "1px solid rgba(0,255,0,0.25)",
                    }}
                    onClick={(e) => { e.stopPropagation(); onTry(ep); }}
                    data-testid={`button-test-${name}`}
                  >
                    <Zap className="w-3 h-3 inline mr-1" />
                    Test
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface SiteCard { id: string; name: string; url: string; description: string; badge: string; display: string; icon: string; }
interface SiteConfig { githubUrl: string; cards: SiteCard[]; }

const DEFAULT_CARDS: SiteCard[] = [
  { id: "wolfxcore", name: "wolfXcore", url: "https://github.com/SilentWolf-Kenya/wolfXcore", description: "Cyberpunk game server panel — Paystack/M-Pesa billing & auto-provisioning", badge: "Laravel + React", display: "github.com/SilentWolf-Kenya/wolfXcore", icon: "github" },
  { id: "panel", name: "panel.xwolf.space", url: "https://panel.xwolf.space", description: "Host, manage and provision game servers with automated billing", badge: "GAME SERVER", display: "panel.xwolf.space", icon: "cpu" },
  { id: "host", name: "host.xwolf.space", url: "https://host.xwolf.space", description: "One-click deployment platform for chatbots and automation scripts", badge: "BOT HOSTING", display: "host.xwolf.space", icon: "globe" },
];

let _cachedConfig: SiteConfig | null = null;

async function fetchSiteConfig(): Promise<SiteConfig> {
  if (_cachedConfig) return _cachedConfig;
  try {
    const r = await fetch("/api/config/cards");
    if (r.ok) {
      const d = await r.json();
      _cachedConfig = { githubUrl: d.githubUrl || "https://github.com/SilentWolf-Kenya", cards: d.cards || DEFAULT_CARDS };
      return _cachedConfig!;
    }
  } catch {}
  return { githubUrl: "https://github.com/SilentWolf-Kenya", cards: DEFAULT_CARDS };
}

function CardIcon({ icon }: { icon: string }) {
  if (icon === "github") return <Github className="w-4 h-4" style={{ color: "#00ff00" }} />;
  if (icon === "cpu") return <Cpu className="w-4 h-4" style={{ color: "#00ff00" }} />;
  if (icon === "server") return <Server className="w-4 h-4" style={{ color: "#00ff00" }} />;
  if (icon === "zap") return <Zap className="w-4 h-4" style={{ color: "#00ff00" }} />;
  if (icon === "code") return <Code className="w-4 h-4" style={{ color: "#00ff00" }} />;
  return <Globe className="w-4 h-4" style={{ color: "#00ff00" }} />;
}

function WelcomePage({ onCategoryClick, onTryEndpoint, mediaStatus }: { onCategoryClick: (id: string) => void; onTryEndpoint: (ep: ApiEndpoint) => void; mediaStatus?: MediaStatusData }) {
  const [globalSearch, setGlobalSearch] = useState("");
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({ githubUrl: "https://github.com/SilentWolf-Kenya", cards: DEFAULT_CARDS });
  useEffect(() => { fetchSiteConfig().then(setSiteConfig); }, []);

  const quickStats = [
    { label: "ENDPOINTS", value: String(allEndpoints.length) + "+", icon: Globe },
    { label: "AI MODELS", value: "35+", icon: Cpu },
    { label: "CATEGORIES", value: String(apiCategories.length), icon: Zap },
    { label: "AUDIO FX", value: String(AUDIO_EFFECTS_LIST.length), icon: Headphones },
  ];

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 space-y-8 max-w-6xl">

      {/* Dashboard header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full" style={{ background: "#00ff00", boxShadow: "0 0 6px rgba(0,255,0,0.5)" }} />
            <span className="text-[10px] font-bold tracking-[0.25em]" style={{ color: "rgba(0,255,0,0.65)" }}>ALL SYSTEMS LIVE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black mb-1.5" style={{ fontFamily: "'Orbitron', sans-serif", color: "#ffffff" }} data-testid="text-hero-title">
            API Explorer
          </h2>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
            {allEndpoints.length}+ free endpoints — no registration, no keys.
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2 flex-shrink-0">
          {quickStats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="flex flex-col items-center justify-center px-3 py-2.5 rounded-xl"
                style={{ background: "#060606", border: "1px solid rgba(0,255,0,0.1)", minWidth: "62px" }}
                data-testid={"stat-" + s.label.toLowerCase().replace(/\s+/g, "-")}
              >
                <Icon className="w-3.5 h-3.5 mb-1" style={{ color: "rgba(0,255,0,0.45)" }} />
                <span className="text-sm font-black leading-none" style={{ fontFamily: "'Orbitron', sans-serif", color: "#00ff00" }}>{s.value}</span>
                <span className="text-[8px] tracking-widest mt-1 text-center leading-tight" style={{ color: "rgba(255,255,255,0.25)" }}>{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <EndpointSearchBar
        endpoints={allEndpoints}
        searchQuery={globalSearch}
        setSearchQuery={setGlobalSearch}
        onSelectEndpoint={onTryEndpoint}
        placeholder={"Search " + allEndpoints.length + "+ endpoints… (e.g. neon, translate, tiktok, mp3)"}
      />

      {/* Categories */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] font-bold tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.28)", fontFamily: "'Orbitron', sans-serif" }}>CATEGORIES</span>
          <div className="flex-1 h-px" style={{ background: "rgba(0,255,0,0.06)" }} />
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(0,255,0,0.05)", color: "rgba(0,255,0,0.5)", border: "1px solid rgba(0,255,0,0.1)" }}>
            {apiCategories.length} total
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {apiCategories.map((cat) => {
            const Icon = categoryIcons[cat.id] || Code2;
            const count = allEndpoints.filter(e => e.category === cat.id).length;
            return (
              <button
                key={cat.id}
                className="group relative text-left rounded-xl p-4 transition-all"
                style={{ background: "#050505", border: "1px solid rgba(0,255,0,0.08)" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,255,0,0.28)"; e.currentTarget.style.background = "rgba(0,255,0,0.02)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(0,255,0,0.08)"; e.currentTarget.style.background = "#050505"; }}
                onClick={() => onCategoryClick(cat.id)}
                data-testid={"card-category-" + cat.id}
              >
                <div className="flex items-start gap-3 mb-2.5">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(0,255,0,0.06)", border: "1px solid rgba(0,255,0,0.11)" }}
                  >
                    <Icon className="w-4 h-4" style={{ color: "#00ff00" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold block leading-tight" style={{ color: "#ffffff" }}>{cat.name}</span>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block"
                      style={{ background: "rgba(0,255,0,0.05)", color: "rgba(0,255,0,0.55)", border: "1px solid rgba(0,255,0,0.1)" }}
                    >
                      {count} endpoints
                    </span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity mt-0.5" style={{ color: "#00ff00" }} />
                </div>
                <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: "rgba(255,255,255,0.28)" }}>
                  {cat.description}
                </p>
                {MEDIA_STATUS_CATEGORIES.includes(cat.id) && (
                  <ProviderDots categoryId={cat.id} status={mediaStatus} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
function HeroSection({ categoryId }: { categoryId: string }) {
  const data = heroData[categoryId];
  if (!data) return null;
  const Icon = categoryIcons[categoryId] || Zap;
  const count = allEndpoints.filter(e => e.category === categoryId).length;
  return (
    <section className="px-4 pt-4 pb-1 sm:px-8 sm:pt-6">
      <div
        className="rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4"
        style={{ background: "#050505", border: "1px solid rgba(0,255,0,0.1)" }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(0,255,0,0.07)", border: "1px solid rgba(0,255,0,0.13)" }}
        >
          <Icon className="w-6 h-6" style={{ color: "#00ff00" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold tracking-[0.2em]" style={{ color: "rgba(0,255,0,0.6)" }}>
              {data.tagline}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold leading-tight" style={{ fontFamily: "'Orbitron', sans-serif", color: "#ffffff" }}>
            {data.title}
          </h3>
          <p className="text-[12px] mt-1 max-w-xl" style={{ color: "rgba(255,255,255,0.32)" }}>
            {data.description}
          </p>
        </div>
        <div
          className="flex-shrink-0 px-4 py-2.5 rounded-lg text-center"
          style={{ background: "rgba(0,255,0,0.04)", border: "1px solid rgba(0,255,0,0.1)" }}
        >
          <div className="text-2xl font-black" style={{ fontFamily: "'Orbitron', sans-serif", color: "#00ff00" }}>{count}</div>
          <div className="text-[9px] tracking-widest mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>ENDPOINTS</div>
        </div>
      </div>
    </section>
  );
}

function DocSection({ label, icon: Icon }: { label: string; icon: typeof MessageSquare }) {
  return (
    <div className="flex items-center gap-2 mb-4 mt-10 first:mt-0">
      <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#00ff00" }} />
      <span className="text-[10px] font-bold tracking-[0.2em]" style={{ color: "#00ff00", fontFamily: "'Orbitron', sans-serif" }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: "rgba(0,255,0,0.08)" }} />
    </div>
  );
}

function InlineCode({ children }: { children: string | number }) {
  return (
    <code className="text-[11px] px-1.5 py-0.5 rounded font-mono" style={{ background: "rgba(0,255,0,0.08)", color: "#00ff00", border: "1px solid rgba(0,255,0,0.12)" }}>
      {children}
    </code>
  );
}

function DocumentationPage({ onNavigateToCategory }: { onNavigateToCategory?: (catId: string) => void }) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({ githubUrl: "https://github.com/SilentWolf-Kenya", cards: DEFAULT_CARDS });
  useEffect(() => { fetchSiteConfig().then(setSiteConfig); }, []);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://apis.xwolf.space";

  const rateLimits = [
    { scope: "Global", limit: "300 requests", window: "15 minutes", applies: "All endpoints, per IP" },
    { scope: "Downloads", limit: "20 requests", window: "1 minute", applies: "/api/download/*, /download/*" },
    { scope: "Admin", limit: "30 requests", window: "5 minutes", applies: "/api/admin/*" },
    { scope: "Login", limit: "5 attempts", window: "15 minutes", applies: "/api/admin/login" },
    { scope: "API", limit: "80 requests", window: "1 minute", applies: "General API endpoints" },
  ];

  const errorCodes = [
    { code: "200", color: "#00ff00", meaning: "OK", detail: "Request succeeded. Check success field in body." },
    { code: "400", color: "#ffa500", meaning: "Bad Request", detail: "Missing or invalid parameters. Check the error field." },
    { code: "403", color: "#ff6464", meaning: "Forbidden", detail: "IP is blocked or User-Agent is a known scanner tool." },
    { code: "404", color: "#ff6464", meaning: "Not Found", detail: "Endpoint does not exist or resource was not found." },
    { code: "429", color: "#ff6464", meaning: "Too Many Requests", detail: "Rate limit hit. Wait for the window to reset." },
    { code: "500", color: "#ff6464", meaning: "Server Error", detail: "Upstream provider failed. Try again or use a different provider." },
  ];

  const [exampleLang, setExampleLang] = useState<"curl" | "python" | "js">("curl");

  const quickExamples = [
    {
      label: "Get a random joke",
      method: "GET",
      path: "/api/fun/jokes",
      curl: `curl "${baseUrl}/api/fun/jokes"`,
      python: `import requests\n\nr = requests.get("${baseUrl}/api/fun/jokes")\nprint(r.json())`,
      js: `fetch("${baseUrl}/api/fun/jokes")\n  .then(r => r.json())\n  .then(data => console.log(data))`,
    },
    {
      label: "Download TikTok video",
      method: "GET",
      path: "/api/tiktok",
      curl: `curl "${baseUrl}/api/tiktok?url=https://vm.tiktok.com/example"`,
      python: `import requests\n\nparams = {"url": "https://vm.tiktok.com/example"}\nr = requests.get("${baseUrl}/api/tiktok", params=params)\nprint(r.json())`,
      js: `const params = new URLSearchParams({\n  url: "https://vm.tiktok.com/example"\n})\nfetch(\`${baseUrl}/api/tiktok?\${params}\`)\n  .then(r => r.json())\n  .then(data => console.log(data))`,
    },
    {
      label: "Search YouTube music",
      method: "GET",
      path: "/api/search",
      curl: `curl "${baseUrl}/api/search?q=blinding+lights"`,
      python: `import requests\n\nparams = {"q": "blinding lights"}\nr = requests.get("${baseUrl}/api/search", params=params)\nprint(r.json())`,
      js: `const params = new URLSearchParams({\n  q: "blinding lights"\n})\nfetch(\`${baseUrl}/api/search?\${params}\`)\n  .then(r => r.json())\n  .then(data => console.log(data))`,
    },
    {
      label: "Chat with AI",
      method: "GET",
      path: "/api/ai/gpt",
      curl: `curl "${baseUrl}/api/ai/gpt?q=What+is+the+speed+of+light"`,
      python: `import requests\n\nparams = {"q": "What is the speed of light"}\nr = requests.get("${baseUrl}/api/ai/gpt", params=params)\nprint(r.json())`,
      js: `const params = new URLSearchParams({\n  q: "What is the speed of light"\n})\nfetch(\`${baseUrl}/api/ai/gpt?\${params}\`)\n  .then(r => r.json())\n  .then(data => console.log(data))`,
    },
    {
      label: "AI text translation (POST)",
      method: "POST",
      path: "/api/ai/translate",
      curl: `curl -X POST "${baseUrl}/api/ai/translate" \\\n  -H "Content-Type: application/json" \\\n  -d '{"text":"Hello world","to":"sw"}'`,
      python: `import requests\n\nbody = {"text": "Hello world", "to": "sw"}\nr = requests.post(\n    "${baseUrl}/api/ai/translate",\n    json=body\n)\nprint(r.json())`,
      js: `fetch("${baseUrl}/api/ai/translate", {\n  method: "POST",\n  headers: {"Content-Type": "application/json"},\n  body: JSON.stringify({\n    text: "Hello world",\n    to: "sw"\n  })\n})\n  .then(r => r.json())\n  .then(data => console.log(data))`,
    },
  ];

  const communityLinks = [
    {
      title: "WhatsApp Group",
      description: "Join for support, updates, and community discussions",
      url: "https://chat.whatsapp.com/HjFc3pud3IA0R0WGr1V2Xu",
      icon: MessageSquare,
      color: "#25D366",
    },
    {
      title: "WhatsApp Channel",
      description: "Follow for API announcements and release notes",
      url: "https://whatsapp.com/channel/0029Vb7Kd0h6GcGN1k8WYE0c",
      icon: Bell,
      color: "#25D366",
    },
    {
      title: "GitHub",
      description: "Browse source code, open issues, and contribute",
      url: "https://github.com/SilentWolf-Kenya",
      icon: Code2,
      color: "#ffffff",
    },
  ];

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-3xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4" style={{ color: "#00ff00" }} />
          <span className="text-[10px] font-bold tracking-[0.2em]" style={{ color: "#00ff00", fontFamily: "'Orbitron', sans-serif" }}>
            API DOCUMENTATION
          </span>
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "#ffffff", fontFamily: "'Orbitron', sans-serif" }} data-testid="text-docs-title">
          WolfAPIs Docs
        </h2>
        <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>
          Free, no-auth REST APIs for music, AI, social media, image effects, and more. Built by Silent Wolf.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: `${allEndpoints.length}+ Endpoints` },
            { label: `${apiCategories.length} Categories` },
            { label: "No API Key" },
            { label: "Free Forever" },
          ].map((tag) => (
            <span key={tag.label} className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(0,255,0,0.07)", color: "#00ff00", border: "1px solid rgba(0,255,0,0.15)" }}>
              {tag.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Getting Started ── */}
      <DocSection label="GETTING STARTED" icon={Zap} />

      <div className="rounded-xl overflow-hidden mb-6" style={{ border: "1px solid rgba(0,255,0,0.1)" }}>
        <div className="px-4 py-3" style={{ background: "#000000", borderBottom: "1px solid rgba(0,255,0,0.06)" }}>
          <span className="text-[10px] font-bold tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>BASE URL</span>
        </div>
        <div className="px-4 py-3 flex items-center gap-3" style={{ background: "rgba(0,255,0,0.02)" }}>
          <code className="text-sm font-mono flex-1" style={{ color: "#00ff00" }}>{baseUrl}</code>
          <CopyButton text={baseUrl} />
        </div>
      </div>

      <div className="rounded-xl p-4 mb-6 space-y-3" style={{ background: "#000000", border: "1px solid rgba(0,255,0,0.1)" }}>
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(0,255,0,0.1)" }}>
            <ShieldCheck className="w-3 h-3" style={{ color: "#00ff00" }} />
          </div>
          <div>
            <p className="text-xs font-semibold mb-0.5" style={{ color: "#ffffff" }}>No Authentication Required</p>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
              All public endpoints are open — no API key, no token, no sign-up. Just send requests directly.
              Automated scan tools (sqlmap, nikto, etc.) and empty User-Agents are blocked for security.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(0,255,0,0.1)" }}>
            <Globe className="w-3 h-3" style={{ color: "#00ff00" }} />
          </div>
          <div>
            <p className="text-xs font-semibold mb-0.5" style={{ color: "#ffffff" }}>CORS Enabled</p>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
              All endpoints support cross-origin requests. You can call them directly from a browser frontend or any HTTP client.
            </p>
          </div>
        </div>
      </div>

      {/* ── Response Format ── */}
      <DocSection label="RESPONSE FORMAT" icon={Code} />

      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,255,0,0.1)" }}>
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "#000000", borderBottom: "1px solid rgba(0,255,0,0.06)" }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#00ff00" }} />
            <span className="text-[10px] font-bold tracking-wider" style={{ color: "#00ff00" }}>SUCCESS</span>
          </div>
          <pre className="px-4 py-3 text-[11px] font-mono overflow-x-auto" style={{ background: "rgba(0,255,0,0.02)", color: "rgba(255,255,255,0.5)" }}>
{`{
  "success": true,
  "creator": "APIs by Silent Wolf",
  "result": { ... }
}`}
          </pre>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,100,100,0.12)" }}>
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "#000000", borderBottom: "1px solid rgba(255,100,100,0.08)" }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#ff6464" }} />
            <span className="text-[10px] font-bold tracking-wider" style={{ color: "#ff6464" }}>ERROR</span>
          </div>
          <pre className="px-4 py-3 text-[11px] font-mono overflow-x-auto" style={{ background: "rgba(255,100,100,0.02)", color: "rgba(255,255,255,0.5)" }}>
{`{
  "success": false,
  "error": "Description of what failed",
  "creator": "APIs by Silent Wolf"
}`}
          </pre>
        </div>
      </div>

      <p className="text-[11px] mb-6" style={{ color: "rgba(255,255,255,0.3)" }}>
        Always check the <InlineCode>success</InlineCode> field first. When <InlineCode>false</InlineCode>, read <InlineCode>error</InlineCode> for the reason. The <InlineCode>creator</InlineCode> field is present on every response.
      </p>

      {/* ── Quick Examples ── */}
      <DocSection label="QUICK EXAMPLES" icon={Terminal} />

      {/* Language tab selector */}
      <div className="flex items-center gap-1 mb-4 p-1 rounded-lg w-fit" style={{ background: "rgba(0,255,0,0.04)", border: "1px solid rgba(0,255,0,0.1)" }}>
        {(["curl", "python", "js"] as const).map((lang) => (
          <button
            key={lang}
            onClick={() => setExampleLang(lang)}
            className="px-3 py-1 rounded-md text-[10px] font-bold tracking-wider transition-all"
            style={{
              background: exampleLang === lang ? "rgba(0,255,0,0.15)" : "transparent",
              color: exampleLang === lang ? "#00ff00" : "rgba(255,255,255,0.35)",
              border: exampleLang === lang ? "1px solid rgba(0,255,0,0.25)" : "1px solid transparent",
            }}
            data-testid={`btn-example-lang-${lang}`}
          >
            {lang === "curl" ? "cURL" : lang === "python" ? "Python" : "JavaScript"}
          </button>
        ))}
      </div>

      <div className="space-y-3 mb-6">
        {quickExamples.map((ex, i) => {
          const code = exampleLang === "curl" ? ex.curl : exampleLang === "python" ? ex.python : ex.js;
          return (
            <div key={i} className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,255,0,0.08)" }}>
              <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "#000000", borderBottom: "1px solid rgba(0,255,0,0.05)" }}>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: ex.method === "POST" ? "rgba(255,165,0,0.12)" : "rgba(0,255,0,0.12)", color: ex.method === "POST" ? "#ffa500" : "#00ff00" }}
                >
                  {ex.method}
                </span>
                <code className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.7)" }}>{ex.path}</code>
                <span className="text-[10px] ml-auto" style={{ color: "rgba(255,255,255,0.25)" }}>{ex.label}</span>
              </div>
              <div className="px-4 py-3 flex items-start gap-3" style={{ background: "rgba(0,255,0,0.015)" }}>
                <pre className="text-[11px] font-mono flex-1 overflow-x-auto whitespace-pre" style={{ color: "rgba(255,255,255,0.5)", lineHeight: "1.6" }}>{code}</pre>
                <CopyButton text={code} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Rate Limits ── */}
      <DocSection label="RATE LIMITS" icon={Zap} />

      <div className="rounded-xl overflow-hidden mb-6" style={{ border: "1px solid rgba(0,255,0,0.1)" }}>
        <div className="px-4 py-3 grid grid-cols-3 gap-2" style={{ background: "#000000", borderBottom: "1px solid rgba(0,255,0,0.06)" }}>
          {["Scope", "Limit", "Applies To"].map(h => (
            <span key={h} className="text-[9px] font-bold tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>{h}</span>
          ))}
        </div>
        {rateLimits.map((r, i) => (
          <div
            key={i}
            className="px-4 py-2.5 grid grid-cols-3 gap-2 items-center"
            style={{ background: i % 2 === 0 ? "rgba(0,255,0,0.015)" : "transparent", borderTop: i > 0 ? "1px solid rgba(0,255,0,0.04)" : "none" }}
          >
            <span className="text-[11px] font-semibold" style={{ color: "#ffffff" }}>{r.scope}</span>
            <div>
              <span className="text-[11px] font-mono" style={{ color: "#00ff00" }}>{r.limit}</span>
              <span className="text-[10px] ml-1" style={{ color: "rgba(255,255,255,0.3)" }}>/ {r.window}</span>
            </div>
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{r.applies}</span>
          </div>
        ))}
      </div>

      <p className="text-[11px] mb-6" style={{ color: "rgba(255,255,255,0.3)" }}>
        Limits are per IP address. Exceeding a limit returns HTTP <InlineCode>429</InlineCode> with a <InlineCode>Retry-After</InlineCode> header. All counters reset when the window expires.
      </p>

      {/* ── Error Reference ── */}
      <DocSection label="ERROR REFERENCE" icon={ShieldCheck} />

      <div className="rounded-xl overflow-hidden mb-6" style={{ border: "1px solid rgba(0,255,0,0.1)" }}>
        {errorCodes.map((e, i) => (
          <div
            key={i}
            className="px-4 py-3 flex items-start gap-4"
            style={{ background: i % 2 === 0 ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.3)", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.03)" : "none" }}
          >
            <span className="text-xs font-bold font-mono flex-shrink-0 w-8" style={{ color: e.color }}>{e.code}</span>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-semibold" style={{ color: "#ffffff" }}>{e.meaning}</span>
              <span className="text-[10px] block mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{e.detail}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── API Categories ── */}
      <DocSection label="API CATEGORIES" icon={Server} />

      <div className="grid gap-2 sm:grid-cols-2 mb-6">
        {apiCategories.map((cat) => {
          const count = allEndpoints.filter(e => e.category === cat.id).length;
          const Icon = categoryIcons[cat.id] || Code2;
          return (
            <button
              key={cat.id}
              onClick={() => setExpandedCategory(cat.id)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
              style={{ background: "#000000", border: "1px solid rgba(0,255,0,0.08)" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,255,0,0.2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(0,255,0,0.08)"; }}
              data-testid={`docs-cat-${cat.id}`}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,255,0,0.07)", border: "1px solid rgba(0,255,0,0.12)" }}>
                <Icon className="w-3.5 h-3.5" style={{ color: "#00ff00" }} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold block" style={{ color: "#ffffff" }}>{cat.name}</span>
                <span className="text-[10px] block mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.3)" }}>{cat.description}</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "rgba(0,255,0,0.08)", color: "#00ff00", border: "1px solid rgba(0,255,0,0.12)" }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Category Detail Popup */}
      {expandedCategory && (() => {
        const cat = apiCategories.find(c => c.id === expandedCategory);
        if (!cat) return null;
        const catEndpoints = allEndpoints.filter(e => e.category === cat.id);
        const Icon = categoryIcons[cat.id] || Code2;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setExpandedCategory(null); }}
            data-testid="docs-popup-overlay"
          >
            <div className="w-full max-w-2xl max-h-[85vh] rounded-xl overflow-hidden flex flex-col" style={{ background: "#080808", border: "1px solid rgba(0,255,0,0.2)" }}>
              <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,255,0,0.08)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,255,0,0.08)", border: "1px solid rgba(0,255,0,0.15)" }}>
                    <Icon className="w-4 h-4" style={{ color: "#00ff00" }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: "#ffffff", fontFamily: "'Orbitron', sans-serif" }}>{cat.name}</h3>
                    <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{cat.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(0,255,0,0.08)", color: "#00ff00", border: "1px solid rgba(0,255,0,0.15)" }}>
                    {catEndpoints.length} endpoints
                  </span>
                  {onNavigateToCategory && (
                    <button
                      onClick={() => { setExpandedCategory(null); onNavigateToCategory(cat.id); }}
                      className="text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all"
                      style={{ background: "rgba(0,255,0,0.1)", color: "#00ff00", border: "1px solid rgba(0,255,0,0.2)" }}
                      data-testid={`btn-goto-${cat.id}`}
                    >
                      Try it →
                    </button>
                  )}
                  <button
                    onClick={() => setExpandedCategory(null)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                    data-testid="btn-close-docs-popup"
                  >
                    <X className="w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto flex-1 p-4 space-y-2 hide-scrollbar">
                {catEndpoints.map((ep, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl px-4 py-3"
                    style={{ background: "rgba(0,255,0,0.02)", border: "1px solid rgba(0,255,0,0.06)" }}
                    data-testid={`docs-endpoint-${cat.id}-${idx}`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: ep.method === "POST" ? "rgba(255,165,0,0.12)" : "rgba(0,255,0,0.12)", color: ep.method === "POST" ? "#ffa500" : "#00ff00" }}>
                        {ep.method}
                      </span>
                      <code className="text-[11px] font-mono" style={{ color: "#ffffff" }}>{ep.path}</code>
                      {ep.provider && <span className="text-[9px] ml-auto" style={{ color: "rgba(255,255,255,0.2)" }}>{ep.provider}</span>}
                    </div>
                    <p className="text-[10px] mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{ep.description}</p>
                    {ep.params && ep.params.length > 0 && (
                      <div className="space-y-1 mb-2.5">
                        <span className="text-[9px] font-bold tracking-wider" style={{ color: "rgba(255,255,255,0.2)" }}>PARAMETERS</span>
                        {ep.params.map((p, pi) => (
                          <div key={pi} className="flex items-baseline gap-2 text-[10px]">
                            <code style={{ color: "#00ff00" }}>{p.name}</code>
                            <span style={{ color: "rgba(255,255,255,0.2)" }}>{p.type}</span>
                            {p.required && <span className="text-[8px] px-1 py-0.5 rounded" style={{ background: "rgba(255,100,100,0.12)", color: "#ff8080" }}>required</span>}
                            <span style={{ color: "rgba(255,255,255,0.3)" }}>{p.description}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div>
                      <span className="text-[9px] font-bold tracking-wider" style={{ color: "rgba(255,255,255,0.2)" }}>EXAMPLE</span>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-[10px] px-2 py-1.5 rounded-lg font-mono flex-1 overflow-x-auto" style={{ background: "rgba(0,255,0,0.04)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(0,255,0,0.07)" }}>
                          {ep.method === "POST"
                            ? `curl -X POST ${baseUrl}${ep.path} -H "Content-Type: application/json" -d '${JSON.stringify(Object.fromEntries((ep.params || []).filter(p => p.required).map(p => [p.name, p.type === "string" ? "example" : "value"])))}'`
                            : `${baseUrl}${ep.path}${ep.params?.some(p => p.required) ? "?" + ep.params.filter(p => p.required).map(p => `${p.name}=example`).join("&") : ""}`}
                        </code>
                        <CopyButton text={ep.method === "POST"
                          ? `curl -X POST ${baseUrl}${ep.path} -H "Content-Type: application/json" -d '${JSON.stringify(Object.fromEntries((ep.params || []).filter(p => p.required).map(p => [p.name, p.type === "string" ? "example" : "value"])))}'`
                          : `${baseUrl}${ep.path}${ep.params?.some(p => p.required) ? "?" + ep.params.filter(p => p.required).map(p => `${p.name}=example`).join("&") : ""}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Community ── */}
      <DocSection label="COMMUNITY & SUPPORT" icon={MessageSquare} />

      <div className="grid gap-3 mb-6">
        {communityLinks.map((link) => (
          <a
            key={link.title}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 px-4 py-4 rounded-xl transition-all"
            style={{ background: "#000000", border: "1px solid rgba(0,255,0,0.08)" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,255,0,0.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(0,255,0,0.08)"; }}
            data-testid={`link-${link.title.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${link.color}12`, border: `1px solid ${link.color}25` }}>
              <link.icon className="w-4 h-4" style={{ color: link.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold" style={{ color: "#ffffff" }}>{link.title}</h4>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{link.description}</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(255,255,255,0.15)" }} />
          </a>
        ))}
      </div>

      {/* ── Projects ── */}
      {siteConfig.cards.length > 0 && (
        <>
          <DocSection label="PROJECTS BY SILENT WOLF" icon={Globe} />
          <div className="grid gap-3 sm:grid-cols-2 mb-6">
            {siteConfig.cards.map((card) => (
              <a
                key={card.id}
                href={card.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-3 px-4 py-4 rounded-xl transition-all group"
                style={{ background: "#000000", border: "1px solid rgba(0,255,0,0.08)" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,255,0,0.2)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(0,255,0,0.08)"; }}
                data-testid={`link-project-${card.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,255,0,0.07)", border: "1px solid rgba(0,255,0,0.15)" }}>
                    <CardIcon icon={card.icon} />
                  </div>
                  <ExternalLink className="w-3 h-3 opacity-20 group-hover:opacity-60 transition-opacity" style={{ color: "#00ff00" }} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <h4 className="text-xs font-bold" style={{ color: "#ffffff" }}>{card.name}</h4>
                    {card.badge && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(0,255,0,0.07)", color: "#00ff00", border: "1px solid rgba(0,255,0,0.12)" }}>{card.badge}</span>}
                  </div>
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>{card.description}</p>
                  {card.display && <p className="text-[10px] mt-1.5" style={{ color: "rgba(0,255,0,0.4)" }}>{card.display}</p>}
                </div>
              </a>
            ))}
          </div>
        </>
      )}

      {/* ── Footer ── */}
      <div className="rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ background: "#000000", border: "1px solid rgba(0,255,0,0.06)" }}>
        <div>
          <p className="text-xs font-semibold" style={{ color: "#ffffff" }}>WolfAPIs <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>by Silent Wolf</span></p>
          <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>
            v1.0.0 · {allEndpoints.length} endpoints · {apiCategories.length} categories · Free to use
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#00ff00", boxShadow: "0 0 6px #00ff00" }} />
          <span className="text-[10px] font-bold" style={{ color: "#00ff00" }}>ALL SYSTEMS LIVE</span>
        </div>
      </div>
    </div>
  );
}

function EndpointSearchBar({
  endpoints,
  searchQuery,
  setSearchQuery,
  onSelectEndpoint,
  placeholder,
}: {
  endpoints: ApiEndpoint[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSelectEndpoint: (ep: ApiEndpoint) => void;
  placeholder?: string;
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const matchEndpoint = (ep: ApiEndpoint, q: string) => {
    const lower = q.toLowerCase();
    return ep.description.toLowerCase().includes(lower) ||
           ep.path.toLowerCase().includes(lower) ||
           (ep.provider || "").toLowerCase().includes(lower);
  };

  const suggestions = searchQuery.length > 0
    ? endpoints.filter((ep) => matchEndpoint(ep, searchQuery)).slice(0, 8)
    : [];

  const matchCount = searchQuery.length > 0
    ? endpoints.filter((ep) => matchEndpoint(ep, searchQuery)).length
    : endpoints.length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative mb-4" data-testid="search-bar-container">
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
        style={{
          background: "#000000",
          border: showSuggestions && suggestions.length > 0
            ? "1px solid rgba(0,255,0,0.3)"
            : "1px solid rgba(0,255,0,0.12)",
        }}
      >
        <Search className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(0,255,0,0.4)" }} />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder || "Search endpoints..."}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: "#ffffff" }}
          data-testid="input-search-endpoints"
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(""); setShowSuggestions(false); }}
            className="p-0.5 rounded"
            style={{ color: "rgba(255,255,255,0.3)" }}
            data-testid="button-clear-search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <span className="text-[10px] font-mono flex-shrink-0 hidden xs:block" style={{ color: "rgba(255,255,255,0.2)" }}>
          {searchQuery ? `${matchCount} found` : `${endpoints.length}`}
        </span>
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden"
          style={{
            background: "#0a0a0a",
            border: "1px solid rgba(0,255,0,0.2)",
            zIndex: 50,
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          }}
          data-testid="search-suggestions"
        >
          {suggestions.map((ep) => (
            <button
              key={ep.path}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
              style={{ borderBottom: "1px solid rgba(0,255,0,0.06)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,255,0,0.05)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              onClick={() => {
                onSelectEndpoint(ep);
                setShowSuggestions(false);
              }}
              data-testid={`suggestion-${ep.path}`}
            >
              <Zap className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(0,255,0,0.4)" }} />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium block truncate" style={{ color: "#ffffff" }}>{ep.description}</span>
                <span className="text-[10px] font-mono block truncate" style={{ color: "rgba(0,255,0,0.4)" }}>{ep.path}</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: "rgba(0,255,0,0.08)", color: "#00ff00" }}>{ep.method}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [testEndpoint, setTestEndpoint] = useState<ApiEndpoint | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarDesktopOpen, setSidebarDesktopOpen] = useState(false);
  const [effectSearch, setEffectSearch] = useState("");
  const [copiedAllEndpoints, setCopiedAllEndpoints] = useState(false);
  const [ephotoExpanded, setEphotoExpanded] = useState(false);
  const [ephotoSubCategory, setEphotoSubCategory] = useState<string | null>(null);
  const [photofuniaExpanded, setPhotofuniaExpanded] = useState(false);
  const [photofuniaSubCategory, setPhotofuniaSubCategory] = useState<string | null>(null);
  const [showSocialPopup, setShowSocialPopup] = useState(false);
  const [githubUrl, setGithubUrl] = useState("https://github.com/SilentWolf-Kenya");

  type TestAllIssue = { endpoint: string; status: number; error: string };
  type TestAllReport = {
    success: boolean;
    creator: string;
    total: number;
    passed: number;
    failed: number;
    duration_ms: number;
    issues: TestAllIssue[];
  };
  const [testAllOpen, setTestAllOpen] = useState(false);
  const [testAllRunning, setTestAllRunning] = useState(false);
  const [testAllProgress, setTestAllProgress] = useState({ done: 0, total: 0 });
  const [testAllReport, setTestAllReport] = useState<TestAllReport | null>(null);
  const [testAllCopied, setTestAllCopied] = useState(false);
  const [testAllPickingMode, setTestAllPickingMode] = useState(false);
  const [musicTestMode, setMusicTestMode] = useState<"name" | "url">("name");
  const MUSIC_TEST_URL = "https://youtu.be/VoH21Knbx0U?si=lymFG7mS6bXDWQTp";
  const MUSIC_TEST_NAME = "Home NF";

  useEffect(() => {
    fetchSiteConfig().then((cfg) => setGithubUrl(cfg.githubUrl));
  }, []);

  useEffect(() => {
    const dismissed = localStorage.getItem("wolfapis_social_dismissed");
    if (!dismissed) {
      const t = setTimeout(() => setShowSocialPopup(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const handleDismissPopup = () => {
    setShowSocialPopup(false);
    localStorage.setItem("wolfapis_social_dismissed", "1");
  };

  const { data: mediaStatus } = useQuery<MediaStatusData>({
    queryKey: ["/api/media/status"],
    refetchInterval: 60 * 1000,
    staleTime: 60 * 1000,
  });

  const comingSoonCategories = ["security", "urlshortener"];
  const displayCategories = apiCategories.filter(cat => !comingSoonCategories.includes(cat.id));
  const soonCategories = apiCategories.filter(cat => comingSoonCategories.includes(cat.id));

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const handleTry = (ep: ApiEndpoint) => {
    setTestEndpoint(ep);
  };

  const { triggerLoader } = useLoader();

  useEffect(() => {
    triggerLoader();
  }, [activeCategory]);

  const handleCategoryClick = (id: string) => {
    setActiveCategory(id);
    setEffectSearch("");
    setCopiedAllEndpoints(false);
  };

  const handleCopyAllEndpoints = () => {
    const text = filteredEndpoints.map((ep) => ep.path).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopiedAllEndpoints(true);
      setTimeout(() => setCopiedAllEndpoints(false), 2000);
    });
  };

  const runTestAll = async (mode?: "name" | "url") => {
    if (!activeCategory || testAllRunning) return;
    const endpoints = filteredEndpoints;
    const isMusicCat = activeCategory === "music";
    const chosenMode = mode ?? musicTestMode;
    setTestAllPickingMode(false);
    setTestAllOpen(true);
    setTestAllRunning(true);
    setTestAllReport(null);
    setTestAllProgress({ done: 0, total: endpoints.length });

    const t0 = Date.now();
    const issues: { endpoint: string; status: number; error: string }[] = [];
    let passed = 0;
    let done = 0;

    const testOne = async (ep: ApiEndpoint) => {
      const epParams = ep.params || [];
      const epHasUrlParam = epParams.some(px => px.name === "url");

      const resolveParamValue = (p: { name: string; default?: string | number }) => {
        if (!isMusicCat) return p.default != null ? String(p.default) : undefined;
        if (chosenMode === "name") {
          if (p.name === "url") return undefined;
          if (p.name === "q") return MUSIC_TEST_NAME;
        } else {
          if (epHasUrlParam && p.name === "q") return undefined;
          if (p.name === "url") return MUSIC_TEST_URL;
        }
        return p.default != null ? String(p.default) : undefined;
      };

      const pathParamNames = new Set(
        (ep.path.match(/:([a-zA-Z_]+)/g) || []).map((s: string) => s.slice(1))
      );
      let path = ep.path;
      for (const p of epParams) {
        const val = resolveParamValue(p);
        if (val !== undefined && pathParamNames.has(p.name)) {
          path = path.replace(`:${p.name}`, encodeURIComponent(val));
        }
      }
      let url = baseUrl + path;
      const opts: RequestInit = {};
      if (ep.method === "GET") {
        const qs = new URLSearchParams();
        for (const p of epParams) {
          const val = resolveParamValue(p);
          if (val !== undefined && !pathParamNames.has(p.name)) qs.set(p.name, val);
        }
        const s = qs.toString();
        if (s) url += "?" + s;
      } else {
        const body: Record<string, string> = {};
        for (const p of epParams) {
          const val = resolveParamValue(p);
          if (val !== undefined) body[p.name] = val;
        }
        opts.method = "POST";
        opts.headers = { "Content-Type": "application/json" };
        opts.body = JSON.stringify(body);
      }
      const timeoutMs = isMusicCat ? 25000 : 10000;
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        opts.signal = controller.signal;
        const r = await fetch(url, opts);
        clearTimeout(timer);
        const data = await r.json().catch(() => ({}));
        const ok = r.ok && data.success !== false;
        if (!ok) {
          issues.push({ endpoint: ep.path, status: r.status, error: data.error || `HTTP ${r.status}` });
        } else {
          passed++;
        }
      } catch (e: any) {
        issues.push({ endpoint: ep.path, status: 0, error: e.name === "AbortError" ? "Timeout (10s)" : (e.message || "Request failed") });
      }
      done++;
      setTestAllProgress({ done, total: endpoints.length });
    };

    const BATCH = 8;
    for (let i = 0; i < endpoints.length; i += BATCH) {
      await Promise.allSettled(endpoints.slice(i, i + BATCH).map(testOne));
    }

    setTestAllReport({
      success: issues.length === 0,
      creator: "APIs by Silent Wolf",
      total: endpoints.length,
      passed,
      failed: issues.length,
      duration_ms: Date.now() - t0,
      issues,
    });
    setTestAllRunning(false);
  };

  const handleTestAllClick = () => {
    if (testAllRunning) return;
    if (activeCategory === "music") {
      setTestAllPickingMode(true);
      setTestAllOpen(true);
      setTestAllReport(null);
    } else {
      runTestAll();
    }
  };

  const filteredEndpoints = activeCategory
    ? allEndpoints.filter((e) => {
        if (e.category !== activeCategory) return false;
        if (activeCategory === "ephoto" && ephotoSubCategory) {
          return e.subcategory === ephotoSubCategory;
        }
        if (activeCategory === "photofunia" && photofuniaSubCategory) {
          return e.subcategory === photofuniaSubCategory;
        }
        return true;
      })
    : [];
  const displayedEndpoints = effectSearch
    ? filteredEndpoints.filter((ep) => {
        const lower = effectSearch.toLowerCase();
        return ep.description.toLowerCase().includes(lower) ||
               ep.path.toLowerCase().includes(lower) ||
               (ep.provider || "").toLowerCase().includes(lower);
      })
    : filteredEndpoints;
  const activeCategoryData = activeCategory ? apiCategories.find((c) => c.id === activeCategory) : null;

  const endpointCounts = apiCategories.map((cat) => ({
    ...cat,
    count: allEndpoints.filter((e) => e.category === cat.id).length,
  }));

  const isTableView = false;

  const sidebarWidth = sidebarCollapsed ? "60px" : "240px";

  return (
    <div className="min-h-screen flex" style={{ background: "#050505" }}>
      {sidebarOpen && (
        <div
          className="fixed inset-0"
          style={{ zIndex: 40, background: "rgba(0,0,0,0.75)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen flex-shrink-0 overflow-y-auto overflow-x-hidden transition-all hide-scrollbar ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{
          width: "240px",
          zIndex: 45,
          background: "#070707",
          borderRight: "1px solid rgba(0,255,0,0.05)",
        }}
        data-testid="sidebar"
      >
        <div className="px-4 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(0,255,0,0.08)", minHeight: "56px" }}>
          {!sidebarCollapsed ? (
            <>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(0,255,0,0.1)", border: "1px solid rgba(0,255,0,0.2)" }}
              >
                <img
                  src={wolfLogo}
                  alt="WolfApis"
                  className="w-5 h-5 object-cover"
                />
              </div>
              <h1
                className="text-sm font-bold tracking-widest leading-none flex-1"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                <span style={{ color: "#00ff00" }}>WOLF</span>
                <span style={{ color: "#ffffff" }}>APIS</span>
              </h1>
            </>
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto"
              style={{ background: "rgba(0,255,0,0.1)", border: "1px solid rgba(0,255,0,0.2)" }}
            >
              <img
                src={wolfLogo}
                alt="WolfApis"
                className="w-5 h-5 object-cover"
              />
            </div>
          )}
          <button
            className="ml-auto p-1.5 rounded flex-shrink-0"
            onClick={() => { setSidebarOpen(false); setSidebarDesktopOpen(false); }}
            style={{ color: "rgba(255,255,255,0.4)" }}
            data-testid="button-close-sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!sidebarCollapsed && (
          <div className="px-4 pt-3 pb-1">
            <span className="text-[9px] font-bold tracking-[0.15em]" style={{ color: "rgba(0,255,0,0.35)" }}>
              WOLFAPIS
            </span>
          </div>
        )}

        <nav className="px-2 py-1 space-y-0.5" data-testid="nav-categories">
          <button
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all"
            style={{
              color: activeCategory === null ? "#00ff00" : "rgba(255,255,255,0.5)",
            }}
            onClick={() => { setActiveCategory(null); setSidebarOpen(false); }}
            data-testid="nav-home"
            title="Home"
          >
            <HomeIcon className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && (
              <span className="text-[13px] font-medium flex-1">Home</span>
            )}
            {!sidebarCollapsed && activeCategory === null && (
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#00ff00" }} />
            )}
          </button>

          {displayCategories.map((cat) => {
            const Icon = categoryIcons[cat.id] || Code2;
            const isActive = activeCategory === cat.id;

            if (cat.id === "ephoto") {
              return (
                <div key={cat.id}>
                  <button
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all"
                    style={{ color: isActive ? "#00ff00" : "rgba(255,255,255,0.5)" }}
                    onClick={() => {
                      setActiveCategory("ephoto");
                      setEphotoSubCategory(null);
                      setEphotoExpanded(!ephotoExpanded);
                      setPhotofuniaExpanded(false);
                      setPhotofuniaSubCategory(null);
                      setEffectSearch("");
                      setSidebarOpen(false);
                    }}
                    data-testid="nav-ephoto"
                    title={cat.name}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="text-[13px] font-medium flex-1 truncate">{cat.name}</span>
                        <ChevronDown
                          className="w-3.5 h-3.5 flex-shrink-0 transition-transform"
                          style={{ transform: ephotoExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                        />
                      </>
                    )}
                  </button>
                  {ephotoExpanded && !sidebarCollapsed && (
                    <div className="ml-4 mt-0.5 space-y-0.5 pb-0.5">
                      {EPHOTO_SUBCATEGORIES.map((sub) => {
                        const subActive = isActive && ephotoSubCategory === sub.id;
                        const hasEndpoints = allEndpoints.some(e => e.category === "ephoto" && e.subcategory === sub.id);
                        return (
                          <button
                            key={sub.id}
                            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-left transition-all"
                            style={{
                              color: subActive ? "#00ff00" : hasEndpoints ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.2)",
                              cursor: hasEndpoints ? "pointer" : "default",
                            }}
                            onClick={() => {
                              if (!hasEndpoints) return;
                              setActiveCategory("ephoto");
                              setEphotoSubCategory(sub.id);
                              setEffectSearch("");
                              setSidebarOpen(false);
                            }}
                            data-testid={`nav-ephoto-${sub.id}`}
                            title={sub.name + (hasEndpoints ? "" : " (Coming Soon)")}
                          >
                            <div
                              className="w-1 h-1 rounded-full flex-shrink-0"
                              style={{ background: subActive ? "#00ff00" : hasEndpoints ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)" }}
                            />
                            <span className="text-[11px] font-medium flex-1 truncate">{sub.name}</span>
                            {!hasEndpoints && (
                              <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>soon</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            if (cat.id === "photofunia") {
              const pfActive = activeCategory === "photofunia";
              return (
                <div key={cat.id}>
                  <button
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all"
                    style={{ color: pfActive ? "#00ff00" : "rgba(255,255,255,0.5)" }}
                    onClick={() => {
                      setActiveCategory("photofunia");
                      setPhotofuniaSubCategory(null);
                      setPhotofuniaExpanded(!photofuniaExpanded);
                      setEphotoExpanded(false);
                      setEphotoSubCategory(null);
                      setEffectSearch("");
                      setSidebarOpen(false);
                    }}
                    data-testid="nav-photofunia"
                    title={cat.name}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="text-[13px] font-medium flex-1 truncate">{cat.name}</span>
                        <ChevronDown
                          className="w-3.5 h-3.5 flex-shrink-0 transition-transform"
                          style={{ transform: photofuniaExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                        />
                      </>
                    )}
                  </button>
                  {photofuniaExpanded && !sidebarCollapsed && (
                    <div className="ml-4 mt-0.5 space-y-0.5 pb-0.5">
                      {PHOTOFUNIA_SUBCATEGORIES.map((sub) => {
                        const subActive = pfActive && photofuniaSubCategory === sub.id;
                        const hasEndpoints = allEndpoints.some(e => e.category === "photofunia" && e.subcategory === sub.id);
                        return (
                          <button
                            key={sub.id}
                            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-left transition-all"
                            style={{
                              color: subActive ? "#00ff00" : hasEndpoints ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.2)",
                              cursor: hasEndpoints ? "pointer" : "default",
                            }}
                            onClick={() => {
                              if (!hasEndpoints) return;
                              setActiveCategory("photofunia");
                              setPhotofuniaSubCategory(sub.id);
                              setEffectSearch("");
                              setSidebarOpen(false);
                            }}
                            data-testid={`nav-photofunia-${sub.id}`}
                            title={sub.name + (hasEndpoints ? "" : " (Coming Soon)")}
                          >
                            <div
                              className="w-1 h-1 rounded-full flex-shrink-0"
                              style={{ background: subActive ? "#00ff00" : hasEndpoints ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)" }}
                            />
                            <span className="text-[11px] font-medium flex-1 truncate">{sub.name}</span>
                            {!hasEndpoints && (
                              <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>soon</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={cat.id}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all"
                style={{
                  color: isActive ? "#00ff00" : "rgba(255,255,255,0.5)",
                }}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setEffectSearch("");
                  setPhotofuniaExpanded(false);
                  setPhotofuniaSubCategory(null);
                  setEphotoExpanded(false);
                  setEphotoSubCategory(null);
                  setSidebarOpen(false);
                }}
                data-testid={`nav-${cat.id}`}
                title={cat.name}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="text-[13px] font-medium flex-1 truncate">{cat.name}</span>
                    {MEDIA_STATUS_CATEGORIES.includes(cat.id) ? (() => {
                      const overallStatus = getCategoryOverallStatus(mediaStatus?.categories?.[cat.id]);
                      const dotColor = isActive
                        ? "#00ff00"
                        : overallStatus === "green" ? "#00ff00"
                        : overallStatus === "yellow" ? "#f59e0b"
                        : overallStatus === "red" ? "#ff4444"
                        : "rgba(255,255,255,0.15)";
                      const dotGlow = overallStatus === "green" || isActive ? "0 0 5px rgba(0,255,0,0.6)" : "none";
                      return (
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: dotColor, boxShadow: dotGlow }}
                          title={overallStatus === "green" ? "All providers online" : overallStatus === "yellow" ? "Some providers offline" : overallStatus === "red" ? "All providers offline" : "Checking..."}
                          data-testid={`status-sidebar-${cat.id}`}
                        />
                      );
                    })() : isActive && (
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#00ff00" }} />
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {!sidebarCollapsed && soonCategories.length > 0 && (
          <div className="px-4 pt-4 pb-1">
            <span className="text-[9px] font-bold tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.2)" }}>
              COMING SOON
            </span>
          </div>
        )}

        <nav className="px-2 py-1 space-y-0.5">
          {soonCategories.map((cat) => {
            const Icon = categoryIcons[cat.id] || Code2;
            return (
              <div
                key={cat.id}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left opacity-40 cursor-not-allowed"
                style={{ color: "rgba(255,255,255,0.4)" }}
                title={`${cat.name} (Coming Soon)`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="text-[13px] font-medium flex-1 truncate">{cat.name}</span>
                )}
              </div>
            );
          })}
        </nav>

        <div className="px-2 py-2" style={{ borderTop: "1px solid rgba(0,255,0,0.06)" }}>
          <button
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all"
            style={{
              color: activeCategory === "docs" ? "#00ff00" : "rgba(255,255,255,0.5)",
            }}
            onClick={() => { setActiveCategory("docs" as any); setSidebarOpen(false); }}
            data-testid="nav-docs"
            title="Documentation"
          >
            <BookOpen className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && (
              <>
                <span className="text-[13px] font-medium flex-1">Docs</span>
                {activeCategory === "docs" && (
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#00ff00" }} />
                )}
              </>
            )}
          </button>
        </div>

        {!sidebarCollapsed && (
          <div className="px-4 py-4 mt-auto" style={{ borderTop: "1px solid rgba(0,255,0,0.08)" }}>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "#00ff00", boxShadow: "0 0 6px #00ff00" }}
                />
                <span className="text-[10px] font-semibold tracking-wider" style={{ color: "#00ff00" }}>
                  ALL SYSTEMS LIVE
                </span>
              </div>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                APIs by Silent Wolf
              </p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.15)" }}>
                A tech explorer
              </p>
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 min-w-0">
        <header
          className="sticky top-0"
          style={{
            zIndex: 30,
            background: "rgba(5,5,5,0.95)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <div className="px-3 py-2 sm:px-6 sm:py-3 flex items-center gap-2 sm:gap-3">
            <button
              className="p-1.5 rounded-md"
              onClick={() => { setSidebarOpen(true); setSidebarCollapsed(false); }}
              style={{ color: "rgba(255,255,255,0.5)" }}
              data-testid="button-open-sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <a
              href="/"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all flex-shrink-0"
              style={{ color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#00ff00"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,255,0,0.2)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; }}
              data-testid="link-back-landing"
              title="Back to landing page"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold tracking-wider">HOME</span>
            </a>

            {activeCategory !== null && (
              <button
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all flex-shrink-0"
                style={{ color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}
                onClick={() => {
                  setActiveCategory(null);
                  setPhotofuniaSubCategory(null);
                  setPhotofuniaExpanded(false);
                  setEphotoSubCategory(null);
                  setEphotoExpanded(false);
                  setEffectSearch("");
                }}
                data-testid="button-back-home"
                title="Back to home"
                onMouseEnter={(e) => { e.currentTarget.style.color = "#00ff00"; e.currentTarget.style.borderColor = "rgba(0,255,0,0.2)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="text-[10px] font-semibold tracking-wider hidden sm:inline">HOME</span>
              </button>
            )}

            <div className="flex items-center gap-2 flex-1 min-w-0">
              {activeCategory === null ? (
                <>
                  <HomeIcon className="w-4 h-4" style={{ color: "#00ff00" }} />
                  <h2 className="text-sm font-bold tracking-wider" style={{ color: "#ffffff", fontFamily: "'Orbitron', sans-serif" }}>
                    WELCOME
                  </h2>
                </>
              ) : activeCategory === "docs" ? (
                <>
                  <BookOpen className="w-4 h-4" style={{ color: "#00ff00" }} />
                  <h2 className="text-sm font-bold tracking-wider" style={{ color: "#ffffff", fontFamily: "'Orbitron', sans-serif" }}>
                    DOCUMENTATION
                  </h2>
                </>
              ) : activeCategoryData ? (
                <>
                  {(() => {
                    const Icon = categoryIcons[activeCategoryData.id] || Code2;
                    return <Icon className="w-4 h-4 flex-shrink-0" style={{ color: "#00ff00" }} />;
                  })()}
                  <h2 className="text-sm font-bold tracking-wider truncate max-w-[100px] xs:max-w-none" style={{ color: "#ffffff", fontFamily: "'Orbitron', sans-serif" }}>
                    {activeCategoryData.name.toUpperCase()}
                  </h2>
                  <span
                    className="hidden xs:inline text-[10px] font-mono px-2 py-0.5 rounded flex-shrink-0"
                    style={{ background: "rgba(0,255,0,0.06)", color: "#00ff00", border: "1px solid rgba(0,255,0,0.12)" }}
                  >
                    {filteredEndpoints.length}
                  </span>
                  <button
                    onClick={handleCopyAllEndpoints}
                    data-testid="button-copy-all-endpoints"
                    className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-wider transition-all flex-shrink-0"
                    style={{
                      background: copiedAllEndpoints ? "rgba(0,255,0,0.12)" : "rgba(0,255,0,0.06)",
                      color: copiedAllEndpoints ? "#00ff00" : "rgba(0,255,0,0.7)",
                      border: `1px solid ${copiedAllEndpoints ? "rgba(0,255,0,0.35)" : "rgba(0,255,0,0.15)"}`,
                    }}
                    title="Copy all endpoint paths to clipboard"
                  >
                    {copiedAllEndpoints ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span className="hidden sm:inline">{copiedAllEndpoints ? "COPIED!" : "COPY ALL"}</span>
                  </button>
                </>
              ) : null}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              <div
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg"
                style={{ border: "1px solid rgba(0,255,0,0.12)" }}
                data-testid="status-live"
              >
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#00ff00", boxShadow: "0 0 6px #00ff00" }} />
                <span className="text-[10px] font-semibold tracking-wider" style={{ color: "#00ff00" }}>
                  LIVE
                </span>
              </div>
              <Bell className="w-4 h-4 hidden sm:block" style={{ color: "rgba(255,255,255,0.3)" }} />
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all"
                style={{ border: "1px solid rgba(0,255,0,0.1)" }}
                data-testid="link-github-header"
              >
                <Github className="w-4 h-4" style={{ color: "#00ff00" }} />
                <span className="text-[11px] hidden sm:inline" style={{ color: "rgba(255,255,255,0.5)" }}>wolf</span>
              </a>
            </div>
          </div>
        </header>

        {activeCategory === null ? (
          <WelcomePage onCategoryClick={handleCategoryClick} onTryEndpoint={handleTry} mediaStatus={mediaStatus} />
        ) : activeCategory === "docs" ? (
          <DocumentationPage onNavigateToCategory={(catId) => { setActiveCategory(catId); }} />
        ) : (
          <>
            <HeroSection categoryId={activeCategory} />

            <section className="px-3 py-4 sm:px-6 sm:py-5">
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={handleTestAllClick}
                  disabled={testAllRunning}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all"
                  style={{
                    background: testAllRunning ? "rgba(0,255,0,0.06)" : "rgba(0,255,0,0.08)",
                    color: testAllRunning ? "rgba(0,255,0,0.4)" : "#00ff00",
                    border: "1px solid rgba(0,255,0,0.2)",
                    cursor: testAllRunning ? "not-allowed" : "pointer",
                  }}
                  data-testid="button-test-all"
                  title={`Test all ${filteredEndpoints.length} endpoints in this category`}
                >
                  {testAllRunning ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Zap className="w-3 h-3" />
                  )}
                  {testAllRunning
                    ? `TESTING… ${testAllProgress.done}/${testAllProgress.total}`
                    : `TEST ALL (${filteredEndpoints.length})`}
                </button>
                {testAllReport && !testAllRunning && (
                  <button
                    onClick={() => setTestAllOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                    style={{
                      background: testAllReport.success ? "rgba(0,255,0,0.06)" : "rgba(255,100,100,0.08)",
                      color: testAllReport.success ? "#00ff00" : "#ff6464",
                      border: `1px solid ${testAllReport.success ? "rgba(0,255,0,0.2)" : "rgba(255,100,100,0.2)"}`,
                    }}
                    data-testid="button-test-all-results"
                  >
                    {testAllReport.success ? "✓" : "!"} {testAllReport.passed}/{testAllReport.total} passed
                  </button>
                )}
              </div>

              <EndpointSearchBar
                endpoints={filteredEndpoints}
                searchQuery={effectSearch}
                setSearchQuery={setEffectSearch}
                onSelectEndpoint={handleTry}
                placeholder={`Search ${activeCategoryData?.name || "endpoints"}...`}
              />

              {isTableView ? (
                <EffectTable endpoints={displayedEndpoints} onTry={handleTry} />
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
                  {displayedEndpoints.map((ep) => (
                    <EndpointCard key={ep.path} endpoint={ep} onTry={handleTry} />
                  ))}
                </div>
              )}

              {displayedEndpoints.length === 0 && (
                <div className="text-center py-16">
                  <Code2 className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.1)" }} />
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {effectSearch ? "No effects match your search." : "No endpoints in this category yet."}
                  </p>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {testEndpoint && (
        <TestPopup
          endpoint={testEndpoint}
          baseUrl={baseUrl}
          onClose={() => setTestEndpoint(null)}
        />
      )}

      {testAllOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
          style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)" }}
          onClick={(e) => { if (e.target === e.currentTarget && !testAllRunning) { setTestAllOpen(false); setTestAllPickingMode(false); } }}
          data-testid="overlay-test-all"
        >
          <div
            className="w-full max-w-xl rounded-2xl overflow-hidden flex flex-col"
            style={{ background: "#080808", border: "1px solid rgba(0,255,0,0.2)", maxHeight: "85vh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,255,0,0.08)" }}>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" style={{ color: "#00ff00" }} />
                <span className="text-sm font-bold tracking-widest" style={{ color: "#ffffff", fontFamily: "'Orbitron', sans-serif" }}>
                  TEST ALL
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(0,255,0,0.08)", color: "#00ff00", border: "1px solid rgba(0,255,0,0.15)" }}>
                  {activeCategoryData?.name || activeCategory}
                </span>
              </div>
              {!testAllRunning && (
                <button
                  onClick={() => { setTestAllOpen(false); setTestAllPickingMode(false); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                  data-testid="button-close-test-all"
                >
                  <X className="w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto hide-scrollbar p-5">
              {testAllPickingMode ? (
                <div className="flex flex-col items-center gap-6 py-8">
                  <div className="text-center">
                    <p className="text-xs font-bold tracking-widest mb-1" style={{ color: "#ffffff", fontFamily: "'Orbitron', sans-serif" }}>CHOOSE TEST MODE</p>
                    <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>How should endpoints be tested?</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                    <button
                      onClick={() => { setMusicTestMode("name"); runTestAll("name"); }}
                      className="flex-1 flex flex-col items-center gap-2 px-4 py-5 rounded-xl transition-all"
                      style={{ background: "rgba(0,255,0,0.06)", border: "1px solid rgba(0,255,0,0.25)", cursor: "pointer" }}
                      data-testid="button-test-mode-name"
                    >
                      <span className="text-2xl">🎵</span>
                      <span className="text-[11px] font-bold tracking-wider" style={{ color: "#00ff00", fontFamily: "'Orbitron', sans-serif" }}>SONG NAME</span>
                      <span className="text-[10px] text-center px-2" style={{ color: "rgba(255,255,255,0.4)" }}>Test using "<span style={{ color: "rgba(255,255,255,0.7)" }}>Home NF</span>"</span>
                    </button>
                    <button
                      onClick={() => { setMusicTestMode("url"); runTestAll("url"); }}
                      className="flex-1 flex flex-col items-center gap-2 px-4 py-5 rounded-xl transition-all"
                      style={{ background: "rgba(0,150,255,0.06)", border: "1px solid rgba(0,150,255,0.25)", cursor: "pointer" }}
                      data-testid="button-test-mode-url"
                    >
                      <span className="text-2xl">🔗</span>
                      <span className="text-[11px] font-bold tracking-wider" style={{ color: "#0096ff", fontFamily: "'Orbitron', sans-serif" }}>YOUTUBE URL</span>
                      <span className="text-[10px] text-center px-2" style={{ color: "rgba(255,255,255,0.4)" }}>Test using the <span style={{ color: "rgba(255,255,255,0.7)" }}>Home NF</span> video link</span>
                    </button>
                  </div>
                </div>
              ) : testAllRunning ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#00ff00" }} />
                  <div className="text-center">
                    <p className="text-sm font-semibold" style={{ color: "#00ff00", fontFamily: "'Orbitron', sans-serif" }}>
                      RUNNING TESTS
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {testAllProgress.done} / {testAllProgress.total} endpoints tested
                    </p>
                    <div className="w-48 h-1 rounded-full mt-3 mx-auto" style={{ background: "rgba(0,255,0,0.08)" }}>
                      <div
                        className="h-1 rounded-full transition-all"
                        style={{
                          width: testAllProgress.total > 0 ? `${(testAllProgress.done / testAllProgress.total) * 100}%` : "0%",
                          background: "#00ff00",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : testAllReport ? (
                <>
                  {/* Status banner */}
                  <div
                    className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4"
                    style={{
                      background: testAllReport.success ? "rgba(0,255,0,0.06)" : "rgba(255,100,100,0.06)",
                      border: `1px solid ${testAllReport.success ? "rgba(0,255,0,0.15)" : "rgba(255,100,100,0.15)"}`,
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: testAllReport.success ? "#00ff00" : "#ff6464", boxShadow: `0 0 6px ${testAllReport.success ? "#00ff00" : "#ff6464"}` }}
                    />
                    <span className="text-xs font-bold" style={{ color: testAllReport.success ? "#00ff00" : "#ff6464" }}>
                      {testAllReport.success ? "ALL ENDPOINTS PASSING" : `${testAllReport.failed} ENDPOINT${testAllReport.failed > 1 ? "S" : ""} FAILED`}
                    </span>
                    <span className="ml-auto text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                      {testAllReport.duration_ms}ms
                    </span>
                  </div>

                  {/* JSON report */}
                  <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,255,0,0.08)" }}>
                    <div className="flex items-center justify-between px-4 py-2" style={{ background: "#000000", borderBottom: "1px solid rgba(0,255,0,0.06)" }}>
                      <span className="text-[9px] font-bold tracking-wider" style={{ color: "rgba(255,255,255,0.25)" }}>JSON REPORT</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(testAllReport, null, 2));
                          setTestAllCopied(true);
                          setTimeout(() => setTestAllCopied(false), 2000);
                        }}
                        className="flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded transition-all"
                        style={{ color: testAllCopied ? "#00ff00" : "rgba(255,255,255,0.3)", border: "1px solid rgba(0,255,0,0.1)" }}
                        data-testid="button-copy-test-report"
                      >
                        {testAllCopied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                        {testAllCopied ? "COPIED" : "COPY"}
                      </button>
                    </div>
                    <pre
                      className="p-4 text-[11px] font-mono overflow-x-auto"
                      style={{ background: "rgba(0,255,0,0.015)", color: "rgba(255,255,255,0.6)", lineHeight: "1.7", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                    >
                      {/* Render JSON with colour highlighting */}
                      {JSON.stringify(testAllReport, null, 2)
                        .split("\n")
                        .map((line, i) => {
                          const keyMatch = line.match(/^(\s*)"([^"]+)":/);
                          const trueMatch = /:\s*true/.test(line);
                          const falseMatch = /:\s*false/.test(line);
                          const numMatch = line.match(/:\s*(\d+)/);
                          const strMatch = line.match(/:\s*"([^"]*)"/);
                          return (
                            <span key={i} style={{ display: "block" }}>
                              {keyMatch && <span style={{ color: "rgba(0,255,0,0.7)" }}>{keyMatch[0].slice(0, -1)}</span>}
                              {keyMatch && <span style={{ color: "rgba(255,255,255,0.3)" }}>:</span>}
                              {trueMatch && <span style={{ color: "#00ff00" }}> true</span>}
                              {falseMatch && <span style={{ color: "#ff6464" }}> false</span>}
                              {!trueMatch && !falseMatch && numMatch && <span style={{ color: "#ffa500" }}> {numMatch[1]}</span>}
                              {!trueMatch && !falseMatch && !numMatch && strMatch && <span style={{ color: "rgba(255,255,255,0.55)" }}> "{strMatch[1]}"</span>}
                              {!keyMatch && !trueMatch && !falseMatch && !numMatch && !strMatch && line}
                            </span>
                          );
                        })}
                    </pre>
                  </div>

                  {/* Issues list */}
                  {testAllReport.issues.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <span className="text-[9px] font-bold tracking-wider block" style={{ color: "rgba(255,100,100,0.6)" }}>
                        FAILED ENDPOINTS
                      </span>
                      {testAllReport.issues.map((issue, i) => (
                        <div
                          key={i}
                          className="px-3 py-2.5 rounded-lg"
                          style={{ background: "rgba(255,100,100,0.04)", border: "1px solid rgba(255,100,100,0.12)" }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(255,100,100,0.12)", color: "#ff6464" }}>
                              {issue.status || "ERR"}
                            </span>
                            <code className="text-[11px] font-mono" style={{ color: "#ffffff" }}>{issue.endpoint}</code>
                          </div>
                          <p className="text-[10px] pl-1" style={{ color: "rgba(255,100,100,0.7)" }}>{issue.error}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Rerun button */}
                  <button
                    onClick={runTestAll}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold tracking-wider transition-all"
                    style={{ background: "rgba(0,255,0,0.06)", color: "#00ff00", border: "1px solid rgba(0,255,0,0.15)" }}
                    data-testid="button-rerun-test-all"
                  >
                    <Zap className="w-3 h-3" /> RUN AGAIN
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {showSocialPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          data-testid="overlay-social-popup"
          onClick={handleDismissPopup}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5"
            style={{
              background: "#0a0a0a",
              border: "1px solid rgba(0,255,0,0.25)",
              boxShadow: "0 0 40px rgba(0,255,0,0.12), 0 20px 60px rgba(0,0,0,0.8)",
            }}
            onClick={(e) => e.stopPropagation()}
            data-testid="modal-social-popup"
          >
            <button
              onClick={handleDismissPopup}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:bg-white/10"
              style={{ color: "rgba(255,255,255,0.4)" }}
              data-testid="button-close-popup"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,255,0,0.08)", border: "1px solid rgba(0,255,0,0.2)" }}>
                <img src={wolfLogo} alt="WolfAPIs" className="w-6 h-6 object-contain" />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em]" style={{ color: "#00ff00", fontFamily: "'Orbitron', sans-serif" }}>SILENT WOLF</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Mad Tech Explorer</p>
              </div>
            </div>

            <div className="h-px w-full" style={{ background: "rgba(0,255,0,0.1)" }} />

            <div className="flex flex-col gap-3">
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl transition-all group"
                style={{ background: "rgba(0,255,0,0.04)", border: "1px solid rgba(0,255,0,0.12)" }}
                data-testid="link-popup-github"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,255,0,0.08)" }}>
                  <Github className="w-4 h-4" style={{ color: "#00ff00" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "#ffffff" }}>Follow on GitHub</p>
                  <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.4)" }}>github.com/SilentWolf-Kenya — more projects</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 opacity-40 group-hover:opacity-80 transition-opacity" style={{ color: "#00ff00" }} />
              </a>

              <a
                href="https://whatsapp.com/channel/0029Vb7Kd0h6GcGN1k8WYE0c"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl transition-all group"
                style={{ background: "rgba(37,211,102,0.04)", border: "1px solid rgba(37,211,102,0.15)" }}
                data-testid="link-popup-whatsapp"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(37,211,102,0.1)" }}>
                  <MessageSquare className="w-4 h-4" style={{ color: "#25D366" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "#ffffff" }}>Follow my Channel</p>
                  <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.4)" }}>WhatsApp — updates & announcements</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 opacity-40 group-hover:opacity-80 transition-opacity" style={{ color: "#25D366" }} />
              </a>
            </div>

            <button
              onClick={handleDismissPopup}
              className="w-full py-2.5 rounded-xl text-xs font-bold tracking-widest transition-all"
              style={{
                background: "rgba(0,255,0,0.08)",
                border: "1px solid rgba(0,255,0,0.2)",
                color: "#00ff00",
                fontFamily: "'Orbitron', sans-serif",
              }}
              data-testid="button-dismiss-popup"
            >
              DISMISS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
