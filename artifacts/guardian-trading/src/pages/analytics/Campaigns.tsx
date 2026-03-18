import { useState, useEffect, useCallback } from "react";
import AnalyticsLayout from "@/components/analytics/AnalyticsLayout";
import { Megaphone, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface Campaign {
  campaign: string;
  source: string;
  medium: string;
  sessions: number;
  visitors: number;
  pageviews: number;
  conversions: number;
}

const API = "/api";
const PERIODS = [
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
];

export default function Campaigns() {
  const [location] = useLocation();
  void location;
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get("project_id") ?? localStorage.getItem("gt_project_id");

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [period, setPeriod] = useState("7d");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    setLoading(true);
    const r = await fetch(`${API}/analytics/campaigns?project_id=${projectId}&period=${period}`);
    const data = await r.json() as Campaign[];
    setCampaigns(data);
    setLoading(false);
  }, [projectId, period]);

  useEffect(() => { void load(); }, [load]);

  const totalSessions = campaigns.reduce((a, c) => a + Number(c.sessions), 0);
  const totalConversions = campaigns.reduce((a, c) => a + Number(c.conversions), 0);
  const topCampaigns = campaigns.slice(0, 8);

  if (!projectId) {
    return (
      <AnalyticsLayout>
        <div className="flex items-center justify-center py-32 text-white/40">
          <div className="text-center">
            <Megaphone size={48} className="mx-auto mb-4 opacity-30" />
            <p>Select a project to view campaigns</p>
            <a href="/analytics/projects" className="text-blue-400 text-sm mt-2 block">Go to Projects →</a>
          </div>
        </div>
      </AnalyticsLayout>
    );
  }

  return (
    <AnalyticsLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Campaign Attribution</h1>
            <p className="text-white/40 text-sm">UTM parameter tracking and conversion analysis</p>
          </div>
          <div className="flex bg-white/5 rounded-lg border border-white/10 overflow-hidden">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${period === p.value ? "bg-blue-600 text-white" : "text-white/50 hover:text-white"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="text-white/50 text-sm mb-1">Total Campaigns</div>
            <div className="text-3xl font-bold">{campaigns.length}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="text-white/50 text-sm mb-1">Campaign Sessions</div>
            <div className="text-3xl font-bold">{totalSessions.toLocaleString()}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="text-white/50 text-sm mb-1">Conversions</div>
            <div className="text-3xl font-bold text-green-400">{totalConversions.toLocaleString()}</div>
            <div className="text-xs text-white/40 mt-1">
              {totalSessions > 0 ? `${((totalConversions / totalSessions) * 100).toFixed(1)}% rate` : "—"}
            </div>
          </div>
        </div>

        {topCampaigns.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h2 className="text-sm font-semibold mb-4">Sessions by Campaign</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topCampaigns} margin={{ top:0, right:0, bottom:0, left:-20 }}>
                <XAxis dataKey="campaign" tick={{ fill: "#ffffff40", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#ffffff40", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #ffffff20", borderRadius: 8, color: "#fff" }} />
                <Bar dataKey="sessions" fill="#3b82f6" radius={[4,4,0,0]} name="Sessions" />
                <Bar dataKey="conversions" fill="#10b981" radius={[4,4,0,0]} name="Conversions" />
                <Legend wrapperStyle={{ color: "#ffffff60", fontSize: 12 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-white/10 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-400" />
            <h2 className="text-sm font-semibold">Attribution Table</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 text-xs border-b border-white/10">
                  <th className="text-left px-5 py-3">Campaign</th>
                  <th className="text-left px-3 py-3">Source</th>
                  <th className="text-left px-3 py-3">Medium</th>
                  <th className="text-right px-3 py-3">Sessions</th>
                  <th className="text-right px-3 py-3">Visitors</th>
                  <th className="text-right px-3 py-3">Pageviews</th>
                  <th className="text-right px-5 py-3">Conversions</th>
                  <th className="text-right px-5 py-3">CVR</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-12 text-white/30">Loading…</td></tr>
                ) : campaigns.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-white/30">No campaign data yet. Add UTM parameters to your URLs to track campaigns.</td></tr>
                ) : (
                  campaigns.map((c, i) => {
                    const cvr = Number(c.sessions) > 0
                      ? ((Number(c.conversions) / Number(c.sessions)) * 100).toFixed(1)
                      : "0";
                    return (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-5 py-3 font-medium">{c.campaign}</td>
                        <td className="px-3 py-3 text-blue-400">{c.source}</td>
                        <td className="px-3 py-3 text-white/60">{c.medium}</td>
                        <td className="px-3 py-3 text-right">{Number(c.sessions).toLocaleString()}</td>
                        <td className="px-3 py-3 text-right text-white/60">{Number(c.visitors).toLocaleString()}</td>
                        <td className="px-3 py-3 text-right text-white/60">{Number(c.pageviews).toLocaleString()}</td>
                        <td className="px-5 py-3 text-right text-green-400 font-medium">{Number(c.conversions).toLocaleString()}</td>
                        <td className="px-5 py-3 text-right">{cvr}%</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AnalyticsLayout>
  );
}
