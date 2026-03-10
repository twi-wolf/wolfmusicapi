import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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

  const getInputValue = (name: string) => inputs[name] ?? "";

  const updateInput = (name: string, value: string) => {
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const getFullUrl = () => {
    if (endpoint.method === "POST") return `${baseUrl}${endpoint.path}`;
    const params = endpoint.params
      .filter((p) => inputs[p.name])
      .map((p) => `${p.name}=${encodeURIComponent(inputs[p.name])}`)
      .join("&");
    return params ? `${baseUrl}${endpoint.path}?${params}` : `${baseUrl}${endpoint.path}`;
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
        const params = endpoint.params
          .filter((p) => inputs[p.name])
          .map((p) => `${p.name}=${encodeURIComponent(inputs[p.name])}`)
          .join("&");
        res = await fetch(`${endpoint.path}${params ? `?${params}` : ""}`);
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

function WelcomePage({ onCategoryClick, onTryEndpoint, mediaStatus }: { onCategoryClick: (id: string) => void; onTryEndpoint: (ep: ApiEndpoint) => void; mediaStatus?: MediaStatusData }) {
  const [globalSearch, setGlobalSearch] = useState("");
  const stats = [
    { label: "TOTAL ENDPOINTS", value: allEndpoints.length.toString(), icon: Globe, desc: "Across all categories" },
    { label: "AI MODELS", value: "35+", icon: Cpu, desc: "Multi-provider hub" },
    { label: "CATEGORIES", value: apiCategories.length.toString(), icon: Shield, desc: `${apiCategories.length} API groups` },
    { label: "PHOTO EFFECTS", value: `${ephotoEffectsList.length + photofuniaEffectsList.length}+`, icon: Sparkles, desc: "Ephoto & PhotoFunia" },
  ];

  return (
    <div className="px-3 py-4 sm:px-6 sm:py-6 space-y-6 sm:space-y-8">
      <div className="rounded-lg p-4 sm:p-6 lg:p-8" style={{
        background: "#000000",
        border: "1px solid rgba(0,255,0,0.12)",
      }}>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5" style={{ color: "#00ff00" }} />
            <span className="text-[11px] font-bold tracking-[0.25em]" style={{ color: "#00ff00" }}>
              APIS BY SILENT WOLF
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: "'Orbitron', sans-serif", color: "#ffffff" }} data-testid="text-hero-title">
            Multi-Provider API Hub
          </h2>
          <p className="text-sm sm:text-base max-w-xl" style={{ color: "rgba(255,255,255,0.4)" }}>
            {allEndpoints.length}+ endpoints across {apiCategories.length} categories.
            AI chat, image effects, social media downloaders, music tools, and OSINT utilities.
            All free, no API key required.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{
              border: "1px solid rgba(0,255,0,0.2)",
            }}>
              <div className="w-2 h-2 rounded-full" style={{ background: "#00ff00", boxShadow: "0 0 8px #00ff00" }} />
              <span className="text-[11px] font-semibold" style={{ color: "#00ff00" }}>ALL SYSTEMS LIVE</span>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded" style={{
              border: "1px solid rgba(0,255,0,0.12)",
              color: "rgba(255,255,255,0.35)",
            }}>v4.0</span>
          </div>
        </div>
      </div>

      <EndpointSearchBar
        endpoints={allEndpoints}
        searchQuery={globalSearch}
        setSearchQuery={setGlobalSearch}
        onSelectEndpoint={onTryEndpoint}
        placeholder={`Search all ${allEndpoints.length}+ endpoints... (e.g. neon, fire, translate, sticker)`}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="relative rounded-lg p-3 sm:p-5"
              style={{
                background: "#000000",
                border: "1px solid rgba(0,255,0,0.12)",
              }}
              data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <Icon
                className="absolute top-3 right-3 w-4 h-4 sm:w-5 sm:h-5"
                style={{ color: "rgba(0,255,0,0.4)" }}
              />
              <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider block mb-1 sm:mb-2 pr-5 leading-tight" style={{ color: "rgba(255,255,255,0.35)" }}>
                {stat.label}
              </span>
              <p className="text-xl sm:text-2xl font-bold" style={{ fontFamily: "'Orbitron', sans-serif", color: "#00ff00" }}>
                {stat.value}
              </p>
              <p className="text-[9px] sm:text-[10px] mt-1 sm:mt-2" style={{ color: "rgba(255,255,255,0.25)" }}>
                {stat.desc}
              </p>
            </div>
          );
        })}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-5">
          <Zap className="w-4 h-4" style={{ color: "#00ff00" }} />
          <h3 className="text-lg font-bold" style={{ fontFamily: "'Orbitron', sans-serif", color: "#00ff00" }}>
            API Categories
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
          {apiCategories.map((cat) => {
            const Icon = categoryIcons[cat.id] || Code2;
            const count = allEndpoints.filter(e => e.category === cat.id).length;
            return (
              <button
                key={cat.id}
                className="relative flex items-center gap-3 rounded-lg p-3 sm:p-4 text-left transition-all"
                style={{
                  background: "#000000",
                  border: "1px solid rgba(0,255,0,0.12)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,255,0,0.35)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(0,255,0,0.12)"; }}
                onClick={() => onCategoryClick(cat.id)}
                data-testid={`card-category-${cat.id}`}
              >
                <ArrowUpRight
                  className="absolute top-2.5 right-2.5 w-3 h-3"
                  style={{ color: "rgba(0,255,0,0.3)" }}
                />
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(0,255,0,0.08)", border: "1px solid rgba(0,255,0,0.15)" }}
                >
                  <Icon className="w-4 h-4" style={{ color: "#00ff00" }} />
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  <span className="text-sm font-bold block leading-tight" style={{ color: "#ffffff" }}>
                    {cat.name}
                  </span>
                  <span className="text-[11px] block mt-0.5 line-clamp-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {cat.description}
                  </span>
                  {MEDIA_STATUS_CATEGORIES.includes(cat.id) && (
                    <ProviderDots categoryId={cat.id} status={mediaStatus} />
                  )}
                </div>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded absolute bottom-2.5 right-2.5"
                  style={{ background: "rgba(0,255,0,0.08)", color: "#00ff00", border: "1px solid rgba(0,255,0,0.12)" }}
                >{count}</span>
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
  return (
    <section className="px-3 pt-4 pb-2 sm:px-6 sm:pt-6">
      <div className="rounded-lg p-4 sm:p-6" style={{
        background: "#000000",
        border: "1px solid rgba(0,255,0,0.12)",
      }}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" style={{ color: "#00ff00" }} />
            <span className="text-[10px] font-bold tracking-[0.2em]" style={{ color: "#00ff00" }}>
              {data.tagline}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: "'Orbitron', sans-serif", color: "#ffffff" }}>
            {data.title}
          </h3>
          <p className="text-sm max-w-lg" style={{ color: "rgba(255,255,255,0.35)" }}>
            {data.description}
          </p>
        </div>
      </div>
    </section>
  );
}

function DocumentationPage({ onNavigateToCategory }: { onNavigateToCategory?: (catId: string) => void }) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const links = [
    {
      title: "WhatsApp Group",
      description: "Join our community group for support, updates, and discussions",
      url: "https://chat.whatsapp.com/HjFc3pud3IA0R0WGr1V2Xu",
      icon: MessageSquare,
      color: "#25D366",
    },
    {
      title: "WhatsApp Channel",
      description: "Follow our channel for announcements and API updates",
      url: "https://whatsapp.com/channel/0029Vb6dn9nEQIaqEMNclK3Y",
      icon: Bell,
      color: "#25D366",
    },
    {
      title: "GitHub",
      description: "View source code, report issues, and contribute",
      url: "https://github.com/7silent-wolf",
      icon: Code2,
      color: "#ffffff",
    },
  ];

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4" style={{ color: "#00ff00" }} />
          <span
            className="text-[10px] font-bold tracking-[0.2em]"
            style={{ color: "#00ff00", fontFamily: "'Orbitron', sans-serif" }}
          >
            DOCUMENTATION & COMMUNITY
          </span>
        </div>
        <h2
          className="text-2xl font-bold mb-3"
          style={{ color: "#ffffff", fontFamily: "'Orbitron', sans-serif" }}
          data-testid="text-docs-title"
        >
          WolfAPIs Documentation
        </h2>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
          Everything you need to get started with the WolfAPIs platform. Join our community, explore the API, and build amazing things.
        </p>
      </div>

      <div className="mb-10">
        <h3
          className="text-sm font-bold tracking-wider mb-4"
          style={{ color: "#00ff00", fontFamily: "'Orbitron', sans-serif" }}
        >
          Community & Links
        </h3>
        <div className="grid gap-3 sm:grid-cols-1">
          {links.map((link) => (
            <a
              key={link.title}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 px-5 py-4 rounded-xl transition-all"
              style={{
                background: "#000000",
                border: "1px solid rgba(0,255,0,0.1)",
              }}
              data-testid={`link-${link.title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${link.color}15`, border: `1px solid ${link.color}30` }}
              >
                <link.icon className="w-5 h-5" style={{ color: link.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold" style={{ color: "#ffffff" }}>{link.title}</h4>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{link.description}</p>
              </div>
              <ExternalLink className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(255,255,255,0.2)" }} />
            </a>
          ))}
        </div>
      </div>

      <div className="mb-10">
        <h3
          className="text-sm font-bold tracking-wider mb-4"
          style={{ color: "#00ff00", fontFamily: "'Orbitron', sans-serif" }}
        >
          Quick Start
        </h3>
        <div className="rounded-xl p-5 space-y-4" style={{ background: "#000000", border: "1px solid rgba(0,255,0,0.1)" }}>
          <div>
            <h4 className="text-xs font-bold mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>Base URL</h4>
            <div className="flex items-center gap-2">
              <code
                className="text-xs px-3 py-2 rounded-lg flex-1 font-mono"
                style={{ background: "rgba(0,255,0,0.05)", color: "#00ff00", border: "1px solid rgba(0,255,0,0.1)" }}
              >
                {typeof window !== "undefined" ? window.location.origin : ""}
              </code>
              <CopyButton text={typeof window !== "undefined" ? window.location.origin : ""} />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>Example Request</h4>
            <div className="flex items-center gap-2">
              <code
                className="text-xs px-3 py-2 rounded-lg flex-1 font-mono overflow-x-auto"
                style={{ background: "rgba(0,255,0,0.05)", color: "#00ff00", border: "1px solid rgba(0,255,0,0.1)" }}
              >
                GET /api/fun/jokes
              </code>
              <CopyButton text={`${typeof window !== "undefined" ? window.location.origin : ""}/api/fun/jokes`} />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>Response Format</h4>
            <pre
              className="text-xs px-3 py-2 rounded-lg font-mono overflow-x-auto"
              style={{ background: "rgba(0,255,0,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(0,255,0,0.1)" }}
            >
{`{
  "success": true,
  "creator": "APIs by Silent Wolf | A tech explorer",
  "result": { ... }
}`}
            </pre>
          </div>
        </div>
      </div>

      <div className="mb-10">
        <h3
          className="text-sm font-bold tracking-wider mb-4"
          style={{ color: "#00ff00", fontFamily: "'Orbitron', sans-serif" }}
        >
          API Categories
        </h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {apiCategories.map((cat) => {
            const count = allEndpoints.filter(e => e.category === cat.id).length;
            const Icon = categoryIcons[cat.id] || Code2;
            return (
              <button
                key={cat.id}
                onClick={() => setExpandedCategory(cat.id)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all hover:bg-[#0a0a0a]"
                style={{ background: "#000000", border: "1px solid rgba(0,255,0,0.08)" }}
                data-testid={`docs-cat-${cat.id}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: "#00ff00" }} />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium" style={{ color: "#ffffff" }}>{cat.name}</span>
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(0,255,0,0.1)", color: "#00ff00" }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {expandedCategory && (() => {
        const cat = apiCategories.find(c => c.id === expandedCategory);
        if (!cat) return null;
        const catEndpoints = allEndpoints.filter(e => e.category === cat.id);
        const Icon = categoryIcons[cat.id] || Code2;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setExpandedCategory(null); }}
            data-testid="docs-popup-overlay"
          >
            <div
              className="w-full max-w-2xl max-h-[80vh] rounded-xl overflow-hidden flex flex-col"
              style={{ background: "#0a0a0a", border: "1px solid rgba(0,255,0,0.2)" }}
            >
              <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,255,0,0.1)" }}>
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" style={{ color: "#00ff00" }} />
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: "#ffffff", fontFamily: "'Orbitron', sans-serif" }}>{cat.name}</h3>
                    <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{cat.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(0,255,0,0.1)", color: "#00ff00" }}>{catEndpoints.length} endpoints</span>
                  {onNavigateToCategory && (
                    <button
                      onClick={() => { setExpandedCategory(null); onNavigateToCategory(cat.id); }}
                      className="text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                      style={{ background: "rgba(0,255,0,0.1)", color: "#00ff00", border: "1px solid rgba(0,255,0,0.2)" }}
                      data-testid={`btn-goto-${cat.id}`}
                    >
                      Try it →
                    </button>
                  )}
                  <button
                    onClick={() => setExpandedCategory(null)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[#1a1a1a]"
                    data-testid="btn-close-docs-popup"
                  >
                    <X className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto flex-1 p-4 space-y-2 hide-scrollbar">
                {catEndpoints.map((ep, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg px-3 py-2.5"
                    style={{ background: "rgba(0,255,0,0.03)", border: "1px solid rgba(0,255,0,0.06)" }}
                    data-testid={`docs-endpoint-${cat.id}-${idx}`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: ep.method === "POST" ? "rgba(255,165,0,0.15)" : "rgba(0,255,0,0.15)", color: ep.method === "POST" ? "#ffa500" : "#00ff00" }}
                      >
                        {ep.method}
                      </span>
                      <code className="text-[11px] font-mono" style={{ color: "#ffffff" }}>{ep.path}</code>
                      {ep.provider && <span className="text-[9px] ml-auto" style={{ color: "rgba(255,255,255,0.25)" }}>{ep.provider}</span>}
                    </div>
                    <p className="text-[10px] mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{ep.description}</p>
                    {ep.params && ep.params.length > 0 && (
                      <div className="space-y-1 mb-2">
                        <span className="text-[9px] font-bold" style={{ color: "rgba(255,255,255,0.25)" }}>PARAMETERS:</span>
                        {ep.params.map((p, pi) => (
                          <div key={pi} className="flex items-center gap-2 text-[10px]">
                            <code style={{ color: "#00ff00" }}>{p.name}</code>
                            <span style={{ color: "rgba(255,255,255,0.2)" }}>{p.type}</span>
                            {p.required && <span className="text-[8px] px-1 py-0.5 rounded" style={{ background: "rgba(255,100,100,0.15)", color: "#ff6464" }}>required</span>}
                            <span style={{ color: "rgba(255,255,255,0.3)" }}>{p.description}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div>
                      <span className="text-[9px] font-bold" style={{ color: "rgba(255,255,255,0.25)" }}>EXAMPLE:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <code
                          className="text-[10px] px-2 py-1 rounded font-mono flex-1 overflow-x-auto"
                          style={{ background: "rgba(0,255,0,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(0,255,0,0.08)" }}
                        >
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

      <div className="rounded-xl p-5" style={{ background: "#000000", border: "1px solid rgba(0,255,0,0.1)" }}>
        <h3
          className="text-sm font-bold tracking-wider mb-3"
          style={{ color: "#00ff00", fontFamily: "'Orbitron', sans-serif" }}
        >
          About
        </h3>
        <div className="space-y-2">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            WolfAPIs is a multi-provider API hub built by <span style={{ color: "#ffffff" }}>Silent Wolf</span> - a tech explorer.
            All APIs are free to use with no API key required.
          </p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            Version <span style={{ color: "#00ff00" }}>4.0</span> | {allEndpoints.length}+ endpoints | {apiCategories.length} categories
          </p>
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
  const [effectSearch, setEffectSearch] = useState("");
  const [copiedAllEndpoints, setCopiedAllEndpoints] = useState(false);
  const [ephotoExpanded, setEphotoExpanded] = useState(false);
  const [ephotoSubCategory, setEphotoSubCategory] = useState<string | null>(null);
  const [photofuniaExpanded, setPhotofuniaExpanded] = useState(false);
  const [photofuniaSubCategory, setPhotofuniaSubCategory] = useState<string | null>(null);

  const { data: mediaStatus } = useQuery<MediaStatusData>({
    queryKey: ["/api/media/status"],
    refetchInterval: 60 * 1000,
    staleTime: 60 * 1000,
  });

  const comingSoonCategories = ["security", "movie", "urlshortener"];
  const displayCategories = apiCategories.filter(cat => !comingSoonCategories.includes(cat.id));
  const soonCategories = apiCategories.filter(cat => comingSoonCategories.includes(cat.id));

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const handleTry = (ep: ApiEndpoint) => {
    setTestEndpoint(ep);
  };

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
          className="fixed inset-0 lg:hidden"
          style={{ zIndex: 40, background: "rgba(0,0,0,0.7)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen flex-shrink-0 overflow-y-auto overflow-x-hidden transition-all lg:translate-x-0 hide-scrollbar ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{
          width: sidebarWidth,
          zIndex: 45,
          background: "#080808",
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
            className="p-1 rounded-md transition-colors flex-shrink-0 hidden lg:block"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ color: "rgba(255,255,255,0.35)" }}
            data-testid="button-toggle-sidebar"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button
            className="lg:hidden ml-auto p-1.5 rounded flex-shrink-0"
            onClick={() => setSidebarOpen(false)}
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
              className="lg:hidden p-1.5 rounded-md"
              onClick={() => setSidebarOpen(true)}
              style={{ color: "rgba(255,255,255,0.5)" }}
              data-testid="button-open-sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

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
                href="https://github.com/7silent-wolf"
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
    </div>
  );
}
