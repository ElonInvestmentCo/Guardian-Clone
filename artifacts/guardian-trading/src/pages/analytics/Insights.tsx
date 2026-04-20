import { useState, useEffect } from "react";
import loaderGif from "@assets/D63BF694-BB76-43CE-AFFB-E54A8FFDFBC5_1775805898246.gif";
import AnalyticsLayout from "@/components/analytics/AnalyticsLayout";
import { Lightbulb, AlertTriangle, CheckCircle, Info, RefreshCw } from "lucide-react";
import { useLocation, Link } from "wouter";

interface Insight {
  type: "warning" | "success" | "info";
  title: string;
  description: string;
}

const API = "/api";

const ICON_MAP = {
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
};

const COLOR_MAP = {
  warning: "border-orange-500/30 bg-orange-500/10",
  success: "border-green-500/30 bg-green-500/10",
  info: "border-blue-500/30 bg-blue-500/10",
};

const ICON_COLOR_MAP = {
  warning: "text-orange-400",
  success: "text-green-400",
  info: "text-blue-400",
};

const TRACKING_TIPS = [
  {
    title: "Install tracking on all pages",
    description: "Make sure the tracking script is on every page, including thank-you and confirmation pages, to capture the full user journey.",
    type: "info" as const,
  },
  {
    title: "Use UTM parameters for campaigns",
    description: "Add utm_source, utm_medium, and utm_campaign parameters to your ad links to attribute conversions accurately.",
    type: "info" as const,
  },
  {
    title: "Track custom conversion events",
    description: "Use analytics.track('purchase_completed') or analytics.track('signup_completed') to measure what matters most.",
    type: "info" as const,
  },
  {
    title: "Monitor bounce rate weekly",
    description: "A sudden spike in bounce rate often signals a broken page, slow load times, or mismatched ad targeting.",
    type: "warning" as const,
  },
];

export default function Insights() {
  const [location] = useLocation();
  void location;
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get("project_id") ?? localStorage.getItem("gt_project_id");

  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!projectId) { setLoading(false); return; }
    setLoading(true);
    try {
      const r = await fetch(`${API}/analytics/ai-insights?project_id=${projectId}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json() as { insights: Insight[] };
      setInsights(data.insights ?? []);
    } catch {
      setInsights([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [projectId]);

  if (!projectId) {
    return (
      <AnalyticsLayout>
        <div className="flex items-center justify-center py-32 text-white/40">
          <div className="text-center">
            <Lightbulb size={48} className="mx-auto mb-4 opacity-30" />
            <p>Select a project to view AI insights</p>
            <Link href="/analytics/projects" className="text-blue-400 text-sm mt-2 block">Go to Projects →</Link>
          </div>
        </div>
      </AnalyticsLayout>
    );
  }

  return (
    <AnalyticsLayout>
      <div className="p-6 space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">AI Insights</h1>
            <p className="text-white/40 text-sm">Automated analysis of your analytics data</p>
          </div>
          <button
            onClick={() => void load()}
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
          >
            {loading ? <img src={loaderGif} alt="" draggable={false} style={{ width: 14, height: 14, objectFit: "contain" }} /> : <RefreshCw size={14} />}
            Refresh
          </button>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Data-Driven Insights</h2>
          {loading ? (
            <div className="text-center py-12 text-white/30">Analyzing your data…</div>
          ) : (
            insights.map((insight, i) => {
              const Icon = ICON_MAP[insight.type];
              return (
                <div
                  key={i}
                  className={`border rounded-xl p-4 flex gap-4 ${COLOR_MAP[insight.type]}`}
                >
                  <div className="shrink-0 mt-0.5">
                    <Icon size={18} className={ICON_COLOR_MAP[insight.type]} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm mb-1">{insight.title}</div>
                    <div className="text-white/60 text-sm leading-relaxed">{insight.description}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Best Practices</h2>
          {TRACKING_TIPS.map((tip, i) => {
            const Icon = ICON_MAP[tip.type];
            return (
              <div
                key={i}
                className={`border rounded-xl p-4 flex gap-4 ${COLOR_MAP[tip.type]}`}
              >
                <div className="shrink-0 mt-0.5">
                  <Icon size={18} className={ICON_COLOR_MAP[tip.type]} />
                </div>
                <div>
                  <div className="font-semibold text-sm mb-1">{tip.title}</div>
                  <div className="text-white/60 text-sm leading-relaxed">{tip.description}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Lightbulb size={16} className="text-yellow-400" />
            Quick API Reference
          </h2>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-white/40 mb-1">Track custom event:</div>
              <pre className="bg-black/30 rounded-lg p-3 text-xs text-green-400 overflow-x-auto">
{`analytics.track("button_clicked", { button: "CTA" });`}
              </pre>
            </div>
            <div>
              <div className="text-xs text-white/40 mb-1">Track page view manually:</div>
              <pre className="bg-black/30 rounded-lg p-3 text-xs text-green-400 overflow-x-auto">
{`analytics.page();`}
              </pre>
            </div>
            <div>
              <div className="text-xs text-white/40 mb-1">Identify a user:</div>
              <pre className="bg-black/30 rounded-lg p-3 text-xs text-green-400 overflow-x-auto">
{`analytics.identify("user_123");`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </AnalyticsLayout>
  );
}
