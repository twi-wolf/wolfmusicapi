import { useState, useRef, useEffect } from "react";
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
  User,
} from "lucide-react";
import { allEndpoints, apiCategories, ephotoEffectsList, photofuniaEffectsList, type ApiEndpoint } from "@shared/schema";
import wolfLogo from "../assets/wolf-logo.png";

const categoryIcons: Record<string, typeof MessageSquare> = {
  "ai-chat": MessageSquare,
  "ai-tools": Wand2,
  "ai-image": Image,
  music: Music,
  tiktok: Video,
  instagram: Camera,
  "youtube-dl": Youtube,
  facebook: Facebook,
  spotify: Music2,
  shazam: AudioLines,
  ephoto: Sparkles,
  photofunia: ImagePlus,
  stalker: Eye,
};

const heroData: Record<string, { tagline: string; title: string; description: string }> = {
  "ai-chat": {
    tagline: "MULTI-PROVIDER AI HUB",
    title: "33+ AI Chat Models",
    description: "GPT-4o, Claude, Mistral, Gemini, DeepSeek, LLaMA, Mixtral, CodeLlama, and more. All through a single unified API.",
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
  tiktok: {
    tagline: "SOCIAL MEDIA",
    title: "TikTok Downloader",
    description: "Download TikTok videos without watermark in high quality.",
  },
  instagram: {
    tagline: "SOCIAL MEDIA",
    title: "Instagram Downloader",
    description: "Download Instagram videos, photos, reels, and stories.",
  },
  "youtube-dl": {
    tagline: "VIDEO DOWNLOAD",
    title: "YouTube Downloader",
    description: "Download YouTube videos in multiple formats and qualities.",
  },
  facebook: {
    tagline: "SOCIAL MEDIA",
    title: "Facebook Downloader",
    description: "Download Facebook videos in SD and HD quality.",
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
    description: "Filters, frames, faces, billboards, posters, drawings, and artistic photo effects via PhotoFunia.",
  },
  stalker: {
    tagline: "OSINT & PROFILE LOOKUP",
    title: "7 Stalker Tools",
    description: "GitHub, Twitter/X, Instagram, TikTok, IP geolocation, NPM, and WhatsApp channel lookup.",
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

function TestPopup({
  endpoint,
  baseUrl,
  onClose,
}: {
  endpoint: ApiEndpoint;
  baseUrl: string;
  onClose: () => void;
}) {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

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
          background: "#111111",
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
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="font-mono text-[10px] font-bold px-2 py-0.5 rounded"
                style={{
                  background: endpoint.method === "POST" ? "rgba(59,130,246,0.12)" : "rgba(0,255,0,0.12)",
                  color: endpoint.method === "POST" ? "#60a5fa" : "#00ff00",
                  border: endpoint.method === "POST" ? "1px solid rgba(59,130,246,0.2)" : "1px solid rgba(0,255,0,0.2)",
                }}
              >
                {endpoint.method}
              </span>
              <code className="text-sm font-mono" style={{ color: "#ffffff" }}>
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
                      value={inputs[p.name] || ""}
                      onChange={(e) => updateInput(p.name, e.target.value)}
                      placeholder={p.description}
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
        background: "#111111",
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
      <div className="flex items-center gap-2 flex-wrap pr-6">
        <span
          className="font-mono text-[10px] font-bold px-2 py-0.5 rounded"
          style={{
            background: endpoint.method === "POST" ? "rgba(59,130,246,0.1)" : "rgba(0,255,0,0.1)",
            color: endpoint.method === "POST" ? "#60a5fa" : "#00ff00",
            border: endpoint.method === "POST" ? "1px solid rgba(59,130,246,0.2)" : "1px solid rgba(0,255,0,0.2)",
          }}
        >
          {endpoint.method}
        </span>
        <code className="text-sm font-mono" style={{ color: "#ffffff" }}>
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
    <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid rgba(0,255,0,0.12)", background: "#111111" }}>
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

function WelcomePage({ onCategoryClick }: { onCategoryClick: (id: string) => void }) {
  const stats = [
    { label: "TOTAL ENDPOINTS", value: allEndpoints.length.toString(), icon: Globe, desc: "Across all categories" },
    { label: "AI MODELS", value: "33+", icon: Cpu, desc: "Multi-provider hub" },
    { label: "CATEGORIES", value: apiCategories.length.toString(), icon: Shield, desc: `${apiCategories.length} API groups` },
    { label: "PHOTO EFFECTS", value: `${ephotoEffectsList.length + photofuniaEffectsList.length}+`, icon: Sparkles, desc: "Ephoto & PhotoFunia" },
  ];

  return (
    <div className="px-6 py-8 space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="relative rounded-lg p-5"
              style={{
                background: "#111111",
                border: "1px solid rgba(0,255,0,0.12)",
              }}
              data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <Icon
                className="absolute top-4 right-4 w-5 h-5"
                style={{ color: "rgba(0,255,0,0.4)" }}
              />
              <span className="text-[10px] font-semibold tracking-wider block mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                {stat.label}
              </span>
              <p className="text-2xl font-bold" style={{ fontFamily: "'Orbitron', sans-serif", color: "#00ff00" }}>
                {stat.value}
              </p>
              <p className="text-[10px] mt-2" style={{ color: "rgba(255,255,255,0.25)" }}>
                {stat.desc}
              </p>
            </div>
          );
        })}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-5">
          <Zap className="w-4 h-4" style={{ color: "#00ff00" }} />
          <h3 className="text-lg font-bold italic" style={{ fontFamily: "'Orbitron', sans-serif", color: "#00ff00" }}>
            Quick Actions
          </h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {apiCategories.map((cat) => {
            const Icon = categoryIcons[cat.id] || Code2;
            const count = allEndpoints.filter(e => e.category === cat.id).length;
            return (
              <button
                key={cat.id}
                className="relative flex items-center gap-4 rounded-lg p-4 text-left transition-all"
                style={{
                  background: "#111111",
                  border: "1px solid rgba(0,255,0,0.12)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,255,0,0.35)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(0,255,0,0.12)"; }}
                onClick={() => onCategoryClick(cat.id)}
                data-testid={`card-category-${cat.id}`}
              >
                <ArrowUpRight
                  className="absolute top-3 right-3 w-3.5 h-3.5"
                  style={{ color: "rgba(0,255,0,0.3)" }}
                />
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(0,255,0,0.08)", border: "1px solid rgba(0,255,0,0.15)" }}
                >
                  <Icon className="w-4.5 h-4.5" style={{ color: "#00ff00" }} />
                </div>
                <div className="flex-1 min-w-0 pr-5">
                  <span className="text-sm font-bold block" style={{ color: "#ffffff" }}>
                    {cat.name}
                  </span>
                  <span className="text-[11px] block mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {count} endpoint{count !== 1 ? "s" : ""} available
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-5">
          <Globe className="w-4 h-4" style={{ color: "#00ff00" }} />
          <h3 className="text-lg font-bold italic" style={{ fontFamily: "'Orbitron', sans-serif", color: "#00ff00" }}>
            Server Plans
          </h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg p-5" style={{ background: "#111111", border: "1px solid rgba(0,255,0,0.12)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold tracking-wider" style={{ color: "#00ff00" }}>FREE TIER</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(0,255,0,0.1)", color: "#00ff00", border: "1px solid rgba(0,255,0,0.15)" }}>ACTIVE</span>
            </div>
            <p className="text-2xl font-bold mb-1" style={{ fontFamily: "'Orbitron', sans-serif", color: "#ffffff" }}>
              Free
            </p>
            <p className="text-[11px] mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>No API key required</p>
            <div className="space-y-2">
              {["Unlimited requests", `${allEndpoints.length}+ endpoints`, "All categories included", "JSON responses"].map(f => (
                <div key={f} className="flex items-center gap-2">
                  <Check className="w-3 h-3" style={{ color: "#00ff00" }} />
                  <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
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
    <section className="px-6 pt-6 pb-2">
      <div className="rounded-lg p-6" style={{
        background: "#111111",
        border: "1px solid rgba(0,255,0,0.12)",
      }}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" style={{ color: "#00ff00" }} />
            <span className="text-[10px] font-bold tracking-[0.2em]" style={{ color: "#00ff00" }}>
              {data.tagline}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold italic" style={{ fontFamily: "'Orbitron', sans-serif", color: "#ffffff" }}>
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

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [testEndpoint, setTestEndpoint] = useState<ApiEndpoint | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const handleTry = (ep: ApiEndpoint) => {
    setTestEndpoint(ep);
  };

  const handleCategoryClick = (id: string) => {
    setActiveCategory(id);
  };

  const filteredEndpoints = activeCategory ? allEndpoints.filter((e) => e.category === activeCategory) : [];
  const activeCategoryData = activeCategory ? apiCategories.find((c) => c.id === activeCategory) : null;

  const endpointCounts = apiCategories.map((cat) => ({
    ...cat,
    count: allEndpoints.filter((e) => e.category === cat.id).length,
  }));

  const isTableView = activeCategory === "ephoto" || activeCategory === "photofunia";

  const sidebarWidth = sidebarCollapsed ? "60px" : "240px";

  return (
    <div className="min-h-screen flex" style={{ background: "#0a0a0a" }}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 lg:hidden"
          style={{ zIndex: 40, background: "rgba(0,0,0,0.7)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen flex-shrink-0 overflow-y-auto overflow-x-hidden transition-all lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{
          width: sidebarWidth,
          zIndex: 45,
          background: "#0d0d0d",
          borderRight: "1px solid rgba(0,255,0,0.08)",
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
            title="Command Center"
          >
            <HomeIcon className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && (
              <span className="text-[13px] font-medium flex-1">Command Center</span>
            )}
            {!sidebarCollapsed && activeCategory === null && (
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#00ff00" }} />
            )}
          </button>

          {endpointCounts.map((cat) => {
            const Icon = categoryIcons[cat.id] || Code2;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all"
                style={{
                  color: isActive ? "#00ff00" : "rgba(255,255,255,0.5)",
                }}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSidebarOpen(false);
                }}
                data-testid={`nav-${cat.id}`}
                title={cat.name}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="text-[13px] font-medium flex-1 truncate">{cat.name}</span>
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#00ff00" }} />
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 min-w-0">
        <header
          className="sticky top-0"
          style={{
            zIndex: 30,
            background: "rgba(10,10,10,0.95)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(0,255,0,0.08)",
          }}
        >
          <div className="px-6 py-3 flex items-center gap-3">
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
                <h2 className="text-sm font-bold tracking-wider" style={{ color: "#ffffff", fontFamily: "'Orbitron', sans-serif" }}>
                  COMMAND CENTER
                </h2>
              ) : activeCategoryData ? (
                <>
                  {(() => {
                    const Icon = categoryIcons[activeCategoryData.id] || Code2;
                    return <Icon className="w-4 h-4 flex-shrink-0" style={{ color: "#00ff00" }} />;
                  })()}
                  <h2 className="text-sm font-bold tracking-wider" style={{ color: "#ffffff", fontFamily: "'Orbitron', sans-serif" }}>
                    {activeCategoryData.name.toUpperCase()}
                  </h2>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded"
                    style={{ background: "rgba(0,255,0,0.06)", color: "#00ff00", border: "1px solid rgba(0,255,0,0.12)" }}
                  >
                    {filteredEndpoints.length} endpoint{filteredEndpoints.length !== 1 ? "s" : ""}
                  </span>
                </>
              ) : null}
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ border: "1px solid rgba(0,255,0,0.12)" }}
                data-testid="status-endpoints"
              >
                <span className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {allEndpoints.length} APIs
                </span>
              </div>
              <Bell className="w-4 h-4 hidden sm:block" style={{ color: "rgba(255,255,255,0.3)" }} />
              <div className="flex items-center gap-2 px-2 py-1 rounded-lg" style={{ border: "1px solid rgba(0,255,0,0.1)" }}>
                <User className="w-4 h-4" style={{ color: "#00ff00" }} />
                <span className="text-[11px] hidden sm:inline" style={{ color: "rgba(255,255,255,0.5)" }}>wolf</span>
              </div>
            </div>
          </div>
        </header>

        {activeCategory === null ? (
          <>
            <div className="px-6 pt-6 pb-2">
              <h2 className="text-2xl sm:text-3xl font-bold italic" style={{ fontFamily: "'Orbitron', sans-serif", color: "#ffffff" }}>
                Command Center
              </h2>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                Welcome back, wolf
              </p>
            </div>
            <WelcomePage onCategoryClick={handleCategoryClick} />
          </>
        ) : (
          <>
            <HeroSection categoryId={activeCategory} />

            <section className="px-6 py-5">
              {isTableView ? (
                <EffectTable endpoints={filteredEndpoints} onTry={handleTry} />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredEndpoints.map((ep) => (
                    <EndpointCard key={ep.path} endpoint={ep} onTry={handleTry} />
                  ))}
                </div>
              )}

              {filteredEndpoints.length === 0 && (
                <div className="text-center py-16">
                  <Code2 className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.1)" }} />
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
                    No endpoints in this category yet.
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
