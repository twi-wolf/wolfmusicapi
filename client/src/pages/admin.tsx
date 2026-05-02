import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard, ScrollText, Settings, Shield, Cpu,
  RefreshCw, LogOut, ChevronUp, ChevronDown, Trash2,
  Plus, Save, Eye, EyeOff, Zap, RotateCcw, Activity,
  CheckCircle, XCircle, Clock, AlertTriangle, Globe, Github, Code, Server,
  TrendingUp, Star, CalendarDays, KeyRound, FlaskConical
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

      {/* ── Today's Highlight Banner ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {/* Today total */}
        <div style={{ background: "linear-gradient(135deg, rgba(0,255,0,0.07) 0%, rgba(0,255,0,0.02) 100%)", border: "1px solid rgba(0,255,0,0.25)", borderRadius: 14, padding: "20px 22px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ background: "rgba(0,255,0,0.1)", border: "1px solid rgba(0,255,0,0.2)", borderRadius: 10, padding: 10, flexShrink: 0 }}>
            <CalendarDays size={20} color={NEON} />
          </div>
          <div>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 4px" }}>Today's Requests</p>
            <p style={{ color: NEON, fontFamily: "'Orbitron', sans-serif", fontSize: 30, fontWeight: 700, margin: 0, lineHeight: 1 }}>{stats.dailyTotalRequests?.toLocaleString() ?? 0}</p>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, margin: "5px 0 0" }}>{stats.currentDay}</p>
          </div>
        </div>

        {/* Today's #1 API */}
        <div style={{ background: "linear-gradient(135deg, rgba(255,200,0,0.06) 0%, rgba(255,200,0,0.01) 100%)", border: "1px solid rgba(255,200,0,0.2)", borderRadius: 14, padding: "20px 22px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ background: "rgba(255,200,0,0.1)", border: "1px solid rgba(255,200,0,0.2)", borderRadius: 10, padding: 10, flexShrink: 0 }}>
            <Star size={20} color="#ffc800" />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 4px" }}>Top API Today</p>
            {stats.topApiToday ? (
              <>
                <p style={{ color: "#ffc800", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{stats.topApiToday.endpoint}</p>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: "5px 0 0" }}><span style={{ color: "#ffc800", fontWeight: 700 }}>{stats.topApiToday.hits.toLocaleString()}</span> hits today</p>
              </>
            ) : (
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, margin: 0 }}>No data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* ── All-time stat cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
        <StatCard label="Total Requests" value={stats.totalRequests.toLocaleString()} sub="since last restart" />
        <StatCard label="Last Hour" value={stats.reqLastHour.toLocaleString()} sub="API hits" />
        <StatCard label="Last 24h" value={stats.reqLastDay.toLocaleString()} sub="API hits" />
        <StatCard label="Avg Response" value={`${stats.avgMs}ms`} sub="last 50 requests" color="#00ccff" />
        <StatCard label="4xx Errors" value={stats.errors4xx} color={stats.errors4xx > 0 ? "#ffaa00" : NEON} />
        <StatCard label="5xx Errors" value={stats.errors5xx} color={stats.errors5xx > 0 ? "#ff4444" : NEON} />
      </div>

      {/* ── Today's top endpoints leaderboard ── */}
      <div style={{ background: "#0a0a0a", border: "1px solid rgba(255,200,0,0.12)", borderRadius: 12, padding: "18px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <TrendingUp size={14} color="#ffc800" />
          <p style={{ color: "#ffc800", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", margin: 0, textTransform: "uppercase" }}>Top APIs Today</p>
          <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.2)", fontSize: 11 }}>{stats.currentDay}</span>
        </div>
        {!stats.topEndpointsToday || stats.topEndpointsToday.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No requests yet today.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stats.topEndpointsToday.map((e: any, i: number) => {
              const maxHits = stats.topEndpointsToday[0]?.hits || 1;
              const pct = Math.round((e.hits / maxHits) * 100);
              const isTop = i === 0;
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <span style={{ color: isTop ? "#ffc800" : "rgba(255,255,255,0.2)", fontSize: 11, fontWeight: 700, width: 16, flexShrink: 0 }}>#{i + 1}</span>
                      <span style={{ color: isTop ? "#fff" : "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.endpoint}</span>
                    </div>
                    <span style={{ color: isTop ? "#ffc800" : "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{e.hits.toLocaleString()}</span>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 4, height: 3, marginLeft: 24 }}>
                    <div style={{ background: isTop ? "#ffc800" : "rgba(255,200,0,0.35)", height: 3, borderRadius: 4, width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── All-time top endpoints ── */}
      <div style={{ background: "#0a0a0a", border: "1px solid rgba(0,255,0,0.1)", borderRadius: 12, padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Activity size={14} color={NEON} />
          <p style={{ color: NEON, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", margin: 0, textTransform: "uppercase" }}>All-Time Top Endpoints</p>
          <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.2)", fontSize: 11 }}>since last restart</span>
        </div>
        {stats.topEndpoints.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No data yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stats.topEndpoints.map((e: any, i: number) => {
              const maxHits = stats.topEndpoints[0]?.hits || 1;
              const pct = Math.round((e.hits / maxHits) * 100);
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, fontWeight: 700, width: 16, flexShrink: 0 }}>#{i + 1}</span>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.endpoint}</span>
                    </div>
                    <span style={{ color: NEON, fontSize: 12, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{e.hits.toLocaleString()}</span>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 4, height: 3, marginLeft: 24 }}>
                    <div style={{ background: NEON, height: 3, borderRadius: 4, width: `${pct}%`, opacity: 0.7 }} />
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

// ─── Error Logs Tab ───────────────────────────────────────────────────────────
function ErrorLogsTab({ pwd }: { pwd: string }) {
  const [data, setData] = useState<{ apiErrors: any[]; consoleLogs: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [activeSection, setActiveSection] = useState<"api" | "console">("api");
  const [filter, setFilter] = useState("");

  function fmt(ts: number) {
    return new Date(ts).toLocaleTimeString("en-GB", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }
  function fmtDate(ts: number) {
    return new Date(ts).toLocaleString("en-GB", { hour12: false, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  async function fetchLogs() {
    try {
      const res = await fetch("/api/admin/error-logs", { headers: { "x-admin-password": pwd } });
      const d = await res.json();
      if (d.success) setData({ apiErrors: d.apiErrors, consoleLogs: d.consoleLogs });
    } catch (_) {}
    setLoading(false);
  }

  async function clearLogs() {
    setClearing(true);
    try {
      await fetch("/api/admin/error-logs", { method: "DELETE", headers: { "x-admin-password": pwd } });
      setData({ apiErrors: [], consoleLogs: [] });
    } catch (_) {}
    setClearing(false);
  }

  useEffect(() => {
    fetchLogs();
    const t = setInterval(fetchLogs, 5000);
    return () => clearInterval(t);
  }, []);

  const apiErrors = (data?.apiErrors || []).filter(e =>
    !filter || e.path.includes(filter) || String(e.status).includes(filter) || JSON.stringify(e.body).toLowerCase().includes(filter.toLowerCase())
  );
  const consoleLogs = (data?.consoleLogs || []).filter(e =>
    !filter || e.message.toLowerCase().includes(filter.toLowerCase()) || e.level.includes(filter)
  );

  const RED = "#ff4444";
  const ORANGE = "#ffaa00";
  const totalErrors = (data?.apiErrors.length || 0) + (data?.consoleLogs.length || 0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}>
            Error Logs
            {totalErrors > 0 && (
              <span style={{ marginLeft: 10, background: "rgba(255,68,68,0.15)", border: "1px solid rgba(255,68,68,0.3)", borderRadius: 20, padding: "2px 10px", fontSize: 12, color: RED }}>
                {totalErrors} entries
              </span>
            )}
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            API error responses and server console errors — auto-refreshes every 5s
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={fetchLogs} style={{ background: "rgba(0,255,0,0.06)", border: "1px solid rgba(0,255,0,0.15)", borderRadius: 8, padding: "6px 12px", color: NEON, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={12} /> Refresh
          </button>
          <button onClick={clearLogs} disabled={clearing} style={{ background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.2)", borderRadius: 8, padding: "6px 12px", color: RED, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Trash2 size={12} /> {clearing ? "Clearing..." : "Clear All"}
          </button>
        </div>
      </div>

      {/* Filter + Section toggle */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 0, border: "1px solid rgba(0,255,0,0.15)", borderRadius: 8, overflow: "hidden" }}>
          {(["api", "console"] as const).map(s => (
            <button key={s} onClick={() => setActiveSection(s)} style={{ padding: "6px 16px", background: activeSection === s ? "rgba(0,255,0,0.1)" : "transparent", color: activeSection === s ? NEON : "rgba(255,255,255,0.4)", border: "none", cursor: "pointer", fontSize: 12, fontWeight: activeSection === s ? 700 : 400 }}>
              {s === "api" ? `API Errors (${data?.apiErrors.length ?? 0})` : `Console (${data?.consoleLogs.length ?? 0})`}
            </button>
          ))}
        </div>
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter by path, status, message..."
          style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 12px", color: "#fff", fontSize: 12, outline: "none" }}
        />
      </div>

      {loading ? (
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center", padding: 40 }}>Loading...</div>
      ) : activeSection === "api" ? (
        /* ── API Errors ── */
        apiErrors.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
            <CheckCircle size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
            <div>No API errors recorded</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {apiErrors.map((e, i) => {
              const isServer = e.status >= 500;
              const color = isServer ? RED : ORANGE;
              const errorMsg = e.body?.error || e.body?.message || null;
              return (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${isServer ? "rgba(255,68,68,0.2)" : "rgba(255,170,0,0.15)"}`, borderRadius: 10, padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: errorMsg ? 8 : 0, flexWrap: "wrap" }}>
                    <span style={{ background: `rgba(${isServer ? "255,68,68" : "255,170,0"},0.15)`, color, borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 700, fontFamily: "monospace" }}>
                      {e.status}
                    </span>
                    <span style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontFamily: "monospace" }}>
                      {e.method}
                    </span>
                    <span style={{ color: "#fff", fontFamily: "monospace", fontSize: 13, fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {e.path}{e.query}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, whiteSpace: "nowrap" }}>{e.ms}ms</span>
                    <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, whiteSpace: "nowrap" }}>{fmtDate(e.ts)}</span>
                  </div>
                  {errorMsg && (
                    <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 6, padding: "8px 12px", fontFamily: "monospace", fontSize: 12, color, wordBreak: "break-word" }}>
                      {errorMsg}
                    </div>
                  )}
                  {e.body && !errorMsg && (
                    <pre style={{ margin: 0, background: "rgba(0,0,0,0.3)", borderRadius: 6, padding: "8px 12px", fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.5)", overflow: "auto", maxHeight: 100 }}>
                      {JSON.stringify(e.body, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ── Console Logs ── */
        consoleLogs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
            <CheckCircle size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
            <div>No console errors or warnings recorded</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {consoleLogs.map((e, i) => {
              const isError = e.level === "error";
              const color = isError ? RED : ORANGE;
              return (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${isError ? "rgba(255,68,68,0.15)" : "rgba(255,170,0,0.12)"}`, borderRadius: 8, padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ background: `rgba(${isError ? "255,68,68" : "255,170,0"},0.12)`, color, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", marginTop: 1 }}>
                    {e.level.toUpperCase()}
                  </span>
                  <span style={{ flex: 1, fontFamily: "monospace", fontSize: 12, color: "rgba(255,255,255,0.75)", wordBreak: "break-word", lineHeight: 1.5 }}>
                    {e.message}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, whiteSpace: "nowrap", marginTop: 2 }}>{fmt(e.ts)}</span>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────
function SecurityTab({ onPasswordChange }: { onPasswordChange: (pwd: string) => void }) {
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pwdLoading, setPwdLoading] = useState(false);

  const [secData, setSecData] = useState<any>(null);
  const [secLoading, setSecLoading] = useState(true);
  const [manualIp, setManualIp] = useState("");
  const [blockMsg, setBlockMsg] = useState("");
  const [blockLoading, setBlockLoading] = useState(false);

  const loadSec = useCallback(async () => {
    try {
      const r = await api("/api/admin/security");
      if (r.ok) setSecData(await r.json());
    } catch {}
    setSecLoading(false);
  }, []);

  useEffect(() => { loadSec(); }, [loadSec]);

  async function handlePwdChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPwd !== confirm) { setPwdMsg({ type: "err", text: "Passwords do not match." }); return; }
    if (newPwd.length < 6) { setPwdMsg({ type: "err", text: "Must be at least 6 characters." }); return; }
    setPwdLoading(true); setPwdMsg(null);
    try {
      const r = await api("/api/admin/change-password", { method: "POST", body: JSON.stringify({ newPassword: newPwd }) });
      const d = await r.json();
      if (r.ok && d.success) {
        sessionStorage.setItem(AUTH_KEY, newPwd);
        onPasswordChange(newPwd);
        setPwdMsg({ type: "ok", text: "Password updated." });
        setNewPwd(""); setConfirm("");
      } else { setPwdMsg({ type: "err", text: d.error || "Failed." }); }
    } catch { setPwdMsg({ type: "err", text: "Connection error." }); }
    setPwdLoading(false);
  }

  async function blockIp(ip: string) {
    setBlockLoading(true); setBlockMsg("");
    try {
      const r = await api("/api/admin/block-ip", { method: "POST", body: JSON.stringify({ ip }) });
      const d = await r.json();
      setBlockMsg(d.message || "Done");
      if (d.success) { setManualIp(""); setSecData((prev: any) => ({ ...prev, ipBlocklist: d.ipBlocklist })); }
    } catch { setBlockMsg("Error"); }
    setBlockLoading(false);
    setTimeout(() => setBlockMsg(""), 3000);
  }

  async function unblockIp(ip: string) {
    try {
      const r = await api("/api/admin/unblock-ip", { method: "POST", body: JSON.stringify({ ip }) });
      const d = await r.json();
      if (d.success) setSecData((prev: any) => ({ ...prev, ipBlocklist: d.ipBlocklist }));
    } catch {}
  }

  const RULES = [
    { label: "Global flood limit", value: "300 req / 15 min / IP", color: NEON },
    { label: "Login brute-force", value: "5 attempts / 15 min / IP", color: "#ffaa00" },
    { label: "Admin panel", value: "30 req / 5 min / IP", color: "#00ccff" },
    { label: "Download / heavy", value: "20 req / min / IP", color: "#ff6b6b" },
    { label: "General API", value: "80 req / min / IP", color: NEON },
    { label: "Scanner UA block", value: "sqlmap, nikto, scrapy, nuclei…", color: "#ffaa00" },
    { label: "IP blocklist", value: `${secData?.ipBlocklist?.length ?? 0} IPs blocked`, color: NEON },
  ];

  return (
    <div>
      <h2 style={{ fontFamily: "'Orbitron', sans-serif", color: NEON, fontSize: 15, fontWeight: 700, margin: "0 0 20px" }}>SECURITY</h2>

      {/* ── Protection rules overview ── */}
      <div style={{ background: "#0a0a0a", border: "1px solid rgba(0,255,0,0.12)", borderRadius: 12, padding: "18px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Shield size={14} color={NEON} />
          <p style={{ color: NEON, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", margin: 0, textTransform: "uppercase" }}>Active Protections</p>
          <span style={{ marginLeft: "auto", background: "rgba(0,255,0,0.1)", border: "1px solid rgba(0,255,0,0.2)", borderRadius: 20, padding: "2px 10px", color: NEON, fontSize: 10, fontWeight: 700 }}>ALL ACTIVE</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {RULES.map((r) => (
            <div key={r.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#111", borderRadius: 8, border: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle size={13} color={r.color} />
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{r.label}</span>
              </div>
              <span style={{ color: r.color, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Top IPs today ── */}
      <div style={{ background: "#0a0a0a", border: "1px solid rgba(0,255,0,0.1)", borderRadius: 12, padding: "18px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={14} color={NEON} />
            <p style={{ color: NEON, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", margin: 0, textTransform: "uppercase" }}>
              Top IPs Today <span style={{ color: "rgba(255,255,255,0.2)", fontWeight: 400 }}>({secData?.uniqueIpsToday ?? 0} unique)</span>
            </p>
          </div>
          <button onClick={loadSec} style={{ background: "rgba(0,255,0,0.08)", border: "1px solid rgba(0,255,0,0.2)", borderRadius: 6, padding: "5px 12px", color: NEON, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}>
            <RefreshCw size={11} /> Refresh
          </button>
        </div>
        {secLoading ? (
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>Loading...</p>
        ) : !secData?.topIpsToday?.length ? (
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>No traffic yet today.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {secData.topIpsToday.map((entry: any, i: number) => {
              const isBlocked = secData?.ipBlocklist?.includes(entry.ip);
              return (
                <div key={entry.ip} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#111", borderRadius: 8, border: `1px solid ${isBlocked ? "rgba(255,80,80,0.15)" : "rgba(255,255,255,0.04)"}` }}>
                  <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, width: 20, flexShrink: 0 }}>#{i + 1}</span>
                  <span style={{ color: isBlocked ? "#ff6b6b" : "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", flex: 1 }}>{entry.ip}</span>
                  <span style={{ color: NEON, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{entry.hits.toLocaleString()}</span>
                  {isBlocked ? (
                    <span style={{ color: "#ff6b6b", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>BLOCKED</span>
                  ) : (
                    <button onClick={() => blockIp(entry.ip)} style={{ background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.2)", borderRadius: 6, padding: "3px 10px", color: "#ff6b6b", cursor: "pointer", fontSize: 11, flexShrink: 0 }}>
                      Block
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── IP Blocklist management ── */}
      <div style={{ background: "#0a0a0a", border: "1px solid rgba(255,80,80,0.12)", borderRadius: 12, padding: "18px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <XCircle size={14} color="#ff6b6b" />
          <p style={{ color: "#ff6b6b", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", margin: 0, textTransform: "uppercase" }}>IP Blocklist ({secData?.ipBlocklist?.length ?? 0})</p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            value={manualIp}
            onChange={(e) => setManualIp(e.target.value)}
            placeholder="Enter IP to block (e.g. 1.2.3.4)"
            style={{ flex: 1, background: "#111", border: "1px solid rgba(255,80,80,0.2)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13, outline: "none" }}
            onKeyDown={(e) => { if (e.key === "Enter" && manualIp.trim()) blockIp(manualIp.trim()); }}
          />
          <button
            onClick={() => manualIp.trim() && blockIp(manualIp.trim())}
            disabled={blockLoading || !manualIp.trim()}
            style={{ background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.3)", borderRadius: 8, padding: "8px 16px", color: "#ff6b6b", cursor: "pointer", fontSize: 12, fontWeight: 700, flexShrink: 0 }}
          >
            {blockLoading ? "..." : "Block IP"}
          </button>
        </div>
        {blockMsg && <p style={{ color: NEON, fontSize: 12, margin: "0 0 10px" }}>{blockMsg}</p>}

        {!secData?.ipBlocklist?.length ? (
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>No IPs currently blocked.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {secData.ipBlocklist.map((ip: string) => (
              <div key={ip} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "rgba(255,80,80,0.04)", borderRadius: 8, border: "1px solid rgba(255,80,80,0.12)" }}>
                <span style={{ color: "#ff6b6b", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", flex: 1 }}>{ip}</span>
                <button onClick={() => unblockIp(ip)} style={{ background: "rgba(0,255,0,0.06)", border: "1px solid rgba(0,255,0,0.15)", borderRadius: 6, padding: "3px 10px", color: NEON, cursor: "pointer", fontSize: 11 }}>
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Change Password ── */}
      <div style={{ background: "#0a0a0a", border: "1px solid rgba(0,255,0,0.1)", borderRadius: 12, padding: "20px 24px", maxWidth: 440 }}>
        <p style={{ color: NEON, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", margin: "0 0 16px", textTransform: "uppercase" }}>Change Admin Password</p>
        <form onSubmit={handlePwdChange} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "New Password", val: newPwd, set: setNewPwd },
            { label: "Confirm Password", val: confirm, set: setConfirm },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
              <input type={show ? "text" : "password"} value={val} onChange={(e) => set(e.target.value)} style={{ width: "100%", background: "#111", border: "1px solid rgba(0,255,0,0.15)", borderRadius: 8, padding: "9px 14px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
          <label style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer" }}>
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} style={{ accentColor: NEON }} />
            Show passwords
          </label>
          {pwdMsg && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: pwdMsg.type === "ok" ? NEON : "#ff6b6b", fontSize: 12 }}>
              {pwdMsg.type === "ok" ? <CheckCircle size={14} /> : <XCircle size={14} />}
              {pwdMsg.text}
            </div>
          )}
          <button type="submit" disabled={pwdLoading} style={{ background: "rgba(0,255,0,0.1)", border: "1px solid rgba(0,255,0,0.3)", borderRadius: 8, padding: "10px 0", color: NEON, fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 700, cursor: pwdLoading ? "not-allowed" : "pointer", marginTop: 4 }}>
            {pwdLoading ? "UPDATING..." : "UPDATE PASSWORD"}
          </button>
        </form>
        <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(255,170,0,0.05)", border: "1px solid rgba(255,170,0,0.1)", borderRadius: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <AlertTriangle size={13} color="#ffaa00" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0, lineHeight: 1.6 }}>You'll need to re-login on any other active sessions after changing the password.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── API Keys Tab ─────────────────────────────────────────────────────────────
function ApiKeysTab() {
  const [tmdbKey, setTmdbKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [masked, setMasked] = useState("");
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api("/api/admin/keys");
      if (r.ok) {
        const d = await r.json();
        setMasked(d.keys?.tmdb?.masked || "");
        setConfigured(d.keys?.tmdb?.configured || false);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!tmdbKey.trim()) return;
    setSaving(true); setSaveMsg(null); setTestMsg(null);
    try {
      const r = await api("/api/admin/keys", { method: "POST", body: JSON.stringify({ tmdbApiKey: tmdbKey.trim() }) });
      const d = await r.json();
      if (d.success) {
        setSaveMsg({ ok: true, text: "Key saved successfully." });
        setMasked(`${tmdbKey.slice(0, 4)}${"•".repeat(Math.max(0, tmdbKey.length - 8))}${tmdbKey.slice(-4)}`);
        setConfigured(true);
        setTmdbKey("");
        setShowKey(false);
      } else {
        setSaveMsg({ ok: false, text: d.error || "Save failed." });
      }
    } catch { setSaveMsg({ ok: false, text: "Network error." }); }
    setSaving(false);
  }

  async function handleTest() {
    const keyToTest = tmdbKey.trim();
    if (!keyToTest) { setTestMsg({ ok: false, text: "Enter a key first before testing." }); return; }
    setTesting(true); setTestMsg(null);
    try {
      const r = await api("/api/admin/keys/test-tmdb", { method: "POST", body: JSON.stringify({ key: keyToTest }) });
      const d = await r.json();
      setTestMsg({ ok: d.success, text: d.message || d.error || "Unknown result." });
    } catch { setTestMsg({ ok: false, text: "Network error." }); }
    setTesting(false);
  }

  async function handleRemove() {
    setSaving(true); setSaveMsg(null);
    try {
      const r = await api("/api/admin/keys", { method: "POST", body: JSON.stringify({ tmdbApiKey: "" }) });
      const d = await r.json();
      if (d.success) {
        setMasked(""); setConfigured(false);
        setSaveMsg({ ok: true, text: "Key removed." });
      }
    } catch {}
    setSaving(false);
  }

  return (
    <div>
      <h2 style={{ fontFamily: "'Orbitron', sans-serif", color: NEON, fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>API KEYS</h2>
      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, margin: "0 0 24px" }}>Manage third-party API keys. Keys are stored on disk — no need to touch the VPS environment.</p>

      {/* TMDB Card */}
      <div style={{ background: "#0a0a0a", border: `1px solid ${configured ? "rgba(0,255,0,0.2)" : "rgba(255,255,255,0.08)"}`, borderRadius: 14, padding: "24px 24px", maxWidth: 560 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 42, height: 42, background: "rgba(0,180,255,0.08)", border: "1px solid rgba(0,180,255,0.2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontFamily: "'Orbitron', sans-serif", color: "#00b4ff", fontSize: 10, fontWeight: 700 }}>TMDB</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: "#fff", fontSize: 14, fontWeight: 600, margin: "0 0 2px" }}>The Movie Database</p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0 }}>Powers all Movie category endpoints — search, trailers, trending, rankings</p>
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", background: configured ? "rgba(0,255,0,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${configured ? "rgba(0,255,0,0.25)" : "rgba(255,255,255,0.1)"}`, color: configured ? NEON : "rgba(255,255,255,0.3)", flexShrink: 0 }}>
            {configured ? <><CheckCircle size={9} /> ACTIVE</> : <><XCircle size={9} /> NOT SET</>}
          </span>
        </div>

        {loading ? (
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Loading...</p>
        ) : (
          <>
            {/* Current key display */}
            {configured && masked && (
              <div style={{ background: "rgba(0,255,0,0.04)", border: "1px solid rgba(0,255,0,0.1)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{masked}</span>
                <button onClick={handleRemove} disabled={saving} style={{ background: "none", border: "none", color: "rgba(255,80,80,0.6)", cursor: "pointer", fontSize: 11, padding: "2px 6px", borderRadius: 4 }}>Remove</button>
              </div>
            )}

            {/* Input + actions */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>{configured ? "Replace Key" : "Enter API Key"}</label>
              <div style={{ position: "relative" }}>
                <input
                  data-testid="input-tmdb-key"
                  type={showKey ? "text" : "password"}
                  value={tmdbKey}
                  onChange={(e) => { setTmdbKey(e.target.value); setSaveMsg(null); setTestMsg(null); }}
                  placeholder="Paste your TMDB API key here..."
                  style={{ width: "100%", background: "#111", border: "1px solid rgba(0,255,0,0.15)", borderRadius: 8, padding: "10px 42px 10px 14px", color: "#fff", fontSize: 13, fontFamily: "'JetBrains Mono', monospace", outline: "none", boxSizing: "border-box" }}
                />
                <button type="button" onClick={() => setShowKey(!showKey)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", padding: 0 }}>
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, margin: "0 0 16px" }}>
              Get a free key at <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer" style={{ color: "#00b4ff", textDecoration: "none" }}>themoviedb.org/settings/api</a> → API → Create → Developer
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                data-testid="button-test-tmdb"
                onClick={handleTest}
                disabled={testing || !tmdbKey.trim()}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,180,255,0.08)", border: `1px solid rgba(0,180,255,${tmdbKey.trim() ? "0.3" : "0.1"})`, borderRadius: 8, padding: "9px 18px", color: tmdbKey.trim() ? "#00b4ff" : "rgba(0,180,255,0.3)", cursor: tmdbKey.trim() && !testing ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 600 }}
              >
                <FlaskConical size={13} /> {testing ? "Testing..." : "Test Connection"}
              </button>
              <button
                data-testid="button-save-tmdb"
                onClick={handleSave}
                disabled={saving || !tmdbKey.trim()}
                style={{ display: "flex", alignItems: "center", gap: 6, background: tmdbKey.trim() ? "rgba(0,255,0,0.1)" : "rgba(0,255,0,0.04)", border: `1px solid rgba(0,255,0,${tmdbKey.trim() ? "0.3" : "0.1"})`, borderRadius: 8, padding: "9px 18px", color: tmdbKey.trim() ? NEON : "rgba(0,255,0,0.3)", cursor: tmdbKey.trim() && !saving ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 600 }}
              >
                <Save size={13} /> {saving ? "Saving..." : "Save Key"}
              </button>
            </div>

            {testMsg && (
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: testMsg.ok ? "rgba(0,255,0,0.05)" : "rgba(255,80,80,0.05)", border: `1px solid ${testMsg.ok ? "rgba(0,255,0,0.2)" : "rgba(255,80,80,0.2)"}` }}>
                {testMsg.ok ? <CheckCircle size={14} color={NEON} /> : <XCircle size={14} color="#ff6b6b" />}
                <span style={{ color: testMsg.ok ? NEON : "#ff6b6b", fontSize: 12 }}>{testMsg.text}</span>
              </div>
            )}
            {saveMsg && (
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: saveMsg.ok ? "rgba(0,255,0,0.05)" : "rgba(255,80,80,0.05)", border: `1px solid ${saveMsg.ok ? "rgba(0,255,0,0.2)" : "rgba(255,80,80,0.2)"}` }}>
                {saveMsg.ok ? <CheckCircle size={14} color={NEON} /> : <XCircle size={14} color="#ff6b6b" />}
                <span style={{ color: saveMsg.ok ? NEON : "#ff6b6b", fontSize: 12 }}>{saveMsg.text}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "logs", label: "Live Log", icon: ScrollText },
  { id: "errors", label: "Error Logs", icon: AlertTriangle },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "apikeys", label: "API Keys", icon: KeyRound },
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
          {activeTab === "errors" && <ErrorLogsTab pwd={pwd} />}
          {activeTab === "settings" && <SettingsTab />}
          {activeTab === "apikeys" && <ApiKeysTab />}
          {activeTab === "providers" && <ProvidersTab />}
          {activeTab === "security" && <SecurityTab onPasswordChange={(p) => { setPwd(p); sessionStorage.setItem(AUTH_KEY, p); }} />}
        </main>
      </div>
    </div>
  );
}
