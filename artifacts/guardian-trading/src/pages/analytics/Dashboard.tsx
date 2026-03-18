import { useState, useEffect, useCallback } from "react";
import AnalyticsLayout from "@/components/analytics/AnalyticsLayout";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";
import { Users, Eye, Activity, TrendingDown, Monitor, Smartphone, Tablet, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

const API = "/api";
const COLORS = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444","#06b6d4"];

interface Overview { visitors: number; pageviews: number; sessions: number; bounceRate: number; devices: {device_type:string;count:number}[]; browsers: {browser:string;count:number}[]; }
interface TimePoint { day: string; pageviews: number; visitors: number; }
interface PageRow { page_url: string; views: number; unique_visitors: number; avg_scroll: number; }
interface SourceRow { source: string; visits: number; unique_visitors: number; }
interface Realtime { activeVisitors: number; eventsLast5Min: number; activePages: {page_url:string;visitors:number}[]; }

const PERIODS = [
  { label: "Today", value: "1d" },
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
];

function StatCard({ label, value, icon: Icon, sub, color }: { label: string; value: string | number; icon: React.ElementType; sub?: string; color?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-white/50 text-sm">{label}</span>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", color ?? "bg-blue-500/20")}>
          <Icon size={16} className={cn(color ? "text-current" : "text-blue-400")} />
        </div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-white/40 mt-1">{sub}</div>}
    </div>
  );
}

const deviceIcon = (t: string) => t === "mobile" ? Smartphone : t === "tablet" ? Tablet : Monitor;

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
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    setLoading(true);
    const qs = `?project_id=${projectId}&period=${period}`;
    const [o, ts, pg, src, rt] = await Promise.all([
      fetch(`${API}/analytics/overview${qs}`).then(r => r.json()) as Promise<Overview>,
      fetch(`${API}/analytics/timeseries${qs}`).then(r => r.json()) as Promise<TimePoint[]>,
      fetch(`${API}/analytics/pages${qs}`).then(r => r.json()) as Promise<PageRow[]>,
      fetch(`${API}/analytics/sources${qs}`).then(r => r.json()) as Promise<SourceRow[]>,
      fetch(`${API}/analytics/realtime?project_id=${projectId}`).then(r => r.json()) as Promise<Realtime>,
    ]);
    setOverview(o);
    setTimeseries(ts.map(d => ({ ...d, day: new Date(d.day).toLocaleDateString("en-US", { month:"short", day:"numeric" }) })));
    setPages(pg);
    setSources(src);
    setRealtime(rt);
    setLoading(false);
  }, [projectId, period]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const id = setInterval(() => { void fetch(`${API}/analytics/realtime?project_id=${projectId}`).then(r => r.json()).then(d => setRealtime(d as Realtime)); }, 30000);
    return () => clearInterval(id);
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

  return (
    <AnalyticsLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Dashboard</h1>
            <p className="text-white/40 text-sm">Project: {projectId.slice(0, 8)}…</p>
          </div>
          <div className="flex items-center gap-3">
            {realtime && (
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-sm font-medium">{realtime.activeVisitors} live</span>
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
          <div className="text-center py-20 text-white/30">Loading analytics…</div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-4">
              <StatCard label="Unique Visitors" value={(overview?.visitors ?? 0).toLocaleString()} icon={Users} color="bg-blue-500/20" />
              <StatCard label="Page Views" value={(overview?.pageviews ?? 0).toLocaleString()} icon={Eye} color="bg-purple-500/20" />
              <StatCard label="Sessions" value={(overview?.sessions ?? 0).toLocaleString()} icon={Activity} color="bg-emerald-500/20" />
              <StatCard label="Bounce Rate" value={`${overview?.bounceRate ?? 0}%`} icon={TrendingDown} color="bg-orange-500/20" sub={Number(overview?.bounceRate ?? 0) > 60 ? "High — consider UX improvements" : "Good engagement"} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 bg-white/5 border border-white/10 rounded-xl p-5">
                <h2 className="text-sm font-semibold mb-4">Visitors & Page Views Over Time</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={timeseries} margin={{ top:0, right:0, bottom:0, left:-20 }}>
                    <XAxis dataKey="day" tick={{ fill: "#ffffff40", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#ffffff40", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #ffffff20", borderRadius: 8, color: "#fff" }} />
                    <Line type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={2} dot={false} name="Visitors" />
                    <Line type="monotone" dataKey="pageviews" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Page Views" />
                    <Legend wrapperStyle={{ color: "#ffffff60", fontSize: 12 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h2 className="text-sm font-semibold mb-4">Traffic Sources</h2>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={sources} dataKey="visits" nameKey="source" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                      {sources.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #ffffff20", borderRadius: 8, color: "#fff" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1">
                  {sources.slice(0, 5).map((s, i) => (
                    <div key={s.source} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-white/60">{s.source}</span>
                      </div>
                      <span className="text-white/80">{Number(s.visits).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 bg-white/5 border border-white/10 rounded-xl p-5">
                <h2 className="text-sm font-semibold mb-4">Top Pages</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-white/40 text-xs border-b border-white/10">
                      <th className="text-left pb-2">Page</th>
                      <th className="text-right pb-2">Views</th>
                      <th className="text-right pb-2">Visitors</th>
                      <th className="text-right pb-2">Scroll</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pages.map((p) => (
                      <tr key={p.page_url} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-2 text-white/70 font-mono text-xs">{p.page_url || "/"}</td>
                        <td className="py-2 text-right">{Number(p.views).toLocaleString()}</td>
                        <td className="py-2 text-right text-white/60">{Number(p.unique_visitors).toLocaleString()}</td>
                        <td className="py-2 text-right text-white/60">{p.avg_scroll ? `${Math.round(Number(p.avg_scroll))}%` : "—"}</td>
                      </tr>
                    ))}
                    {pages.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-white/30">No data yet</td></tr>}
                  </tbody>
                </table>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <h2 className="text-sm font-semibold mb-3">Devices</h2>
                  <div className="space-y-2">
                    {(overview?.devices ?? []).map((d) => {
                      const Icon = deviceIcon(d.device_type);
                      const total = (overview?.devices ?? []).reduce((a, b) => a + Number(b.count), 0);
                      const pct = total > 0 ? Math.round((Number(d.count) / total) * 100) : 0;
                      return (
                        <div key={d.device_type} className="flex items-center gap-2">
                          <Icon size={14} className="text-white/40 shrink-0" />
                          <div className="flex-1">
                            <div className="flex justify-between text-xs mb-0.5">
                              <span className="capitalize text-white/60">{d.device_type}</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {(overview?.devices ?? []).length === 0 && <div className="text-white/30 text-xs text-center py-4">No data</div>}
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <h2 className="text-sm font-semibold mb-3">Live Activity</h2>
                  <div className="text-3xl font-bold text-green-400">{realtime?.activeVisitors ?? 0}</div>
                  <div className="text-xs text-white/40 mb-3">active in last 5 min</div>
                  <div className="space-y-1">
                    {(realtime?.activePages ?? []).map((p) => (
                      <div key={p.page_url} className="flex justify-between text-xs">
                        <span className="text-white/50 font-mono truncate">{p.page_url || "/"}</span>
                        <span className="text-green-400 shrink-0 ml-2">{p.visitors}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h2 className="text-sm font-semibold mb-4">Browsers</h2>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={overview?.browsers ?? []} margin={{ top:0, right:0, bottom:0, left:-20 }}>
                  <XAxis dataKey="browser" tick={{ fill: "#ffffff40", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#ffffff40", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #ffffff20", borderRadius: 8, color: "#fff" }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]} name="Sessions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </AnalyticsLayout>
  );
}
