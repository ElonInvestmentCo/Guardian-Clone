import { useState, useEffect, useRef, useCallback } from "react";
import spinnerImg from "@assets/bazaart-image_(1)_1775255690400.png";
import AnalyticsLayout from "@/components/analytics/AnalyticsLayout";
import { Flame, MousePointer, Layers, BarChart2 } from "lucide-react";
import { useLocation, Link } from "wouter";

interface HeatPoint { click_x: number; click_y: number; viewport_width: number; viewport_height: number; }
interface HeatPage { page_url: string; clicks: number; }

const API = "/api";

const RAMP: Array<[number, number, number, number]> = [
  [0,   0,   0,   0  ],
  [0,   0,   255, 0  ],
  [0,   128, 255, 80 ],
  [0,   220, 180, 130],
  [50,  255, 50,  170],
  [255, 230, 0,   200],
  [255, 120, 0,   220],
  [255, 0,   0,   240],
];

const RAMP_T = [0, 0.12, 0.28, 0.42, 0.58, 0.72, 0.86, 1.0];

function colorRamp(t: number): [number, number, number, number] {
  const clamped = Math.max(0, Math.min(1, t));
  let lo = 0;
  for (let i = RAMP_T.length - 2; i >= 0; i--) {
    if (clamped >= RAMP_T[i]!) { lo = i; break; }
  }
  const hi = Math.min(lo + 1, RAMP_T.length - 1);
  const span = RAMP_T[hi]! - RAMP_T[lo]!;
  const s = span > 0 ? (clamped - RAMP_T[lo]!) / span : 0;
  const a = RAMP[lo]!, b = RAMP[hi]!;
  return [
    Math.round(a[0] + s * (b[0] - a[0])),
    Math.round(a[1] + s * (b[1] - a[1])),
    Math.round(a[2] + s * (b[2] - a[2])),
    Math.round(a[3] + s * (b[3] - a[3])),
  ];
}

function drawHeatmap(canvas: HTMLCanvasElement, points: HeatPoint[]) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  const offscreen = document.createElement("canvas");
  offscreen.width = W;
  offscreen.height = H;
  const off = offscreen.getContext("2d")!;

  off.globalCompositeOperation = "lighter";

  const density = points.length;
  const radius = Math.min(80, Math.max(24, Math.round(1600 / Math.sqrt(Math.max(1, density)))));
  const alpha = Math.max(0.04, Math.min(0.25, 12 / Math.max(1, density)));

  for (const p of points) {
    const vw = p.viewport_width || 1280;
    const vh = p.viewport_height || 800;
    const x = Math.round((p.click_x / vw) * W);
    const y = Math.round((p.click_y / vh) * H);

    const grad = off.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, `rgba(255,255,255,${(alpha * 3).toFixed(3)})`);
    grad.addColorStop(0.15, `rgba(255,255,255,${(alpha * 2).toFixed(3)})`);
    grad.addColorStop(0.4, `rgba(255,255,255,${alpha.toFixed(3)})`);
    grad.addColorStop(0.7, `rgba(255,255,255,${(alpha * 0.3).toFixed(3)})`);
    grad.addColorStop(1, "rgba(255,255,255,0)");
    off.fillStyle = grad;
    off.beginPath();
    off.arc(x, y, radius, 0, Math.PI * 2);
    off.fill();
  }

  const imgData = off.getImageData(0, 0, W, H);
  const data = imgData.data;

  let maxVal = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i]! > maxVal) maxVal = data[i]!;
  }
  if (maxVal === 0) return;

  for (let i = 0; i < data.length; i += 4) {
    const raw = data[i]!;
    if (raw === 0) { data[i + 3] = 0; continue; }
    const t = Math.pow(raw / maxVal, 0.7);
    const [r, g, b, a] = colorRamp(t);
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = a;
  }

  off.putImageData(imgData, 0, 0);
  ctx.drawImage(offscreen, 0, 0);
}

function HeatmapLegend() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const w = c.width;
    const h = c.height;
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const [r, g, b, a] = colorRamp(t);
      grad.addColorStop(t, `rgba(${r},${g},${b},${(a / 255).toFixed(2)})`);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }, []);
  return (
    <div className="flex items-center gap-3 text-xs text-white/40">
      <span>Low</span>
      <canvas ref={canvasRef} width={120} height={10} className="rounded" />
      <span>High</span>
    </div>
  );
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
  const [rendering, setRendering] = useState(false);
  const [view, setView] = useState<"heatmap" | "clusters">("heatmap");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!projectId) return;
    void fetch(`${API}/analytics/heatmap-pages?project_id=${projectId}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => {
        setPages(d as HeatPage[]);
        if ((d as HeatPage[]).length > 0) setSelectedPage((d as HeatPage[])[0]!.page_url);
      })
      .catch(() => { /* API unavailable */ });
  }, [projectId]);

  const loadPoints = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/analytics/heatmap?project_id=${projectId}&page_url=${encodeURIComponent(selectedPage)}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json() as HeatPoint[];
      setPoints(data);
    } catch {
      setPoints([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedPage]);

  useEffect(() => { void loadPoints(); }, [loadPoints]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || points.length === 0) return;
    setRendering(true);
    requestAnimationFrame(() => {
      drawHeatmap(canvas, points);
      setRendering(false);
    });
  }, [points, view]);

  const maxClicks = pages[0] ? Number(pages[0].clicks) : 1;

  if (!projectId) {
    return (
      <AnalyticsLayout>
        <div className="flex items-center justify-center py-32 text-white/40">
          <div className="text-center">
            <Flame size={48} className="mx-auto mb-4 opacity-30" />
            <p>Select a project to view heatmaps</p>
            <Link href="/analytics/projects" className="text-blue-400 text-sm mt-2 block">Go to Projects →</Link>
          </div>
        </div>
      </AnalyticsLayout>
    );
  }

  return (
    <AnalyticsLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Flame size={20} className="text-orange-400" />
              Click Heatmaps
            </h1>
            <p className="text-white/40 text-sm mt-0.5">Visualize where users interact on your pages</p>
          </div>
          <HeatmapLegend />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
            <MousePointer size={13} className="text-white/40" />
            <span className="text-xs text-white/50">Page:</span>
            <select
              className="bg-transparent text-sm text-white outline-none cursor-pointer"
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
            >
              {pages.map((p) => (
                <option key={p.page_url} value={p.page_url} className="bg-[#1a1a2e]">
                  {p.page_url || "/"} ({Number(p.clicks).toLocaleString()} clicks)
                </option>
              ))}
              {pages.length === 0 && <option value="/" className="bg-[#1a1a2e]">/</option>}
            </select>
          </div>

          <div className="flex bg-white/5 rounded-lg border border-white/10 overflow-hidden">
            {[{ id: "heatmap", label: "Heatmap", Icon: Flame }, { id: "clusters", label: "Clusters", Icon: Layers }].map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setView(id as "heatmap" | "clusters")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${view === id ? "bg-blue-600 text-white" : "text-white/50 hover:text-white"}`}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm text-white/40">
            <BarChart2 size={13} />
            <span>{points.length.toLocaleString()} interactions</span>
          </div>
        </div>

        <div className="bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
          <div className="relative" style={{ paddingBottom: "62.5%" }}>
            <div className="absolute inset-0 bg-gradient-to-b from-[#0d1117] to-[#161b22]">
              <div className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
                  backgroundSize: "80px 60px",
                }}
              />
            </div>

            {loading || rendering ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <img src={spinnerImg} alt="Loading" className="spinner-img-rotate" style={{ width: 40, height: 40 }} />
                <span className="text-white/30 text-sm">{loading ? "Loading data…" : "Rendering heatmap…"}</span>
              </div>
            ) : points.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30 gap-2">
                <Flame size={48} className="opacity-20" />
                <p className="font-medium">No click data for this page yet</p>
                <p className="text-sm">Install the tracking script to start collecting data</p>
              </div>
            ) : (
              <>
                <canvas
                  ref={canvasRef}
                  width={1280}
                  height={800}
                  className="absolute inset-0 w-full h-full"
                />
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-white/60 border border-white/10">
                  {points.length.toLocaleString()} clicks rendered
                </div>
              </>
            )}
          </div>
        </div>

        {pages.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold mb-3 text-white/70">Most Clicked Pages</h2>
            <div className="space-y-2">
              {pages.map((p, i) => {
                const pct = Math.round((Number(p.clicks) / maxClicks) * 100);
                const isSelected = selectedPage === p.page_url;
                return (
                  <div
                    key={p.page_url}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all group ${
                      isSelected
                        ? "bg-orange-500/10 border border-orange-500/30"
                        : "bg-white/5 hover:bg-white/8 border border-transparent hover:border-white/10"
                    }`}
                    onClick={() => setSelectedPage(p.page_url)}
                  >
                    <span className="text-white/20 w-5 text-xs text-right font-mono">{i + 1}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Flame size={12} className={`${isSelected ? "text-orange-400" : "text-white/20 group-hover:text-white/40"} transition-colors`} />
                    </div>
                    <span className="font-mono text-sm flex-1 truncate text-white/70">{p.page_url || "/"}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-28 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background: `hsl(${30 - (pct / 100) * 30}, 90%, 55%)`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-white/50 w-20 text-right tabular-nums">
                        {Number(p.clicks).toLocaleString()} clicks
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AnalyticsLayout>
  );
}
