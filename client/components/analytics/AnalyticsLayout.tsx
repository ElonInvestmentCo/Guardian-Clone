import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Megaphone,
  Flame,
  PlayCircle,
  Lightbulb,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API = "/api";
const OWNER_EMAIL = "demo@guardiiantrading.com";

const NAV = [
  { href: "/analytics", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/analytics/projects", label: "Projects", icon: FolderKanban },
  { href: "/analytics/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/analytics/heatmaps", label: "Heatmaps", icon: Flame },
  { href: "/analytics/sessions", label: "Sessions", icon: PlayCircle },
  { href: "/analytics/insights", label: "AI Insights", icon: Lightbulb },
];

interface Project { id: string; name: string; domain: string; public_key: string; }

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const basePath = location.split("?")[0]!;

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string>(() => localStorage.getItem("gt_project_id") ?? "");
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    void fetch(`${API}/analytics/projects?email=${encodeURIComponent(OWNER_EMAIL)}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        const ps = d as Project[];
        setProjects(ps);
        const currentParams = new URLSearchParams(window.location.search);
        const urlProjectId = currentParams.get("project_id");
        if (urlProjectId) {
          setSelectedId(urlProjectId);
          localStorage.setItem("gt_project_id", urlProjectId);
        } else if (ps.length > 0) {
          const firstId = selectedId || ps[0]!.id;
          setSelectedId(firstId);
          localStorage.setItem("gt_project_id", firstId);
          navigate(`${basePath}?project_id=${firstId}`);
        }
      })
      .catch(() => {
        // API unavailable — leave projects empty, no crash
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectProject(id: string) {
    setSelectedId(id);
    localStorage.setItem("gt_project_id", id);
    setShowPicker(false);
    navigate(`${basePath}?project_id=${id}`);
  }

  function navHref(href: string) {
    return selectedId ? `${href}?project_id=${selectedId}` : href;
  }

  const selected = projects.find(p => p.id === selectedId);

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-white">
      <aside className="w-56 border-r border-white/10 flex flex-col shrink-0">
        <div className="h-14 flex items-center px-4 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white transition-colors">
            <span className="text-blue-400 font-bold text-lg">G</span>
            <span>Analytics</span>
          </Link>
        </div>

        <div className="px-2 py-3 border-b border-white/10 relative">
          <button
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
            onClick={() => setShowPicker(!showPicker)}
          >
            <div className="min-w-0">
              <div className="text-xs text-white/40 leading-tight">Project</div>
              <div className="text-sm font-medium truncate">{selected?.name ?? "Select project…"}</div>
            </div>
            <ChevronDown size={14} className="text-white/40 shrink-0 ml-1" />
          </button>
          {showPicker && (
            <div className="absolute left-2 right-2 top-full mt-1 bg-[#1a1a2e] border border-white/20 rounded-xl shadow-xl z-50 overflow-hidden">
              {projects.length === 0 ? (
                <div className="p-3 text-xs text-white/40 text-center">No projects</div>
              ) : (
                projects.map((p) => (
                  <button
                    key={p.id}
                    className={cn(
                      "w-full text-left px-3 py-2.5 text-sm hover:bg-white/10 transition-colors",
                      p.id === selectedId && "bg-blue-600/20 text-blue-400"
                    )}
                    onClick={() => selectProject(p.id)}
                  >
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-white/40">{p.domain}</div>
                  </button>
                ))
              )}
              <div className="border-t border-white/10">
                <Link href="/analytics/projects">
                  <div className="px-3 py-2 text-xs text-blue-400 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setShowPicker(false)}>
                    + New Project
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? basePath === href : basePath.startsWith(href);
            return (
              <Link key={href} href={navHref(href)}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
                    active
                      ? "bg-blue-600/20 text-blue-400"
                      : "text-white/50 hover:text-white/80 hover:bg-white/5"
                  )}
                >
                  <Icon size={16} />
                  {label}
                  {active && <ChevronRight size={12} className="ml-auto" />}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          {selected && (
            <div className="text-xs text-white/30 font-mono truncate mb-1">{selected.public_key}</div>
          )}
          <div className="text-xs text-white/20">Guardian Analytics v1.0</div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
