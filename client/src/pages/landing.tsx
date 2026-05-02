import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  Zap, Music, Video, MessageSquare, Image, Shield, Globe, Cpu, Sparkles,
  AudioLines, Search, Film, Laugh, Link, Wrench, Trophy, TrendingUp,
  RefreshCw, Headphones, Eye, ArrowRight, Github, ExternalLink, Share2,
  Code2, Terminal, ChevronRight, Activity, Wand2, Loader2
} from "lucide-react";
import wolfLogo from "../assets/wolf-logo.png";
import { allEndpoints, apiCategories, ephotoEffectsList, photofuniaEffectsList, AUDIO_EFFECTS_LIST } from "@shared/schema";

const NEON = "#00ff00";
const NEON_DIM = "rgba(0,255,0,0.12)";

function useCountUp(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0,255,0,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,0,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,255,0,0.08) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

function GlowOrb({ x, y, size, opacity }: { x: string; y: string; size: string; opacity: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(0,255,0,${opacity * 0.55}) 0%, transparent 70%)`,
        filter: "blur(50px)",
        pointerEvents: "none",
      }}
    />
  );
}

const HERO_ENDPOINTS = [
  {
    path: "/api/ai/gpt4o",
    params: "?q=Tell+me+something+cool",
    label: "AI Chat",
    response: `{
  "success": true,
  "model": "gpt-4o",
  "response": "Did you know honey never
  spoils? 3000-year-old honey from
  Egyptian tombs is still edible."
}`,
  },
  {
    path: "/api/music/download",
    params: "?url=youtu.be/abc123",
    label: "Music DL",
    response: `{
  "success": true,
  "title": "Blinding Lights",
  "artist": "The Weeknd",
  "quality": "320kbps",
  "url": "https://cdn.wolf.../mp3"
}`,
  },
  {
    path: "/api/quran/random",
    params: "",
    label: "Quran",
    response: `{
  "success": true,
  "reference": "Al-Baqarah 2:255",
  "translation": "Allah — there is no
  deity except Him, the Ever-Living,
  the Sustainer of existence."
}`,
  },
  {
    path: "/api/pokemon/info",
    params: "?name=pikachu",
    label: "Pokemon",
    response: `{
  "success": true,
  "name": "pikachu",
  "types": ["electric"],
  "hp": 35,
  "speed": 90
}`,
  },
  {
    path: "/api/nasa/neo",
    params: "",
    label: "NASA",
    response: `{
  "success": true,
  "date": "2026-05-02",
  "count": 2,
  "hazardous": 0,
  "objects": [...]
}`,
  },
];

function LiveApiCard() {
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [charIdx, setCharIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoading(true);
      setVisible(false);
      setCharIdx(0);
      setTimeout(() => {
        setCurrent(prev => (prev + 1) % HERO_ENDPOINTS.length);
        setLoading(false);
        setVisible(true);
      }, 800);
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  const endpoint = HERO_ENDPOINTS[current];
  const fullResponse = endpoint.response;

  useEffect(() => {
    if (!visible) { setCharIdx(0); return; }
    if (charIdx >= fullResponse.length) return;
    const t = setTimeout(() => setCharIdx(p => Math.min(p + 4, fullResponse.length)), 10);
    return () => clearTimeout(t);
  }, [visible, charIdx, fullResponse]);

  return (
    <div
      className="rounded-2xl overflow-hidden relative"
      style={{
        background: "linear-gradient(135deg, #0a0a0a 0%, #060606 100%)",
        border: "1px solid rgba(0,255,0,0.18)",
        boxShadow: "0 0 80px rgba(0,255,0,0.07), 0 0 0 1px rgba(0,255,0,0.05), inset 0 1px 0 rgba(0,255,0,0.06)",
      }}
    >
      <div
        style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,255,0,0.04) 0%, transparent 70%)",
        }}
      />

      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ background: "rgba(0,0,0,0.4)", borderBottom: "1px solid rgba(0,255,0,0.08)" }}>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: "rgba(255,95,87,0.7)" }} />
          <div className="w-3 h-3 rounded-full" style={{ background: "rgba(254,188,46,0.7)" }} />
          <div className="w-3 h-3 rounded-full" style={{ background: "rgba(40,200,64,0.7)" }} />
        </div>
        <span className="text-[11px] ml-2" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace" }}>
          api-explorer — {endpoint.label}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: NEON, boxShadow: `0 0 6px ${NEON}` }} />
          <span style={{ color: NEON, fontSize: "9px", letterSpacing: "0.12em", fontFamily: "'JetBrains Mono', monospace" }}>LIVE</span>
        </div>
      </div>

      {/* Request line */}
      <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(0,0,0,0.2)" }}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(0,255,0,0.1)", color: NEON, fontFamily: "'JetBrains Mono', monospace" }}>GET</span>
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", fontFamily: "'JetBrains Mono', monospace" }}>apis.xwolf.space</span>
          <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "12px", fontFamily: "'JetBrains Mono', monospace" }}>{endpoint.path}</span>
        </div>
        {endpoint.params && (
          <div style={{ color: "rgba(0,255,0,0.55)", fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", marginTop: "4px" }}>
            {endpoint.params}
          </div>
        )}
      </div>

      {/* Response */}
      <div className="px-5 py-4" style={{ minHeight: "180px" }}>
        {loading ? (
          <div className="flex items-center gap-2 pt-4">
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: "rgba(0,255,0,0.5)" }} />
            <span style={{ color: "rgba(0,255,0,0.4)", fontSize: "12px", fontFamily: "'JetBrains Mono', monospace" }}>
              fetching response...
            </span>
          </div>
        ) : (
          <pre style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: "12px",
            fontFamily: "'JetBrains Mono', monospace",
            lineHeight: "1.65",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            margin: 0,
          }}>
            {fullResponse.slice(0, charIdx)}
            {charIdx < fullResponse.length && (
              <span style={{ opacity: 0.8, color: NEON }}>▌</span>
            )}
          </pre>
        )}
      </div>

      {/* Endpoint tabs */}
      <div className="px-4 pb-4 flex items-center gap-1.5 flex-wrap">
        {HERO_ENDPOINTS.map((ep, i) => (
          <button
            key={i}
            onClick={() => { setCurrent(i); setVisible(true); setCharIdx(0); setLoading(false); }}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              padding: "3px 10px",
              borderRadius: "100px",
              background: i === current ? "rgba(0,255,0,0.1)" : "transparent",
              color: i === current ? NEON : "rgba(255,255,255,0.25)",
              border: i === current ? "1px solid rgba(0,255,0,0.25)" : "1px solid rgba(255,255,255,0.06)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {ep.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const FEATURES = [
  {
    id: "ai",
    icon: MessageSquare,
    label: "AI Hub",
    tagline: "35+ AI Models",
    desc: "GPT-4o, Claude, Gemini, DeepSeek, Mistral, LLaMA & more through one unified API.",
    color: "#00ff00",
  },
  {
    id: "music",
    icon: Music,
    label: "Music & Media",
    tagline: "15 Download Endpoints",
    desc: "YouTube search, MP3/MP4 downloads, lyrics, trending charts & Spotify tools.",
    color: "#00ff00",
  },
  {
    id: "social",
    icon: Share2,
    label: "Social Downloader",
    tagline: "14 Platforms",
    desc: "TikTok, Instagram, Facebook, Twitter/X — video, audio, reels, stories & more.",
    color: "#00ff00",
  },
  {
    id: "audio",
    icon: Headphones,
    label: "Audio Effects",
    tagline: `${AUDIO_EFFECTS_LIST.length} Effects`,
    desc: "Bass boost, 8D, nightcore, echo, reverb, distortion, karaoke, underwater & more.",
    color: "#00ff00",
  },
  {
    id: "effects",
    icon: Sparkles,
    label: "Photo & Text FX",
    tagline: `${ephotoEffectsList.length + photofuniaEffectsList.length}+ Effects`,
    desc: "Neon, 3D, fire, glitch & artistic text effects. Photo filters, billboards & frames.",
    color: "#00ff00",
  },
  {
    id: "security",
    icon: Shield,
    label: "Security & OSINT",
    tagline: "38 Endpoints",
    desc: "DNS lookup, WHOIS, port scanning, SSL checks, WAF detection & vulnerability scans.",
    color: "#00ff00",
  },
  {
    id: "movies",
    icon: Film,
    label: "Movies & Sports",
    tagline: "37 Endpoints",
    desc: "TMDB movie database + live sports scores, fixtures, standings & player stats.",
    color: "#00ff00",
  },
  {
    id: "tools",
    icon: Wrench,
    label: "Dev Tools",
    tagline: "21+ Utilities",
    desc: "QR codes, weather, dictionary, Base64, hashing, UUID, URL shorteners & image hosting.",
    color: "#00ff00",
  },
  {
    id: "economy",
    icon: TrendingUp,
    label: "Financial Data",
    tagline: "10 Endpoints",
    desc: "Forex rates, crypto prices, stock data, gold prices, GDP, inflation & crypto wallets.",
    color: "#00ff00",
  },
];

const DEMO_ENDPOINTS = [
  { label: "Music Search", path: "/api/search?q=blinding+lights", tag: "music" },
  { label: "AI Chat", path: "/api/ai/gpt4o?q=Say+hello", tag: "ai" },
  { label: "Trending", path: "/api/trending?country=US", tag: "music" },
  { label: "8D Audio", path: "/api/audio/8d?url=...", tag: "audio" },
  { label: "Shorten URL", path: "/api/shorten/tinyurl?url=...", tag: "tools" },
  { label: "QR Code", path: "/api/qr?text=wolfapis", tag: "tools" },
  { label: "Weather", path: "/api/weather?city=Nairobi", tag: "tools" },
  { label: "Neon Text", path: "/api/ephoto/neon?text=WOLF", tag: "effects" },
];

function TerminalDemo() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const baseUrl = window.location.origin;

  useEffect(() => {
    const ep = DEMO_ENDPOINTS[activeIdx];
    setTyped("");
    setResponse(null);
    let i = 0;
    const url = `${baseUrl}${ep.path}`;
    const str = `GET ${url}`;
    const t = setInterval(() => {
      i++;
      setTyped(str.slice(0, i));
      if (i >= str.length) {
        clearInterval(t);
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
          setResponse(JSON.stringify({ success: true, source: "wolfapis", endpoint: ep.path }, null, 2));
        }, 800);
      }
    }, 18);
    return () => clearInterval(t);
  }, [activeIdx]);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "#050505", border: "1px solid rgba(0,255,0,0.2)", fontFamily: "'JetBrains Mono', monospace" }}
    >
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid rgba(0,255,0,0.1)", background: "#0a0a0a" }}>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: "#ff5f57" }} />
          <div className="w-3 h-3 rounded-full" style={{ background: "#febc2e" }} />
          <div className="w-3 h-3 rounded-full" style={{ background: "#28c840" }} />
        </div>
        <span className="text-[11px] ml-2" style={{ color: "rgba(255,255,255,0.3)" }}>wolfapis — terminal</span>
        <div className="ml-auto flex gap-1">
          {HERO_ENDPOINTS.map((ep, i) => (
            <button
              key={ep.label}
              onClick={() => setActiveIdx(i)}
              className="px-2 py-0.5 rounded text-[9px] transition-all"
              style={{
                background: i === activeIdx ? "rgba(0,255,0,0.12)" : "transparent",
                border: i === activeIdx ? "1px solid rgba(0,255,0,0.3)" : "1px solid transparent",
                color: i === activeIdx ? "#00ff00" : "rgba(255,255,255,0.25)",
              }}
              data-testid={`button-demo-${ep.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {ep.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-5 space-y-3 min-h-[160px]">
        <div className="flex items-start gap-2">
          <span style={{ color: NEON }}>$</span>
          <span className="text-sm break-all" style={{ color: "rgba(255,255,255,0.8)" }}>
            curl <span style={{ color: "#60a5fa" }}>{typed}</span>
            <span className="animate-pulse" style={{ color: NEON }}>|</span>
          </span>
        </div>
        {loading && (
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 animate-pulse" style={{ color: NEON }} />
            <span className="text-xs" style={{ color: "rgba(0,255,0,0.6)" }}>Fetching response...</span>
          </div>
        )}
        {response && (
          <pre className="text-xs leading-relaxed overflow-auto" style={{ color: NEON, maxHeight: "120px" }}>
            {response}
          </pre>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, suffix = "", delay = 0 }: { label: string; value: number; suffix?: string; delay?: number }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const count = useCountUp(value, 1600, visible);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setTimeout(() => setVisible(true), delay); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: "'Orbitron', sans-serif", color: NEON, textShadow: `0 0 10px rgba(0,255,0,0.2)` }}>
        {count}{suffix}
      </div>
      <div className="text-[11px] mt-1 tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</div>
    </div>
  );
}

export default function Landing() {
  const [, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ background: "#000000", minHeight: "100vh", color: "#ffffff", fontFamily: "'JetBrains Mono', monospace" }}>

      {/* NAV */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all"
        style={{
          background: scrolled ? "rgba(0,0,0,0.92)" : "transparent",
          borderBottom: scrolled ? "1px solid rgba(0,255,0,0.1)" : "1px solid transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ border: "1px solid rgba(0,255,0,0.3)", background: "rgba(0,255,0,0.05)" }}
            >
              <img src={wolfLogo} alt="WolfAPIs" className="w-5 h-5 object-contain" />
            </div>
            <span className="font-bold tracking-[0.15em] text-sm" style={{ fontFamily: "'Orbitron', sans-serif", color: NEON }}>
              WOLF<span style={{ color: "#ffffff" }}>APIs</span>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="https://github.com/SilentWolf-Kenya"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg transition-all"
              style={{ color: "rgba(255,255,255,0.5)", border: "1px solid transparent" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = NEON_DIM; (e.currentTarget as HTMLElement).style.color = NEON; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"; }}
              data-testid="link-nav-github"
            >
              <Github className="w-4 h-4" />
            </a>
            <button
              onClick={() => setLocation("/home")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold tracking-wide transition-all"
              style={{ background: NEON, color: "#000000", fontFamily: "'Orbitron', sans-serif", fontSize: "11px" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(0,255,0,0.4)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}
              data-testid="button-nav-explore"
            >
              EXPLORE APIs <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center px-4 sm:px-6 pt-16 pb-8 overflow-hidden">
        <GridBackground />
        <GlowOrb x="-10%" y="20%" size="700px" opacity={0.06} />
        <GlowOrb x="60%" y="65%" size="500px" opacity={0.04} />
        <GlowOrb x="45%" y="-15%" size="450px" opacity={0.07} />

        {/* Horizontal scan line */}
        <div
          style={{
            position: "absolute",
            top: "38%",
            left: 0,
            right: 0,
            height: "1px",
            background: "linear-gradient(90deg, transparent 0%, rgba(0,255,0,0.06) 20%, rgba(0,255,0,0.12) 50%, rgba(0,255,0,0.06) 80%, transparent 100%)",
            pointerEvents: "none",
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center py-16 lg:py-24">

            {/* LEFT COLUMN */}
            <div className="space-y-7">

              {/* Status badge */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full w-fit"
                style={{ border: "1px solid rgba(0,255,0,0.22)", background: "rgba(0,255,0,0.04)" }}
              >
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: NEON, boxShadow: `0 0 8px ${NEON}` }} />
                <span className="font-bold tracking-[0.18em]" style={{ color: NEON, fontSize: "10px" }}>
                  ALL SYSTEMS LIVE · NO KEY REQUIRED
                </span>
              </div>

              {/* Logo + Headline */}
              <div className="space-y-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{
                    border: "1px solid rgba(0,255,0,0.25)",
                    background: "rgba(0,255,0,0.05)",
                    boxShadow: "0 0 40px rgba(0,255,0,0.12), inset 0 0 20px rgba(0,255,0,0.04)",
                  }}
                >
                  <img src={wolfLogo} alt="WolfAPIs" className="w-9 h-9 object-contain" />
                </div>
                <h1
                  className="font-black leading-[0.9] tracking-tight"
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: "clamp(52px, 8vw, 88px)",
                  }}
                  data-testid="text-hero-headline"
                >
                  <span style={{ color: "#ffffff" }}>WOLF</span>
                  <span style={{ color: NEON, textShadow: "0 0 40px rgba(0,255,0,0.4)" }}>APIs</span>
                </h1>
                <p
                  className="tracking-[0.22em] font-semibold"
                  style={{ fontFamily: "'Orbitron', sans-serif", color: "rgba(255,255,255,0.3)", fontSize: "11px" }}
                >
                  THE ULTIMATE API HUB
                </p>
              </div>

              {/* Description */}
              <p className="leading-relaxed" style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", maxWidth: "460px" }}>
                {allEndpoints.length}+ endpoints — AI models, music downloaders, social scrapers,
                audio effects, photo tools, anime, Quran, Pokemon, NASA & more.
                One base URL. Zero sign-up.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <button
                  onClick={() => setLocation("/home")}
                  className="flex items-center gap-2.5 rounded-xl font-bold tracking-widest transition-all"
                  style={{
                    background: NEON,
                    color: "#000000",
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: "11px",
                    padding: "13px 26px",
                    boxShadow: "0 0 32px rgba(0,255,0,0.3)",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 55px rgba(0,255,0,0.55)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 32px rgba(0,255,0,0.3)"; (e.currentTarget as HTMLElement).style.transform = "none"; }}
                  data-testid="button-hero-explore"
                >
                  <Terminal className="w-4 h-4" /> EXPLORE APIs
                </button>
                <a
                  href="https://github.com/SilentWolf-Kenya"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-xl font-bold tracking-widest transition-all"
                  style={{
                    background: "transparent",
                    color: "rgba(255,255,255,0.65)",
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: "11px",
                    padding: "12px 26px",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,255,0,0.35)"; (e.currentTarget as HTMLElement).style.color = NEON; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)"; (e.currentTarget as HTMLElement).style.transform = "none"; }}
                  data-testid="link-hero-github"
                >
                  <Github className="w-4 h-4" /> GITHUB
                </a>
              </div>

              {/* Stats row */}
              <div
                className="flex items-center gap-8 pt-4"
                style={{ borderTop: "1px solid rgba(0,255,0,0.08)" }}
              >
                {[
                  { v: `${allEndpoints.length}+`, l: "ENDPOINTS" },
                  { v: "35+", l: "AI MODELS" },
                  { v: `${apiCategories.length}`, l: "CATEGORIES" },
                ].map(s => (
                  <div key={s.l}>
                    <div style={{ fontFamily: "'Orbitron', sans-serif", color: NEON, fontSize: "22px", fontWeight: 900, textShadow: "0 0 16px rgba(0,255,0,0.3)" }}>{s.v}</div>
                    <div style={{ color: "rgba(255,255,255,0.28)", fontSize: "9px", letterSpacing: "0.15em", marginTop: "3px" }}>{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Tags */}
              <div className="flex items-center gap-2 flex-wrap">
                {["GPT-4o", "Claude", "TikTok DL", "MP3 DL", "8D Audio", "Neon FX", "OSINT", "Quran", "NASA"].map(tag => (
                  <span
                    key={tag}
                    style={{
                      border: "1px solid rgba(0,255,0,0.1)",
                      color: "rgba(255,255,255,0.28)",
                      background: "rgba(0,255,0,0.02)",
                      fontSize: "10px",
                      padding: "3px 10px",
                      borderRadius: "100px",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN — Live API Preview */}
            <div className="hidden lg:block">
              <LiveApiCard />
            </div>
          </div>
        </div>

        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce"
          style={{ color: "rgba(0,255,0,0.3)" }}
        >
          <div className="w-px h-8" style={{ background: "linear-gradient(to bottom, transparent, rgba(0,255,0,0.4))" }} />
          <ChevronRight className="w-4 h-4 rotate-90" />
        </div>
      </section>

      {/* STATS */}
      <section className="relative py-16 overflow-hidden" style={{ borderTop: "1px solid rgba(0,255,0,0.08)", borderBottom: "1px solid rgba(0,255,0,0.08)" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 100% 100% at 50% 50%, rgba(0,255,0,0.03) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12">
            <StatCard label="TOTAL ENDPOINTS" value={allEndpoints.length} suffix="+" delay={0} />
            <StatCard label="AI MODELS" value={35} suffix="+" delay={100} />
            <StatCard label="AUDIO EFFECTS" value={AUDIO_EFFECTS_LIST.length} delay={200} />
            <StatCard label="PHOTO EFFECTS" value={ephotoEffectsList.length + photofuniaEffectsList.length} suffix="+" delay={300} />
          </div>
        </div>
      </section>

      {/* TERMINAL DEMO */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <div className="h-px flex-1 max-w-16" style={{ background: "rgba(0,255,0,0.2)" }} />
              <span className="text-[11px] font-bold tracking-[0.25em]" style={{ color: "rgba(0,255,0,0.6)" }}>LIVE DEMO</span>
              <div className="h-px flex-1 max-w-16" style={{ background: "rgba(0,255,0,0.2)" }} />
            </div>
            <h2
              className="text-2xl sm:text-3xl font-bold"
              style={{ fontFamily: "'Orbitron', sans-serif", color: "#ffffff" }}
            >
              One API. Infinite possibilities.
            </h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              Simple GET requests. No authentication. No rate limit headaches.
            </p>
          </div>
          <TerminalDemo />
          <div className="flex items-center justify-center">
            <button
              onClick={() => setLocation("/home")}
              className="flex items-center gap-2 text-sm transition-all"
              style={{ color: "rgba(0,255,0,0.6)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = NEON}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(0,255,0,0.6)"}
              data-testid="button-demo-view-all"
            >
              View all {allEndpoints.length}+ endpoints <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-20 px-4 sm:px-6" style={{ borderTop: "1px solid rgba(0,255,0,0.06)" }}>
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-[11px] font-bold tracking-[0.25em]" style={{ color: NEON }}>WHAT'S INSIDE</span>
            <h2 className="text-2xl sm:text-4xl font-bold" style={{ fontFamily: "'Orbitron', sans-serif", color: "#ffffff" }}>
              {apiCategories.length} API Categories
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.id}
                  className="group rounded-xl p-5 space-y-3 cursor-pointer transition-all"
                  style={{
                    background: "#050505",
                    border: "1px solid rgba(0,255,0,0.1)",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,255,0,0.35)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(0,255,0,0.03)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,255,0,0.1)";
                    (e.currentTarget as HTMLElement).style.background = "#050505";
                  }}
                  onClick={() => setLocation("/home")}
                  data-testid={`card-feature-${f.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(0,255,0,0.07)", border: "1px solid rgba(0,255,0,0.15)" }}
                    >
                      <Icon className="w-5 h-5" style={{ color: NEON }} />
                    </div>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded"
                      style={{ background: "rgba(0,255,0,0.06)", color: "rgba(0,255,0,0.7)", border: "1px solid rgba(0,255,0,0.12)" }}
                    >
                      {f.tagline}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm mb-1" style={{ color: "#ffffff", fontFamily: "'Orbitron', sans-serif", fontSize: "13px" }}>
                      {f.label}
                    </h3>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
                      {f.desc}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] transition-all" style={{ color: "rgba(0,255,0,0.35)" }}>
                    <span>Explore</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHY SECTION */}
      <section className="py-20 px-4 sm:px-6" style={{ borderTop: "1px solid rgba(0,255,0,0.06)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-3 mb-12">
            <span className="text-[11px] font-bold tracking-[0.25em]" style={{ color: NEON }}>WHY WOLFAPIS</span>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: "'Orbitron', sans-serif", color: "#ffffff" }}>
              Built different.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: Zap,
                title: "Zero Setup",
                desc: "No API keys. No sign-up. No authentication. Just make a GET request and get a response.",
              },
              {
                icon: Globe,
                title: "Multi-Provider",
                desc: "Every endpoint falls back across multiple providers ensuring maximum uptime and reliability.",
              },
              {
                icon: Code2,
                title: "Developer First",
                desc: "Clean JSON responses, consistent error formats, live API explorer, and copyable curl commands.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-xl p-6 text-center space-y-4"
                  style={{ background: "#050505", border: "1px solid rgba(0,255,0,0.1)" }}
                  data-testid={`card-why-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto"
                    style={{ background: "rgba(0,255,0,0.06)", border: "1px solid rgba(0,255,0,0.15)" }}
                  >
                    <Icon className="w-6 h-6" style={{ color: NEON }} />
                  </div>
                  <h3 className="font-bold" style={{ fontFamily: "'Orbitron', sans-serif", color: "#ffffff", fontSize: "14px" }}>
                    {item.title}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 relative overflow-hidden" style={{ borderTop: "1px solid rgba(0,255,0,0.08)" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,255,0,0.05) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <GridBackground />
        <div className="relative z-10 max-w-2xl mx-auto text-center space-y-8">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto"
            style={{
              border: "1px solid rgba(0,255,0,0.25)",
              background: "rgba(0,255,0,0.04)",
              boxShadow: "0 0 40px rgba(0,255,0,0.1)",
            }}
          >
            <img src={wolfLogo} alt="WolfAPIs" className="w-12 h-12 object-contain" />
          </div>
          <h2
            className="text-3xl sm:text-5xl font-black"
            style={{ fontFamily: "'Orbitron', sans-serif", color: "#ffffff" }}
          >
            Ready to build?
          </h2>
          <p className="text-sm sm:text-base" style={{ color: "rgba(255,255,255,0.4)" }}>
            {allEndpoints.length}+ free endpoints. No registration. No rate limits.
            Start calling APIs in seconds.
          </p>
          <button
            onClick={() => setLocation("/home")}
            className="inline-flex items-center gap-3 px-10 py-4 rounded-xl font-black tracking-widest transition-all"
            style={{
              background: NEON,
              color: "#000000",
              fontFamily: "'Orbitron', sans-serif",
              fontSize: "13px",
              boxShadow: "0 0 40px rgba(0,255,0,0.3)",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 0 70px rgba(0,255,0,0.6)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px rgba(0,255,0,0.3)"}
            data-testid="button-cta-explore"
          >
            <Terminal className="w-5 h-5" /> OPEN API EXPLORER
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className="py-10 px-4 sm:px-6"
        style={{ borderTop: "1px solid rgba(0,255,0,0.08)", background: "#020202" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src={wolfLogo} alt="WolfAPIs" className="w-6 h-6 object-contain" style={{ opacity: 0.7 }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              <span style={{ color: "rgba(0,255,0,0.5)", fontFamily: "'Orbitron', sans-serif" }}>WolfAPIs</span>
              {" "}· Built by <span style={{ color: "rgba(255,255,255,0.5)" }}>Silent Wolf</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/SilentWolf-Kenya"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs transition-all"
              style={{ color: "rgba(255,255,255,0.3)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = NEON}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.3)"}
              data-testid="link-footer-github"
            >
              <Github className="w-3.5 h-3.5" /> GitHub
            </a>
            <a
              href="https://whatsapp.com/channel/0029Vb7Kd0h6GcGN1k8WYE0c"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs transition-all"
              style={{ color: "rgba(255,255,255,0.3)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#25D366"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.3)"}
              data-testid="link-footer-whatsapp"
            >
              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
            </a>
            <button
              onClick={() => setLocation("/home")}
              className="flex items-center gap-1.5 text-xs transition-all"
              style={{ color: "rgba(255,255,255,0.3)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#ffffff"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.3)"}
              data-testid="link-footer-docs"
            >
              <Code2 className="w-3.5 h-3.5" /> API Docs
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
