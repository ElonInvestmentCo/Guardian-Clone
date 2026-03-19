import { useState, useEffect, useCallback, useRef } from "react";
import AnalyticsLayout from "@/components/analytics/AnalyticsLayout";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend, AreaChart, Area,
} from "recharts";
import { Users, Eye, Activity, TrendingDown, Monitor, Smartphone, Tablet, RefreshCw, Globe, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

const API = "/api";
const COLORS = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444","#06b6d4","#f97316","#84cc16"];

interface Overview { visitors: number; pageviews: number; sessions: number; bounceRate: number; devices: {device_type:string;count:number}[]; browsers: {browser:string;count:number}[]; }
interface TimePoint { day: string; pageviews: number; visitors: number; }
interface PageRow { page_url: string; views: number; unique_visitors: number; avg_scroll: number; }
interface SourceRow { source: string; visits: number; unique_visitors: number; }
interface Realtime { activeVisitors: number; eventsLast5Min: number; activePages: {page_url:string;visitors:number}[]; }
interface GeoRow { country: string; visitors: number; sessions: number; }
interface LiveEvent { eventType: string; pageUrl: string | null; country: string | null; device: string; timestamp: number; }

const PERIODS = [
  { label: "Today", value: "1d" },
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
];

const COUNTRY_FLAGS: Record<string, string> = {
  US:"🇺🇸", GB:"🇬🇧", DE:"🇩🇪", FR:"🇫🇷", JP:"🇯🇵", CA:"🇨🇦", AU:"🇦🇺", IN:"🇮🇳",
  BR:"🇧🇷", CN:"🇨🇳", KR:"🇰🇷", NL:"🇳🇱", SG:"🇸🇬", SE:"🇸🇪", IT:"🇮🇹", ES:"🇪🇸",
  MX:"🇲🇽", RU:"🇷🇺", PL:"🇵🇱", CH:"🇨🇭",
};

function StatCard({ label, value, icon: Icon, sub, color, trend }: {
  label: string; value: string | number; icon: React.ElementType;
  sub?: string; color?: string; trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/7 transition-colors group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-white/50 text-sm">{label}</span>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110", color ?? "bg-blue-500/20")}>
          <Icon size={16} className={cn(color ? "text-current" : "text-blue-400")} />
        </div>
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      {sub && (
        <div className={cn("text-xs mt-1", trend === "down" ? "text-orange-400" : trend === "up" ? "text-green-400" : "text-white/40")}>
          {sub}
        </div>
      )}
    </div>
  );
}

const deviceIcon = (t: string) => t === "mobile" ? Smartphone : t === "tablet" ? Tablet : Monitor;

const TOOLTIP_STYLE = {
  contentStyle: { background: "#0f0f1a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "#fff", fontSize: 12 },
  cursor: { stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 },
};

export default function Dashboard() {
  const [location] = useLocation();
  void location;
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get("project_id") ?? localStorage.getItem("gt_project_id");

  const [period, setPeriod] = useState("7d");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [timeseries, setTimeseries] = useState<TimePoint[]>([]);
  const [pages, setPages] = useState<PageRow[]>([]);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [realtime, setRealtime] = useState<Realtime | null>(null);
  const [geo, setGeo] = useState<GeoRow[]>([]);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  const load = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    setLoading(true);
    const qs = `?project_id=${projectId}&period=${period}`;
    const [o, ts, pg, src, rt, geoData] = await Promise.all([
      fetch(`${API}/analytics/overview${qs}`).then(r => r.json()) as Promise<Overview>,
      fetch(`${API}/analytics/timeseries${qs}`).then(r => r.json()) as Promise<TimePoint[]>,
      fetch(`${API}/analytics/pages${qs}`).then(r => r.json()) as Promise<PageRow[]>,
      fetch(`${API}/analytics/sources${qs}`).then(r => r.json()) as Promise<SourceRow[]>,
      fetch(`${API}/analytics/realtime?project_id=${projectId}`).then(r => r.json()) as Promise<Realtime>,
      fetch(`${API}/analytics/geo${qs}`).then(r => r.json()).catch(() => ({ countries: [] })) as Promise<{ countries: GeoRow[] }>,
    ]);
    setOverview(o);
    setTimeseries(ts.map(d => ({ ...d, day: new Date(d.day).toLocaleDateString("en-US", { month:"short", day:"numeric" }) })));
    setPages(pg);
    setSources(src);
    setRealtime(rt);
    setGeo(geoData.countries ?? []);
    setLoading(false);
  }, [projectId, period]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!projectId) return;
      void fetch(`${API}/analytics/realtime?project_id=${projectId}`)
        .then(r => r.json())
        .then(d => setRealtime(d as Realtime));
    }, 30000);
    return () => clearInterval(id);
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;

    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${proto}//${window.location.host}/api/realtime?project_id=${projectId}`;

    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => {
        setWsConnected(false);
        reconnectTimer = setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data as string) as { type: string; data?: Record<string, unknown> };
          if (msg.type === "new_event" && msg.data) {
            const ev: LiveEvent = {
              eventType: msg.data["eventType"] as string,
              pageUrl: msg.data["pageUrl"] as string | null,
              country: msg.data["country"] as string | null,
              device: msg.data["device"] as string,
              timestamp: msg.data["timestamp"] as number,
            };
            setLiveEvents(prev => [ev, ...prev].slice(0, 20));
            setRealtime(prev => prev ? { ...prev, activeVisitors: prev.activeVisitors + (ev.eventType === "pageview" ? 1 : 0) } : prev);
          }
        } catch { /* ignore */ }
      };
    }

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [projectId]);

  if (!projectId) {
    return (
      <AnalyticsLayout>
        <div className="flex flex-col items-center justify-center h-full py-32 text-white/40">
          <Activity size={48} className="mb-4 opacity-30" />
          <p className="text-lg font-medium">Select a project</p>
          <p className="text-sm mt-1">Go to Projects and choose a project to view analytics</p>
          <a href="/analytics/projects" className="mt-4 text-blue-400 hover:underline text-sm">Manage Projects →</a>
        </div>
      </AnalyticsLayout>
    );
  }

  const maxGeo = geo[0] ? Number(geo[0].visitors) : 1;

  return (
    <AnalyticsLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Dashboard</h1>
            <p className="text-white/40 text-sm">Project: {projectId.slice(0, 8)}…</p>
          </div>
          <div className="flex items-center gap-3">
            {wsConnected ? (
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-sm font-medium">{realtime?.activeVisitors ?? 0} live</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-white/30" />
                <span className="text-white/40 text-sm">Connecting…</span>
              </div>
            )}
            <div className="flex bg-white/5 rounded-lg border border-white/10 overflow-hidden">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium transition-colors",
                    period === p.value ? "bg-blue-600 text-white" : "text-white/50 hover:text-white"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button onClick={() => void load()} className="text-white/40 hover:text-white transition-colors">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {loading && !overview ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-4">
              <StatCard label="Unique Visitors" value={(overview?.visitors ?? 0).toLocaleString()} icon={Users} color="bg-blue-500/20" sub="Total unique visitors" />
              <StatCard label="Page Views" value={(overview?.pageviews ?? 0).toLocaleString()} icon={Eye} color="bg-purple-500/20" />
              <StatCard label="Sessions" value={(overview?.sessions ?? 0).toLocaleString()} icon={Activity} color="bg-emerald-500/20" />
              <StatCard
                label="Bounce Rate"
                value={`${overview?.bounceRate ?? 0}%`}
                icon={TrendingDown}
                color="bg-orange-500/20"
                sub={Number(overview?.bounceRate ?? 0) > 60 ? "⚠ High — consider UX improvements" : "✓ Good engagement"}
                trend={Number(overview?.bounceRate ?? 0) > 60 ? "down" : "up"}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 bg-white/5 border border-white/10 rounded-xl p-5">
                <h2 className="text-sm font-semibold mb-4 text-white/80">Visitors & Page Views Over Time</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={timeseries} margin={{ top:5, right:5, bottom:0, left:-20 }}>
                    <defs>
                      <linearGradient id="gVisitors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gPageviews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fill: "#ffffff40", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#ffffff40", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={2} fill="url(#gVisitors)" dot={false} name="Visitors" isAnimationActive animationDuration={800} />
                    <Area type="monotone" dataKey="pageviews" stroke="#8b5cf6" strokeWidth={2} fill="url(#gPageviews)" dot={false} name="Page Views" isAnimationActive animationDuration={800} />
                    <Legend wrapperStyle={{ color: "#ffffff60", fontSize: 12 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h2 className="text-sm font-semibold mb-4 text-white/80">Traffic Sources</h2>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={sources}
                      dataKey="visits"
                      nameKey="source"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={42}
                      paddingAngle={2}
                      isAnimationActive
                      animationDuration={800}
                    >
                      {sources.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1">
                  {sources.slice(0, 5).map((s, i) => (
                    <div key={s.source} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-white/60 truncate max-w-[90px]">{s.source}</span>
                      </div>
                      <span className="text-white/80 tabular-nums">{Number(s.visits).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 bg-white/5 border border-white/10 rounded-xl p-5">
                <h2 className="text-sm font-semibold mb-4 text-white/80">Top Pages</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-white/30 text-xs border-b border-white/10">
                      <th className="text-left pb-2 font-medium">Page</th>
                      <th className="text-right pb-2 font-medium">Views</th>
                      <th className="text-right pb-2 font-medium">Visitors</th>
                      <th className="text-right pb-2 font-medium">Avg Scroll</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pages.map((p) => (
                      <tr key={p.page_url} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                        <td className="py-2 text-white/70 font-mono text-xs max-w-[180px] truncate">{p.page_url || "/"}</td>
                        <td className="py-2 text-right tabular-nums">{Number(p.views).toLocaleString()}</td>
                        <td className="py-2 text-right tabular-nums text-white/60">{Number(p.unique_visitors).toLocaleString()}</td>
                        <td className="py-2 text-right text-white/60">
                          {p.avg_scroll ? (
                            <span className="inline-flex items-center gap-1">
                              {Math.round(Number(p.avg_scroll))}%
                              <div className="w-8 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.round(Number(p.avg_scroll))}%` }} />
                              </div>
                            </span>
                          ) : "—"}
                        </td>
                      </tr>
                    ))}
                    {pages.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-white/30">No data yet</td></tr>}
                  </tbody>
                </table>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <h2 className="text-sm font-semibold mb-3 text-white/80">Devices</h2>
                  <div className="space-y-2.5">
                    {(overview?.devices ?? []).map((d) => {
                      const Icon = deviceIcon(d.device_type);
                      const total = (overview?.devices ?? []).reduce((a, b) => a + Number(b.count), 0);
                      const pct = total > 0 ? Math.round((Number(d.count) / total) * 100) : 0;
                      return (
                        <div key={d.device_type} className="flex items-center gap-2">
                          <Icon size={14} className="text-white/40 shrink-0" />
                          <div className="flex-1">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="capitalize text-white/60">{d.device_type}</span>
                              <span className="text-white/80 tabular-nums">{pct}%</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {(overview?.devices ?? []).length === 0 && <div className="text-white/30 text-xs text-center py-4">No data</div>}
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={13} className="text-green-400" />
                    <h2 className="text-sm font-semibold text-white/80">Live Activity</h2>
                  </div>
                  <div className="text-3xl font-bold text-green-400 tabular-nums">{realtime?.activeVisitors ?? 0}</div>
                  <div className="text-xs text-white/40 mb-3">active in last 5 min</div>
                  <div className="space-y-1.5">
                    {(realtime?.activePages ?? []).map((p) => (
                      <div key={p.page_url} className="flex justify-between text-xs">
                        <span className="text-white/50 font-mono truncate">{p.page_url || "/"}</span>
                        <span className="text-green-400 shrink-0 ml-2 tabular-nums">{p.visitors}</span>
                      </div>
                    ))}
                  </div>
                  {liveEvents.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
                      <div className="text-xs text-white/30 mb-1.5">Recent events</div>
                      {liveEvents.slice(0, 5).map((ev, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full shrink-0",
                            ev.eventType === "pageview" ? "bg-blue-400" :
                            ev.eventType === "click" ? "bg-orange-400" :
                            ev.eventType === "form_submit" ? "bg-green-400" : "bg-purple-400"
                          )} />
                          <span className="text-white/40 truncate">{ev.pageUrl || ev.eventType}</span>
                          {ev.country && <span className="text-white/30 shrink-0">{COUNTRY_FLAGS[ev.country] ?? ev.country}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h2 className="text-sm font-semibold mb-4 text-white/80 flex items-center gap-2">
                  <Globe size={14} className="text-blue-400" />
                  Visitors by Country
                </h2>
                {geo.length === 0 ? (
                  <div className="text-center py-8 text-white/30 text-sm">
                    <Globe size={32} className="mx-auto mb-2 opacity-20" />
                    No geo data yet — starts populating on next visitor
                  </div>
                ) : (
                  <div className="space-y-2">
                    {geo.slice(0, 8).map((g, i) => {
                      const pct = Math.round((Number(g.visitors) / maxGeo) * 100);
                      return (
                        <div key={g.country} className="flex items-center gap-3">
                          <span className="text-sm w-6 text-center">{COUNTRY_FLAGS[g.country] ?? "🌐"}</span>
                          <span className="text-xs text-white/60 w-8">{g.country}</span>
                          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }}
                            />
                          </div>
                          <span className="text-xs text-white/60 tabular-nums w-10 text-right">{Number(g.visitors).toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h2 className="text-sm font-semibold mb-4 text-white/80">Browsers</h2>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={overview?.browsers ?? []} margin={{ top:0, right:0, bottom:0, left:-20 }}>
                    <XAxis dataKey="browser" tick={{ fill: "#ffffff40", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#ffffff40", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Bar dataKey="count" radius={[4,4,0,0]} name="Sessions" isAnimationActive animationDuration={600}>
                      {(overview?.browsers ?? []).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </AnalyticsLayout>
  );
}
