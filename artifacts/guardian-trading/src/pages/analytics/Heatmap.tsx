import { useState, useEffect, useRef, useCallback } from "react";
import AnalyticsLayout from "@/components/analytics/AnalyticsLayout";
import { Flame, MousePointer } from "lucide-react";
import { useLocation } from "wouter";

interface HeatPoint { click_x: number; click_y: number; viewport_width: number; viewport_height: number; }
interface HeatPage { page_url: string; clicks: number; }

const API = "/api";

function heatColor(t: number): [number, number, number, number] {
  // t in [0,1]: blue → cyan → green → yellow → red
  if (t < 0.25) {
    const s = t / 0.25;
    return [0, Math.round(s * 255), 255, Math.round(t * 600)];
  } else if (t < 0.5) {
    const s = (t - 0.25) / 0.25;
    return [0, 255, Math.round((1 - s) * 255), Math.round(t * 600)];
  } else if (t < 0.75) {
    const s = (t - 0.5) / 0.25;
    return [Math.round(s * 255), 255, 0, Math.round(t * 600)];
  } else {
    const s = (t - 0.75) / 0.25;
    return [255, Math.round((1 - s) * 255), 0, Math.round(t * 600)];
  }
}

function drawHeatmap(canvas: HTMLCanvasElement, points: HeatPoint[]) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const radius = 28;
  const offscreen = document.createElement("canvas");
  offscreen.width = canvas.width;
  offscreen.height = canvas.height;
  const offCtx = offscreen.getContext("2d")!;
  offCtx.globalCompositeOperation = "source-over";

  // Draw each point as a radial gradient into the offscreen alpha channel
  for (const p of points) {
    const vw = p.viewport_width || 1280;
    const vh = p.viewport_height || 800;
    const x = (p.click_x / vw) * canvas.width;
    const y = (p.click_y / vh) * canvas.height;

    const grad = offCtx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, "rgba(255,255,255,0.12)");
    grad.addColorStop(0.5, "rgba(255,255,255,0.05)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    offCtx.fillStyle = grad;
    offCtx.beginPath();
    offCtx.arc(x, y, radius, 0, Math.PI * 2);
    offCtx.fill();
  }

  // Colorize based on accumulated alpha
  const imgData = offCtx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const raw = data[i]!;
    if (raw === 0) continue;
    const t = Math.min(1, raw / 180);
    const [r, g, b, a] = heatColor(t);
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = Math.min(220, a);
  }

  offCtx.putImageData(imgData, 0, 0);
  ctx.drawImage(offscreen, 0, 0);
}

export default function Heatmap() {
  const [location] = useLocation();
  void location;
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get("project_id") ?? localStorage.getItem("gt_project_id");

  const [pages, setPages] = useState<HeatPage[]>([]);
  const [selectedPage, setSelectedPage] = useState("/");
  const [points, setPoints] = useState<HeatPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!projectId) return;
    void fetch(`${API}/analytics/heatmap-pages?project_id=${projectId}`)
      .then(r => r.json())
      .then(d => {
        setPages(d as HeatPage[]);
        if ((d as HeatPage[]).length > 0) setSelectedPage((d as HeatPage[])[0]!.page_url);
      });
  }, [projectId]);

  const loadPoints = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const r = await fetch(`${API}/analytics/heatmap?project_id=${projectId}&page_url=${encodeURIComponent(selectedPage)}`);
    const data = await r.json() as HeatPoint[];
    setPoints(data);
    setLoading(false);
  }, [projectId, selectedPage]);

  useEffect(() => { void loadPoints(); }, [loadPoints]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || points.length === 0) return;
    drawHeatmap(canvas, points);
  }, [points]);

  if (!projectId) {
    return (
      <AnalyticsLayout>
        <div className="flex items-center justify-center py-32 text-white/40">
          <div className="text-center">
            <Flame size={48} className="mx-auto mb-4 opacity-30" />
            <p>Select a project to view heatmaps</p>
            <a href="/analytics/projects" className="text-blue-400 text-sm mt-2 block">Go to Projects →</a>
          </div>
        </div>
      </AnalyticsLayout>
    );
  }

  return (
    <AnalyticsLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold">Click Heatmaps</h1>
          <p className="text-white/40 text-sm">Visualize where users click on your pages</p>
        </div>

        <div className="flex items-center gap-3">
          <MousePointer size={14} className="text-white/40" />
          <span className="text-sm text-white/60">Page:</span>
          <select
            className="bg-white/5 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white"
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
          >
            {pages.map((p) => (
              <option key={p.page_url} value={p.page_url}>
                {p.page_url || "/"} ({Number(p.clicks).toLocaleString()} clicks)
              </option>
            ))}
            {pages.length === 0 && <option value="/">/</option>}
          </select>
          <span className="text-white/40 text-sm">{points.length} data points</span>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="relative" style={{ paddingBottom: "62.5%", background: "linear-gradient(to bottom, #0d1117, #161b22)" }}>
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center text-white/30">Loading heatmap…</div>
            ) : points.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30">
                <Flame size={48} className="mb-3 opacity-30" />
                <p>No click data for this page yet</p>
                <p className="text-sm mt-1">Install the tracking script to start collecting data</p>
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                width={1280}
                height={800}
                className="absolute inset-0 w-full h-full"
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-3">
            <h2 className="text-sm font-semibold mb-3">Most Clicked Pages</h2>
            <div className="space-y-2">
              {pages.map((p, i) => {
                const maxClicks = pages[0] ? Number(pages[0].clicks) : 1;
                const pct = Math.round((Number(p.clicks) / maxClicks) * 100);
                return (
                  <div
                    key={p.page_url}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedPage === p.page_url ? "bg-blue-600/20 border border-blue-500/30" : "bg-white/5 hover:bg-white/8 border border-transparent"}`}
                    onClick={() => setSelectedPage(p.page_url)}
                  >
                    <span className="text-white/30 w-5 text-xs text-right">{i + 1}</span>
                    <span className="font-mono text-sm flex-1 truncate">{p.page_url || "/"}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm text-white/60 w-16 text-right">{Number(p.clicks).toLocaleString()} clicks</span>
                    </div>
                  </div>
                );
              })}
              {pages.length === 0 && <div className="text-white/30 text-center py-8">No data yet</div>}
            </div>
          </div>
        </div>
      </div>
    </AnalyticsLayout>
  );
}
