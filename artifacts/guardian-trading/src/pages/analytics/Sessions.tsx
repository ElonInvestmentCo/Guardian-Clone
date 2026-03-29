import { useState, useEffect, useCallback } from "react";
import AnalyticsLayout from "@/components/analytics/AnalyticsLayout";
import { PlayCircle, Clock, FileText, ArrowRight, Monitor, Smartphone } from "lucide-react";
import { useLocation, Link } from "wouter";

interface Session {
  session_id: string;
  visitor_id: string;
  start_time: string;
  duration_seconds: number;
  page_count: number;
  is_bounce: boolean;
  entry_page: string;
  exit_page: string;
  device_type: string;
  browser: string;
  utm_campaign: string | null;
  utm_source: string | null;
}

interface SessionEvent {
  event_type: string;
  event_name: string;
  page_url: string;
  element_x: number | null;
  element_y: number | null;
  scroll_depth: number | null;
  timestamp: string;
}

const API = "/api";
const PERIODS = [{ label: "7d", value: "7d" }, { label: "30d", value: "30d" }];

function formatDuration(secs: number) {
  if (!secs) return "< 1s";
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

function EventTimeline({ events }: { events: SessionEvent[] }) {
  const palette: Record<string, string> = {
    pageview: "bg-blue-500",
    click: "bg-orange-500",
    form_submit: "bg-green-500",
    page_exit: "bg-red-500",
    custom: "bg-purple-500",
    scroll: "bg-yellow-500",
  };
  const start = events[0] ? new Date(events[0].timestamp).getTime() : 0;
  const end = events[events.length - 1] ? new Date(events[events.length - 1]!.timestamp).getTime() : start + 1;
  const duration = end - start || 1;

  return (
    <div className="space-y-1 max-h-80 overflow-y-auto pr-2">
      {events.map((ev, i) => {
        const offset = ((new Date(ev.timestamp).getTime() - start) / duration) * 100;
        const color = palette[ev.event_type] ?? "bg-gray-500";
        return (
          <div key={i} className="flex items-center gap-3 text-xs">
            <div className="w-1 shrink-0 self-stretch flex flex-col items-center">
              <div className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
              {i < events.length - 1 && <div className="w-px flex-1 bg-white/10 mt-0.5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`px-1.5 py-0.5 rounded text-white font-medium uppercase text-[10px] ${color}`}>{ev.event_type}</span>
                <span className="text-white/40 truncate">{ev.page_url || ev.event_name}</span>
              </div>
            </div>
            <div className="text-white/30 shrink-0">{Math.round(offset)}%</div>
          </div>
        );
      })}
    </div>
  );
}

export default function Sessions() {
  const [location] = useLocation();
  void location;
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get("project_id") ?? localStorage.getItem("gt_project_id");

  const [sessions, setSessions] = useState<Session[]>([]);
  const [period, setPeriod] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [replay, setReplay] = useState<SessionEvent[]>([]);
  const [replayLoading, setReplayLoading] = useState(false);

  const load = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    setLoading(true);
    try {
      const r = await fetch(`${API}/analytics/sessions?project_id=${projectId}&period=${period}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json() as Session[];
      setSessions(data);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, period]);

  useEffect(() => { void load(); }, [load]);

  async function openReplay(sessionId: string) {
    setSelectedSession(sessionId);
    setReplayLoading(true);
    try {
      const r = await fetch(`${API}/analytics/session/${sessionId}?project_id=${projectId}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const events = await r.json() as SessionEvent[];
      setReplay(events);
    } catch {
      setReplay([]);
    } finally {
      setReplayLoading(false);
    }
  }

  if (!projectId) {
    return (
      <AnalyticsLayout>
        <div className="flex items-center justify-center py-32 text-white/40">
          <div className="text-center">
            <PlayCircle size={48} className="mx-auto mb-4 opacity-30" />
            <p>Select a project to view sessions</p>
            <Link href="/analytics/projects" className="text-blue-400 text-sm mt-2 block">Go to Projects →</Link>
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
            <h1 className="text-xl font-bold">Session Replay</h1>
            <p className="text-white/40 text-sm">Review individual user journeys</p>
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

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10 text-sm font-medium">
              Sessions ({sessions.length})
            </div>
            <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="text-center py-12 text-white/30">Loading…</div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-12 text-white/30">No sessions found</div>
              ) : (
                sessions.map((s) => (
                  <div
                    key={s.session_id}
                    className={`p-4 cursor-pointer transition-colors hover:bg-white/5 ${selectedSession === s.session_id ? "bg-blue-600/10 border-l-2 border-blue-500" : ""}`}
                    onClick={() => void openReplay(s.session_id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          {s.device_type === "mobile" ? <Smartphone size={12} className="text-white/40" /> : <Monitor size={12} className="text-white/40" />}
                          <span className="font-mono text-xs text-white/60">{s.visitor_id.slice(0, 12)}…</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-white/40 mt-0.5">
                          <span>{s.entry_page || "/"}</span>
                          {s.exit_page && s.exit_page !== s.entry_page && (
                            <>
                              <ArrowRight size={10} />
                              <span>{s.exit_page}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        onClick={(e) => { e.stopPropagation(); void openReplay(s.session_id); }}
                      >
                        <PlayCircle size={18} />
                      </button>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-white/40">
                      <span className="flex items-center gap-1"><Clock size={10} /> {formatDuration(s.duration_seconds)}</span>
                      <span className="flex items-center gap-1"><FileText size={10} /> {s.page_count} pages</span>
                      {s.is_bounce && <span className="text-orange-400">Bounce</span>}
                      {s.utm_campaign && <span className="text-blue-400">{s.utm_campaign}</span>}
                    </div>
                    <div className="text-xs text-white/20 mt-1">
                      {new Date(s.start_time).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10 text-sm font-medium flex items-center gap-2">
              <PlayCircle size={14} className="text-blue-400" />
              {selectedSession ? `Session: ${selectedSession.slice(0, 16)}…` : "Select a session to replay"}
            </div>
            <div className="p-4">
              {!selectedSession ? (
                <div className="text-center py-16 text-white/30">
                  <PlayCircle size={40} className="mx-auto mb-3 opacity-30" />
                  <p>Click a session to view its event timeline</p>
                </div>
              ) : replayLoading ? (
                <div className="text-center py-16 text-white/30">Loading events…</div>
              ) : replay.length === 0 ? (
                <div className="text-center py-16 text-white/30">No events recorded</div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4 text-xs text-white/40">
                    <span>{replay.length} events</span>
                    <span>
                      {formatDuration(Math.round(
                        (new Date(replay[replay.length - 1]!.timestamp).getTime() -
                          new Date(replay[0]!.timestamp).getTime()) / 1000
                      ))} duration
                    </span>
                  </div>
                  <EventTimeline events={replay} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AnalyticsLayout>
  );
}
