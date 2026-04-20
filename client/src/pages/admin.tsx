import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard, ScrollText, Settings, Shield, Cpu,
  RefreshCw, LogOut, ChevronUp, ChevronDown, Trash2,
  Plus, Save, Eye, EyeOff, Zap, RotateCcw, Activity,
  CheckCircle, XCircle, Clock, AlertTriangle, Globe, Github, Code, Server
} from "lucide-react";

const NEON = "#00ff00";
const AUTH_KEY = "wolf_admin_pwd";

function api(path: string, opts: RequestInit = {}, pwd?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(opts.headers as Record<string, string> || {}) };
  const p = pwd || sessionStorage.getItem(AUTH_KEY) || "";
  if (p) headers["x-admin-password"] = p;
  return fetch(path, { ...opts, headers });
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (pwd: string) => void }) {
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });
      if (r.ok) {
        sessionStorage.setItem(AUTH_KEY, pwd);
        onLogin(pwd);
      } else {
        setErr("Incorrect password.");
      }
    } catch {
      setErr("Connection error. Try again.");
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 380, padding: "0 16px" }}>
        <div style={{ background: "#0a0a0a", border: `1px solid rgba(0,255,0,0.15)`, borderRadius: 16, padding: "36px 32px" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ width: 48, height: 48, background: "rgba(0,255,0,0.08)", border: `1px solid rgba(0,255,0,0.2)`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Shield size={22} color={NEON} />
            </div>
            <h1 style={{ fontFamily: "'Orbitron', sans-serif", color: NEON, fontSize: 20, fontWeight: 700, margin: 0 }}>WOLF ADMIN</h1>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 6 }}>apis.xwolf.space control panel</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ position: "relative", marginBottom: 12 }}>
              <input
                type={show ? "text" : "password"}
                value={pwd}
                onChange={(e) => { setPwd(e.target.value); setErr(""); }}
                placeholder="Admin password"
                autoFocus
                style={{ width: "100%", background: "#111", border: `1px solid ${err ? "rgba(255,80,80,0.5)" : "rgba(0,255,0,0.15)"}`, borderRadius: 8, padding: "10px 40px 10px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
              <button type="button" onClick={() => setShow(!show)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 0 }}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {err && <p style={{ color: "#ff6b6b", fontSize: 12, margin: "0 0 10px" }}>{err}</p>}
            <button type="submit" disabled={loading} style={{ width: "100%", background: "rgba(0,255,0,0.1)", border: `1px solid rgba(0,255,0,0.3)`, borderRadius: 8, padding: "10px 0", color: NEON, fontFamily: "'Orbitron', sans-serif", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", letterSpacing: "0.05em" }}>
              {loading ? "VERIFYING..." : "LOGIN"}
            </button>
          </form>
          <a href="/" style={{ display: "block", textAlign: "center", marginTop: 18, color: "rgba(255,255,255,0.3)", fontSize: 12, textDecoration: "none" }}>← Back to API hub</a>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = NEON }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: "#0a0a0a", border: "1px solid rgba(0,255,0,0.1)", borderRadius: 12, padding: "18px 20px" }}>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, letterSpacing: "0.08em", margin: "0 0 8px", textTransform: "uppercase" }}>{label}</p>
      <p style={{ color, fontFamily: "'Orbitron', sans-serif", fontSize: 26, fontWeight: 700, margin: 0 }}>{value}</p>
      {sub && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: "6px 0 0" }}>{sub}</p>}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [auto, setAuto] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api("/api/admin/stats");
      if (r.ok) setStats(await r.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    if (auto) {
      intervalRef.current = setInterval(load, 10000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [load, auto]);

  if (loading) return <div style={{ color: "rgba(255,255,255,0.3)", padding: 40, textAlign: "center" }}>Loading stats...</div>;
  if (!stats) return <div style={{ color: "#ff6b6b", padding: 40, textAlign: "center" }}>Failed to load stats.</div>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Orbitron', sans-serif", color: NEON, fontSize: 15, fontWeight: 700, margin: 0 }}>OVERVIEW</h2>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer" }}>
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} style={{ accentColor: NEON }} />
            Auto-refresh
          </label>
          <button onClick={load} style={{ background: "rgba(0,255,0,0.08)", border: "1px solid rgba(0,255,0,0.2)", borderRadius: 8, padding: "6px 14px", color: NEON, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        <StatCard label="Total Requests" value={stats.totalRequests.toLocaleString()} sub="since last restart" />
        <StatCard label="Last Hour" value={stats.reqLastHour.toLocaleString()} sub="API hits" />
        <StatCard label="Last 24h" value={stats.reqLastDay.toLocaleString()} sub="API hits" />
        <StatCard label="Avg Response" value={`${stats.avgMs}ms`} sub="last 50 requests" color="#00ccff" />
        <StatCard label="4xx Errors" value={stats.errors4xx} color={stats.errors4xx > 0 ? "#ffaa00" : NEON} />
        <StatCard label="5xx Errors" value={stats.errors5xx} color={stats.errors5xx > 0 ? "#ff4444" : NEON} />
      </div>

      <div style={{ background: "#0a0a0a", border: "1px solid rgba(0,255,0,0.1)", borderRadius: 12, padding: "18px 20px" }}>
        <p style={{ color: NEON, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", margin: "0 0 14px", textTransform: "uppercase" }}>Top Endpoints</p>
        {stats.topEndpoints.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No data yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stats.topEndpoints.map((e: any, i: number) => {
              const maxHits = stats.topEndpoints[0]?.hits || 1;
              const pct = Math.round((e.hits / maxHits) * 100);
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>{e.endpoint}</span>
                    <span style={{ color: NEON, fontSize: 12, fontWeight: 700 }}>{e.hits.toLocaleString()}</span>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 4, height: 4 }}>
                    <div style={{ background: NEON, height: 4, borderRadius: 4, width: `${pct}%`, opacity: 0.7 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Live Log Tab ─────────────────────────────────────────────────────────────
function LiveLogTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [auto, setAuto] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api("/api/admin/logs?limit=100");
      if (r.ok) {
        const d = await r.json();
        setLogs(d.logs || []);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    if (auto) intervalRef.current = setInterval(load, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [load, auto]);

  function statusColor(s: number) {
    if (s < 300) return NEON;
    if (s < 400) return "#00ccff";
    if (s < 500) return "#ffaa00";
    return "#ff4444";
  }

  function msColor(ms: number) {
    if (ms < 200) return NEON;
    if (ms < 1000) return "#ffaa00";
    return "#ff4444";
  }

  function fmtTime(ts: number) {
    return new Date(ts).toLocaleTimeString();
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Orbitron', sans-serif", color: NEON, fontSize: 15, fontWeight: 700, margin: 0 }}>LIVE LOG <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, fontWeight: 400 }}>({logs.length} entries)</span></h2>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer" }}>
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} style={{ accentColor: NEON }} />
            Auto-refresh (5s)
          </label>
          <button onClick={load} style={{ background: "rgba(0,255,0,0.08)", border: "1px solid rgba(0,255,0,0.2)", borderRadius: 8, padding: "6px 14px", color: NEON, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", padding: 40 }}>Loading logs...</div>
      ) : logs.length === 0 ? (
        <div style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", padding: 40 }}>No requests logged yet.</div>
      ) : (
        <div style={{ background: "#0a0a0a", border: "1px solid rgba(0,255,0,0.1)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Time", "Method", "Path", "Status", "ms"].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: "0.06em", fontSize: 10, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td style={{ padding: "8px 14px", color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap" }}>{fmtTime(log.ts)}</td>
                    <td style={{ padding: "8px 14px" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", color: log.method === "GET" ? "#00ccff" : "#ffaa00" }}>{log.method}</span>
                    </td>
                    <td style={{ padding: "8px 14px", color: "rgba(255,255,255,0.65)", fontFamily: "'JetBrains Mono', monospace", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.path}</td>
                    <td style={{ padding: "8px 14px", color: statusColor(log.status), fontWeight: 700 }}>{log.status}</td>
                    <td style={{ padding: "8px 14px", color: msColor(log.ms) }}>{log.ms}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
const ICONS = ["github", "cpu", "globe", "server", "zap", "code"] as const;
type IconType = typeof ICONS[number];

function IconPicker({ value, onChange }: { value: IconType; onChange: (v: IconType) => void }) {
  const map: Record<IconType, JSX.Element> = {
    github: <Github size={14} />,
    cpu: <Cpu size={14} />,
    globe: <Globe size={14} />,
    server: <Server size={14} />,
    zap: <Zap size={14} />,
    code: <Code size={14} />,
  };
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {ICONS.map((ic) => (
        <button key={ic} onClick={() => onChange(ic)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${value === ic ? NEON : "rgba(255,255,255,0.1)"}`, background: value === ic ? "rgba(0,255,0,0.1)" : "transparent", color: value === ic ? NEON : "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {map[ic]}
        </button>
      ))}
    </div>
  );
}

function SettingsTab() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [cards, setCards] = useState<any[]>([]);

  const load = useCallback(async () => {
    try {
      const r = await api("/api/admin/settings");
      if (r.ok) {
        const d = await r.json();
        setSettings(d.settings);
        setGithubUrl(d.settings.githubUrl || "");
        setCards(d.settings.repoCards || []);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    setSaving(true);
    try {
      const r = await api("/api/admin/settings", { method: "POST", body: JSON.stringify({ githubUrl, repoCards: cards }) });
      if (r.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    } catch {}
    setSaving(false);
  }

  function updateCard(i: number, field: string, value: any) {
    setCards((prev) => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  }

  function addCard() {
    setCards((prev) => [...prev, { id: `card-${Date.now()}`, name: "New Project", url: "", description: "", badge: "NEW", display: "", icon: "globe" }]);
  }

  function removeCard(i: number) {
    setCards((prev) => prev.filter((_, idx) => idx !== i));
  }

  function moveCard(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= cards.length) return;
    const updated = [...cards];
    [updated[i], updated[j]] = [updated[j], updated[i]];
    setCards(updated);
  }

  if (loading) return <div style={{ color: "rgba(255,255,255,0.3)", padding: 40, textAlign: "center" }}>Loading settings...</div>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Orbitron', sans-serif", color: NEON, fontSize: 15, fontWeight: 700, margin: 0 }}>SETTINGS</h2>
        <button onClick={handleSave} disabled={saving} style={{ background: saving ? "rgba(0,255,0,0.05)" : "rgba(0,255,0,0.1)", border: `1px solid rgba(0,255,0,${saving ? 0.1 : 0.3})`, borderRadius: 8, padding: "8px 18px", color: NEON, cursor: saving ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
          {saved ? <><CheckCircle size={14} /> Saved!</> : saving ? "Saving..." : <><Save size={13} /> Save Changes</>}
        </button>
      </div>

      <div style={{ background: "#0a0a0a", border: "1px solid rgba(0,255,0,0.1)", borderRadius: 12, padding: "18px 20px", marginBottom: 16 }}>
        <p style={{ color: NEON, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", margin: "0 0 12px", textTransform: "uppercase" }}>Header GitHub Link</p>
        <input
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          placeholder="https://github.com/..."
          style={{ width: "100%", background: "#111", border: "1px solid rgba(0,255,0,0.15)", borderRadius: 8, padding: "9px 14px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }}
        />
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: "8px 0 0" }}>This link appears in the top-right header of the site.</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ color: NEON, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", margin: 0, textTransform: "uppercase" }}>Project Cards ({cards.length})</p>
        <button onClick={addCard} style={{ background: "rgba(0,255,0,0.08)", border: "1px solid rgba(0,255,0,0.2)", borderRadius: 8, padding: "6px 14px", color: NEON, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={13} /> Add Card
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {cards.map((card, i) => (
          <div key={card.id || i} style={{ background: "#0a0a0a", border: "1px solid rgba(0,255,0,0.1)", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>#{i + 1}</span>
                <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{card.name || "Untitled"}</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => moveCard(i, -1)} disabled={i === 0} style={{ background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "4px 8px", color: "rgba(255,255,255,0.4)", cursor: i === 0 ? "not-allowed" : "pointer" }}><ChevronUp size={12} /></button>
                <button onClick={() => moveCard(i, 1)} disabled={i === cards.length - 1} style={{ background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "4px 8px", color: "rgba(255,255,255,0.4)", cursor: i === cards.length - 1 ? "not-allowed" : "pointer" }}><ChevronDown size={12} /></button>
                <button onClick={() => removeCard(i)} style={{ background: "none", border: "1px solid rgba(255,80,80,0.2)", borderRadius: 6, padding: "4px 8px", color: "#ff6b6b", cursor: "pointer" }}><Trash2 size={12} /></button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Name</label>
                <input value={card.name} onChange={(e) => updateCard(i, "name", e.target.value)} style={{ width: "100%", background: "#111", border: "1px solid rgba(0,255,0,0.12)", borderRadius: 6, padding: "7px 10px", color: "#fff", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Badge Label</label>
                <input value={card.badge} onChange={(e) => updateCard(i, "badge", e.target.value)} style={{ width: "100%", background: "#111", border: "1px solid rgba(0,255,0,0.12)", borderRadius: 6, padding: "7px 10px", color: "#fff", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>URL</label>
              <input value={card.url} onChange={(e) => updateCard(i, "url", e.target.value)} placeholder="https://..." style={{ width: "100%", background: "#111", border: "1px solid rgba(0,255,0,0.12)", borderRadius: 6, padding: "7px 10px", color: "#fff", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Description</label>
              <input value={card.description} onChange={(e) => updateCard(i, "description", e.target.value)} style={{ width: "100%", background: "#111", border: "1px solid rgba(0,255,0,0.12)", borderRadius: 6, padding: "7px 10px", color: "#fff", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Display Text (shown below name)</label>
              <input value={card.display} onChange={(e) => updateCard(i, "display", e.target.value)} placeholder="github.com/..." style={{ width: "100%", background: "#111", border: "1px solid rgba(0,255,0,0.12)", borderRadius: 6, padding: "7px 10px", color: "#fff", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Icon</label>
              <IconPicker value={card.icon as IconType} onChange={(v) => updateCard(i, "icon", v)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Providers Tab ────────────────────────────────────────────────────────────
function ProvidersTab() {
  const [health, setHealth] = useState<any>(null);
  const [providerStatus, setProviderStatus] = useState<any>(null);
  const [ytdlpLoading, setYtdlpLoading] = useState(false);
  const [ytdlpResult, setYtdlpResult] = useState<string>("");
  const [cookieResult, setCookieResult] = useState<string>("");
  const [resetMsg, setResetMsg] = useState<Record<string, string>>({});

  async function loadHealth() {
    try {
      const r = await api("/api/admin/provider-health");
      if (r.ok) setHealth(await r.json());
    } catch {}
    try {
      const r = await api("/api/providers/status");
      if (r.ok) setProviderStatus(await r.json());
    } catch {}
  }

  useEffect(() => { loadHealth(); }, []);

  async function updateYtdlp() {
    setYtdlpLoading(true);
    setYtdlpResult("");
    try {
      const r = await api("/api/admin/update-ytdlp");
      const d = await r.json();
      setYtdlpResult(d.message || d.error || "Done");
    } catch { setYtdlpResult("Request failed"); }
    setYtdlpLoading(false);
  }

  async function reloadCookies() {
    setCookieResult("");
    try {
      const r = await api("/api/admin/reload-cookies");
      const d = await r.json();
      setCookieResult(d.message || "Done");
    } catch { setCookieResult("Request failed"); }
  }

  async function resetProvider(name: string) {
    try {
      const r = await api("/api/admin/reset-health", { method: "POST", body: JSON.stringify({ provider: name }) });
      const d = await r.json();
      setResetMsg((prev) => ({ ...prev, [name]: d.success ? "Reset!" : "Failed" }));
      setTimeout(() => setResetMsg((prev) => { const n = { ...prev }; delete n[name]; return n; }), 2000);
    } catch { setResetMsg((prev) => ({ ...prev, [name]: "Error" })); }
  }

  const knownProviders = ["ytdlp", "fabdl", "cobalt", "piped", "y2mate", "invidious", "ytdown", "tiktok"];

  return (
    <div>
      <h2 style={{ fontFamily: "'Orbitron', sans-serif", color: NEON, fontSize: 15, fontWeight: 700, margin: "0 0 20px" }}>PROVIDERS & SYSTEM</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "#0a0a0a", border: "1px solid rgba(0,255,0,0.1)", borderRadius: 12, padding: "18px 20px" }}>
          <p style={{ color: NEON, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", margin: "0 0 12px", textTransform: "uppercase" }}>yt-dlp</p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "0 0 12px" }}>Update the yt-dlp binary to the latest stable version.</p>
          <button onClick={updateYtdlp} disabled={ytdlpLoading} style={{ background: "rgba(0,255,0,0.08)", border: "1px solid rgba(0,255,0,0.2)", borderRadius: 8, padding: "8px 16px", color: NEON, cursor: ytdlpLoading ? "not-allowed" : "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Zap size={13} /> {ytdlpLoading ? "Updating..." : "Update yt-dlp"}
          </button>
          {ytdlpResult && <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: "10px 0 0", fontFamily: "'JetBrains Mono', monospace", background: "#111", padding: "8px 10px", borderRadius: 6 }}>{ytdlpResult}</p>}
        </div>

        <div style={{ background: "#0a0a0a", border: "1px solid rgba(0,255,0,0.1)", borderRadius: 12, padding: "18px 20px" }}>
          <p style={{ color: NEON, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", margin: "0 0 12px", textTransform: "uppercase" }}>Cookie Cache</p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "0 0 12px" }}>Force-reload YouTube cookies from disk on the next download.</p>
          <button onClick={reloadCookies} style={{ background: "rgba(0,255,0,0.08)", border: "1px solid rgba(0,255,0,0.2)", borderRadius: 8, padding: "8px 16px", color: NEON, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <RotateCcw size={13} /> Reload Cookies
          </button>
          {cookieResult && <p style={{ color: NEON, fontSize: 11, margin: "10px 0 0" }}>{cookieResult}</p>}
        </div>
      </div>

      <div style={{ background: "#0a0a0a", border: "1px solid rgba(0,255,0,0.1)", borderRadius: 12, padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <p style={{ color: NEON, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", margin: 0, textTransform: "uppercase" }}>Provider Health</p>
          <button onClick={loadHealth} style={{ background: "rgba(0,255,0,0.08)", border: "1px solid rgba(0,255,0,0.2)", borderRadius: 6, padding: "5px 12px", color: NEON, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}>
            <RefreshCw size={11} /> Refresh
          </button>
        </div>

        {providerStatus ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
            {Object.entries(providerStatus.providers?.media || providerStatus.providers || {}).map(([name, info]: any) => {
              const active = info?.active ?? info;
              return (
                <div key={name} style={{ background: "#111", borderRadius: 10, padding: "12px 14px", border: `1px solid ${active ? "rgba(0,255,0,0.12)" : "rgba(255,80,80,0.12)"}`, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: active ? NEON : "#ff4444", boxShadow: `0 0 6px ${active ? NEON : "#ff4444"}` }} />
                      <span style={{ color: "#fff", fontSize: 12, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{info?.label || name}</span>
                    </div>
                    <span style={{ fontSize: 10, color: active ? NEON : "#ff6b6b" }}>{active ? "UP" : "DOWN"}</span>
                  </div>
                  <button onClick={() => resetProvider(name)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "4px 0", color: resetMsg[name] ? NEON : "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 11 }}>
                    {resetMsg[name] || "Reset Health"}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Loading provider status...</p>
        )}

        {health && (
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, margin: "14px 0 0" }}>{health.note}</p>
        )}
      </div>
    </div>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────
function SecurityTab({ onPasswordChange }: { onPasswordChange: (pwd: string) => void }) {
  const [current, setCurrent] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPwd !== confirm) { setMsg({ type: "err", text: "Passwords do not match." }); return; }
    if (newPwd.length < 6) { setMsg({ type: "err", text: "Password must be at least 6 characters." }); return; }
    setLoading(true);
    setMsg(null);
    try {
      const r = await api("/api/admin/change-password", { method: "POST", body: JSON.stringify({ newPassword: newPwd }) });
      const d = await r.json();
      if (r.ok && d.success) {
        sessionStorage.setItem(AUTH_KEY, newPwd);
        onPasswordChange(newPwd);
        setMsg({ type: "ok", text: "Password updated successfully." });
        setCurrent(""); setNewPwd(""); setConfirm("");
      } else {
        setMsg({ type: "err", text: d.error || "Failed to update password." });
      }
    } catch { setMsg({ type: "err", text: "Connection error." }); }
    setLoading(false);
  }

  return (
    <div>
      <h2 style={{ fontFamily: "'Orbitron', sans-serif", color: NEON, fontSize: 15, fontWeight: 700, margin: "0 0 20px" }}>SECURITY</h2>
      <div style={{ background: "#0a0a0a", border: "1px solid rgba(0,255,0,0.1)", borderRadius: 12, padding: "24px", maxWidth: 440 }}>
        <p style={{ color: NEON, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", margin: "0 0 16px", textTransform: "uppercase" }}>Change Admin Password</p>
        <form onSubmit={handleChange} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "New Password", val: newPwd, set: setNewPwd },
            { label: "Confirm Password", val: confirm, set: setConfirm },
          ].map(({ label, val, set }) => (
            <div key={label} style={{ position: "relative" }}>
              <label style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
              <input type={show ? "text" : "password"} value={val} onChange={(e) => set(e.target.value)} style={{ width: "100%", background: "#111", border: "1px solid rgba(0,255,0,0.15)", borderRadius: 8, padding: "9px 14px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
          <label style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer" }}>
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} style={{ accentColor: NEON }} />
            Show passwords
          </label>
          {msg && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: msg.type === "ok" ? NEON : "#ff6b6b", fontSize: 12 }}>
              {msg.type === "ok" ? <CheckCircle size={14} /> : <XCircle size={14} />}
              {msg.text}
            </div>
          )}
          <button type="submit" disabled={loading} style={{ background: "rgba(0,255,0,0.1)", border: "1px solid rgba(0,255,0,0.3)", borderRadius: 8, padding: "10px 0", color: NEON, fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", marginTop: 4 }}>
            {loading ? "UPDATING..." : "UPDATE PASSWORD"}
          </button>
        </form>
        <div style={{ marginTop: 24, padding: "14px 16px", background: "rgba(255,170,0,0.05)", border: "1px solid rgba(255,170,0,0.1)", borderRadius: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <AlertTriangle size={14} color="#ffaa00" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0, lineHeight: 1.6 }}>After changing your password you will need to log in again on any other sessions. The password is stored in the admin-settings.json file on the server.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "logs", label: "Live Log", icon: ScrollText },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "providers", label: "Providers", icon: Cpu },
  { id: "security", label: "Security", icon: Shield },
] as const;

type TabId = typeof TABS[number]["id"];

export default function AdminPage() {
  const [, navigate] = useLocation();
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  useEffect(() => {
    const saved = sessionStorage.getItem(AUTH_KEY);
    if (saved) { setAuthed(true); setPwd(saved); }
  }, []);

  function handleLogin(p: string) { setPwd(p); setAuthed(true); }

  function handleLogout() {
    sessionStorage.removeItem(AUTH_KEY);
    setAuthed(false);
    setPwd("");
  }

  if (!authed) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(0,255,0,0.1)", padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#000", zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, background: "rgba(0,255,0,0.08)", border: "1px solid rgba(0,255,0,0.2)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={16} color={NEON} />
          </div>
          <span style={{ fontFamily: "'Orbitron', sans-serif", color: NEON, fontSize: 15, fontWeight: 700 }}>WOLF <span style={{ color: "rgba(255,255,255,0.5)" }}>ADMIN</span></span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(0,255,0,0.06)", border: "1px solid rgba(0,255,0,0.12)", borderRadius: 20, padding: "2px 10px" }}>
            <Activity size={9} color={NEON} />
            <span style={{ color: NEON, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em" }}>LIVE</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a href="/" style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textDecoration: "none" }}>← API Hub</a>
          <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px solid rgba(255,80,80,0.2)", borderRadius: 8, padding: "5px 12px", color: "#ff6b6b", cursor: "pointer", fontSize: 12 }}>
            <LogOut size={13} /> Logout
          </button>
        </div>
      </header>

      <div style={{ display: "flex", minHeight: "calc(100vh - 56px)" }}>
        {/* Sidebar */}
        <nav style={{ width: 200, borderRight: "1px solid rgba(0,255,0,0.08)", padding: "20px 12px", flexShrink: 0 }}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: "none", background: active ? "rgba(0,255,0,0.08)" : "transparent", color: active ? NEON : "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400, marginBottom: 2, textAlign: "left", transition: "all 0.15s" }}>
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <main style={{ flex: 1, padding: "28px 28px", overflowY: "auto", minWidth: 0 }}>
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "logs" && <LiveLogTab />}
          {activeTab === "settings" && <SettingsTab />}
          {activeTab === "providers" && <ProvidersTab />}
          {activeTab === "security" && <SecurityTab onPasswordChange={(p) => { setPwd(p); sessionStorage.setItem(AUTH_KEY, p); }} />}
        </main>
      </div>
    </div>
  );
}
