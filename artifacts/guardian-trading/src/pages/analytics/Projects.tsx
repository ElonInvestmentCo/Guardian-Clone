import { useState, useEffect } from "react";
import AnalyticsLayout from "@/components/analytics/AnalyticsLayout";
import { Plus, Copy, Trash2, Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface Project {
  id: string;
  name: string;
  domain: string;
  created_at: string;
  public_key: string;
  total_sessions: number;
  total_events: number;
}

const API = "/api";
const OWNER_EMAIL = "demo@guardiantrading.com";

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", domain: "" });
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function loadProjects() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/analytics/projects?email=${encodeURIComponent(OWNER_EMAIL)}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json() as Project[];
      setProjects(data);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadProjects(); }, []);

  async function createProject() {
    if (!form.name || !form.domain) { toast({ title: "Fill in all fields", variant: "destructive" }); return; }
    setCreating(true);
    try {
      const r = await fetch(`${API}/analytics/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, domain: form.domain, ownerEmail: OWNER_EMAIL }),
      });
      if (r.ok) {
        setForm({ name: "", domain: "" });
        setShowForm(false);
        await loadProjects();
        toast({ title: "Project created!" });
      } else {
        toast({ title: "Failed to create project", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error. Please try again.", variant: "destructive" });
    }
    setCreating(false);
  }

  async function deleteProject(id: string) {
    if (!confirm("Delete this project and all its data?")) return;
    try {
      const r = await fetch(`${API}/analytics/projects/${id}`, { method: "DELETE" });
      if (!r.ok) { toast({ title: "Failed to delete project", variant: "destructive" }); return; }
      await loadProjects();
      toast({ title: "Project deleted" });
    } catch {
      toast({ title: "Network error. Please try again.", variant: "destructive" });
    }
  }

  function copySnippet(key: string) {
    const snippet = `<script async src="${window.location.origin}/api/tracking.js" data-key="${key}"></script>`;
    void navigator.clipboard.writeText(snippet);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <AnalyticsLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-white/50 text-sm mt-1">Manage your tracked websites</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Plus size={16} /> New Project
          </Button>
        </div>

        {showForm && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
            <h2 className="font-semibold mb-4">Create Project</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm text-white/60 mb-1 block">Project Name</label>
                <Input
                  className="bg-white/5 border-white/20 text-white"
                  placeholder="My Website"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Domain</label>
                <Input
                  className="bg-white/5 border-white/20 text-white"
                  placeholder="example.com"
                  value={form.domain}
                  onChange={(e) => setForm({ ...form, domain: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => void createProject()} disabled={creating} className="bg-blue-600 hover:bg-blue-700">
                {creating ? "Creating…" : "Create"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)} className="text-white/60">Cancel</Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-white/40 text-center py-16">Loading projects…</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 text-white/40">
            <Globe size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No projects yet</p>
            <p className="text-sm mt-1">Create your first project to start tracking</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((p) => (
              <div key={p.id} className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Globe size={16} className="text-blue-400" />
                      <span className="font-semibold">{p.name}</span>
                    </div>
                    <div className="text-white/40 text-sm mt-0.5">{p.domain}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-4">
                      <div className="text-sm font-medium">{Number(p.total_sessions).toLocaleString()} sessions</div>
                      <div className="text-xs text-white/40">{Number(p.total_events).toLocaleString()} events</div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => void deleteProject(p.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                <div className="mt-4 bg-black/30 rounded-lg p-3 font-mono text-xs text-white/60 relative">
                  {`<script async src="${window.location.origin}/api/tracking.js" data-key="${p.public_key}"></script>`}
                  <button
                    className="absolute right-3 top-3 text-white/40 hover:text-white transition-colors"
                    onClick={() => copySnippet(p.public_key)}
                  >
                    {copied === p.public_key ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="mt-2 text-xs text-white/30">API Key: {p.public_key}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AnalyticsLayout>
  );
}
