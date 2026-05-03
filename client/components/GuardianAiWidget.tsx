import { useState, useEffect, useRef, useCallback, useId } from "react";

const AI_AVATAR = "/images/ai-avatar.gif";

const API_BASE = (() => {
  const env = (import.meta as { env?: Record<string, string> }).env;
  return env?.VITE_API_URL?.replace(/\/$/, "") ?? "";
})();

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

function getGuestEmail(): string {
  const session =
    sessionStorage.getItem("signupEmail") ||
    sessionStorage.getItem("guardianEmail") ||
    localStorage.getItem("guardianEmail");
  if (session) return session;

  let guest = localStorage.getItem("gt-ai-guest-id");
  if (!guest) {
    guest = `guest-${Math.random().toString(36).slice(2, 10)}@guardian.widget`;
    localStorage.setItem("gt-ai-guest-id", guest);
  }
  return guest;
}

/* ─── Inline markdown renderer ─────────────────────────────────── */
function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4)
      return <strong key={i} style={{ color: "#fff", fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2)
      return <em key={i} style={{ color: "rgba(255,255,255,0.82)", fontStyle: "italic" }}>{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2)
      return <code key={i} className="gt-ai-code">{part.slice(1, -1)}</code>;
    return part;
  });
}

function renderMd(text: string): React.ReactNode {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trimEnd();
    if (/^[━─=\-]{3,}$/.test(line)) {
      nodes.push(<div key={i} className="gt-ai-hr" />);
      i++; continue;
    }
    if (line.startsWith("### ")) {
      nodes.push(<p key={i} className="gt-ai-h3">{renderInline(line.slice(4))}</p>);
      i++; continue;
    }
    if (line.startsWith("## ")) {
      nodes.push(<p key={i} className="gt-ai-h2">{renderInline(line.slice(3))}</p>);
      i++; continue;
    }
    if (line.startsWith("# ")) {
      nodes.push(<p key={i} className="gt-ai-h1">{renderInline(line.slice(2))}</p>);
      i++; continue;
    }
    const listMatch = line.match(/^(\s*)([-•*]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      const indented = listMatch[1].length > 0;
      nodes.push(
        <p key={i} className={`gt-ai-li${indented ? " gt-ai-li-in" : ""}`}>
          <span className="gt-ai-li-dot">·</span>
          <span>{renderInline(listMatch[3])}</span>
        </p>
      );
      i++; continue;
    }
    if (line.trim() === "") {
      if (nodes.length > 0) nodes.push(<div key={`g${i}`} className="gt-ai-gap" />);
      i++; continue;
    }
    nodes.push(<p key={i} className="gt-ai-p">{renderInline(line)}</p>);
    i++;
  }
  return <>{nodes}</>;
}

/* ─── Voice-wave bars displayed while AI is typing ────────────── */
function VoiceWave() {
  return (
    <span className="gt-ai-wave" aria-label="Typing" role="status">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className="gt-ai-wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />
      ))}
    </span>
  );
}

/* ─── Single message bubble ────────────────────────────────────── */
function ChatBubble({ msg, glow }: { msg: Message; glow: boolean }) {
  const isAi = msg.role === "assistant";
  return (
    <div className={`gt-ai-msg ${isAi ? "ai" : "user"}`}>
      {isAi && (
        <img
          src={AI_AVATAR}
          alt="Guardian AI"
          className={`gt-ai-avatar-sm${glow ? " glow" : ""}`}
          draggable={false}
        />
      )}
      <div className="gt-ai-bubble">
        {msg.streaming && msg.content === "" ? (
          <VoiceWave />
        ) : (
          <div className="gt-ai-md">{renderMd(msg.content)}</div>
        )}
        {msg.streaming && msg.content !== "" && (
          <span className="gt-ai-cursor" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

/* ─── Main widget ──────────────────────────────────────────────── */
export default function GuardianAiWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [launchGlow, setLaunchGlow] = useState(false);
  const [lastAiId, setLastAiId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const instanceId = useId();

  /* auto-scroll to bottom */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* focus input when chat opens */
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || busy) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };

    const aiId = `a-${Date.now() + 1}`;
    const aiPlaceholder: Message = {
      id: aiId,
      role: "assistant",
      content: "",
      streaming: true,
    };

    setInput("");
    setBusy(true);
    setMessages((prev) => [...prev, userMsg, aiPlaceholder]);

    const email = getGuestEmail();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, email }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) throw new Error("AI service unavailable");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let buf = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(line.slice(6)) as { content?: string; done?: boolean; error?: string };
            if (json.error) throw new Error(json.error);
            if (json.content) {
              accumulated += json.content;
              const snap = accumulated;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiId ? { ...m, content: snap, streaming: true } : m
                )
              );
            }
            if (json.done) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiId ? { ...m, streaming: false } : m
                )
              );
              setLastAiId(aiId);
              /* launcher glow pulse when chat is minimised */
              if (!open) {
                setLaunchGlow(true);
                setTimeout(() => setLaunchGlow(false), 1800);
              }
            }
          } catch {
            /* ignore parse errors on partial lines */
          }
        }
      }
    } catch (err: unknown) {
      if ((err as { name?: string }).name === "AbortError") return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiId
            ? { ...m, content: "Sorry, I couldn't connect right now. Please try again.", streaming: false }
            : m
        )
      );
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }, [input, busy, open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleOpen = () => {
    setOpen((o) => !o);
    setLaunchGlow(false);
  };

  const styleId = `gt-ai-styles-${instanceId.replace(/:/g, "")}`;

  return (
    <>
      {/* ── Injected CSS ─────────────────────────────────────────── */}
      <style id={styleId}>{`
        /* ── Launcher button ──────────────────────────────── */
        .gt-ai-launcher {
          position: fixed;
          bottom: 24px;
          right: 20px;
          z-index: 9990;
          width: 62px;
          height: 62px;
          border-radius: 50%;
          border: none;
          padding: 0;
          cursor: pointer;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          will-change: transform;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          animation: gtAiFloat 4s ease-in-out infinite;
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
          outline: none;
          -webkit-tap-highlight-color: transparent;
        }
        .gt-ai-launcher:hover {
          animation: none;
          transform: scale(1.1) translateY(-3px);
        }
        .gt-ai-launcher:active {
          transform: scale(0.93);
          animation: none;
        }
        .gt-ai-launcher.open {
          animation: none;
          transform: scale(0.92) rotate(10deg);
        }
        .gt-ai-launcher.launcher-glow .gt-ai-launcher-ring {
          animation: gtAiLauncherGlow 1.6s ease-out forwards;
        }

        /* Ring behind the avatar for glow effects */
        .gt-ai-launcher-ring {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          pointer-events: none;
          will-change: box-shadow, opacity;
        }

        /* The avatar GIF */
        .gt-ai-launcher-img {
          width: 62px;
          height: 62px;
          border-radius: 50%;
          object-fit: cover;
          display: block;
          user-select: none;
          pointer-events: none;
          filter: drop-shadow(0 4px 12px rgba(79,126,247,0.45));
          transition: filter 0.3s ease;
          will-change: filter;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .gt-ai-launcher:hover .gt-ai-launcher-img {
          filter: drop-shadow(0 6px 20px rgba(79,126,247,0.7)) brightness(1.08);
        }

        /* Unread dot on launcher when minimised */
        .gt-ai-unread-dot {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #EF4444;
          border: 2px solid #fff;
          animation: gtAiDotPulse 2s ease-in-out infinite;
          will-change: box-shadow;
        }

        /* ── Chat panel ───────────────────────────────────── */
        .gt-ai-panel {
          position: fixed;
          bottom: 100px;
          right: 20px;
          z-index: 9991;
          width: 360px;
          max-width: calc(100vw - 32px);
          max-height: min(560px, calc(100vh - 130px));
          display: flex;
          flex-direction: column;
          border-radius: 18px;
          overflow: hidden;
          background: #0D1829;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 24px 80px rgba(0,0,0,0.55), 0 4px 20px rgba(0,0,0,0.35);
          will-change: transform, opacity;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          transform-origin: bottom right;
          animation: gtAiPanelIn 0.32s cubic-bezier(0.22,1,0.36,1) forwards;
          contain: layout style;
        }
        .gt-ai-panel.closing {
          animation: gtAiPanelOut 0.22s cubic-bezier(0.4,0,1,1) forwards;
        }

        /* Header */
        .gt-ai-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          background: linear-gradient(135deg, #0d1829, #141f38);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          flex-shrink: 0;
        }
        .gt-ai-header-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          display: block;
          flex-shrink: 0;
          will-change: filter;
          animation: gtAiAvatarIdle 3s ease-in-out infinite;
        }
        .gt-ai-header-info { flex: 1; min-width: 0; }
        .gt-ai-header-name {
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.01em;
          font-family: Inter, system-ui, sans-serif;
        }
        .gt-ai-header-status {
          font-size: 11px;
          color: #34D399;
          display: flex;
          align-items: center;
          gap: 4px;
          font-family: Inter, system-ui, sans-serif;
        }
        .gt-ai-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #34D399;
          flex-shrink: 0;
          animation: gtAiStatusPulse 2s ease-in-out infinite;
          will-change: opacity;
        }
        .gt-ai-close-btn {
          background: rgba(255,255,255,0.08);
          border: none;
          color: rgba(255,255,255,0.55);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          transition: background 0.15s, color 0.15s;
          flex-shrink: 0;
          -webkit-tap-highlight-color: transparent;
        }
        .gt-ai-close-btn:hover { background: rgba(255,255,255,0.15); color: #fff; }

        /* Messages area */
        .gt-ai-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
          overscroll-behavior: contain;
        }
        .gt-ai-messages::-webkit-scrollbar { width: 4px; }
        .gt-ai-messages::-webkit-scrollbar-track { background: transparent; }
        .gt-ai-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 99px; }

        /* Welcome state */
        .gt-ai-welcome {
          text-align: center;
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .gt-ai-welcome-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          object-fit: cover;
          animation: gtAiFloat 4s ease-in-out infinite;
          will-change: transform;
          filter: drop-shadow(0 4px 16px rgba(79,126,247,0.5));
        }
        .gt-ai-welcome-title {
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          font-family: Inter, system-ui, sans-serif;
          letter-spacing: -0.02em;
        }
        .gt-ai-welcome-sub {
          font-size: 12.5px;
          color: rgba(255,255,255,0.5);
          font-family: Inter, system-ui, sans-serif;
          line-height: 1.5;
          max-width: 240px;
        }
        .gt-ai-welcome-chips {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 6px;
          margin-top: 4px;
        }
        .gt-ai-chip {
          padding: 5px 12px;
          border-radius: 999px;
          background: rgba(79,126,247,0.12);
          border: 1px solid rgba(79,126,247,0.25);
          color: rgba(255,255,255,0.75);
          font-size: 11.5px;
          font-family: Inter, system-ui, sans-serif;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          white-space: nowrap;
          -webkit-tap-highlight-color: transparent;
        }
        .gt-ai-chip:hover { background: rgba(79,126,247,0.22); color: #fff; }

        /* Message row */
        .gt-ai-msg {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          animation: gtAiMsgIn 0.2s cubic-bezier(0.22,1,0.36,1) both;
          will-change: transform, opacity;
        }
        .gt-ai-msg.user { flex-direction: row-reverse; }

        /* Small avatar in messages */
        .gt-ai-avatar-sm {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
          will-change: filter;
          transition: filter 0.3s ease;
          align-self: flex-end;
        }
        .gt-ai-avatar-sm.glow {
          animation: gtAiAvatarGlow 1.2s ease-out forwards;
        }

        /* Bubble */
        .gt-ai-bubble {
          max-width: 78%;
          padding: 9px 13px;
          border-radius: 14px;
          font-size: 13px;
          line-height: 1.5;
          font-family: Inter, system-ui, sans-serif;
          word-break: break-word;
        }
        .gt-ai-msg.ai .gt-ai-bubble {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.92);
          border-bottom-left-radius: 4px;
        }
        .gt-ai-msg.user .gt-ai-bubble {
          background: linear-gradient(135deg, #4F7EF7, #7C5AF8);
          color: #fff;
          border-bottom-right-radius: 4px;
        }

        /* ── Markdown rendering ────────────────────────────── */
        .gt-ai-md {
          display: flex;
          flex-direction: column;
          gap: 2px;
          width: 100%;
        }
        .gt-ai-md p { margin: 0; }
        .gt-ai-md .gt-ai-p {
          font-size: 13px;
          line-height: 1.55;
          color: rgba(255,255,255,0.92);
        }
        .gt-ai-msg.user .gt-ai-md .gt-ai-p { color: rgba(255,255,255,0.95); }
        .gt-ai-md .gt-ai-h1 {
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.02em;
          margin-top: 2px;
        }
        .gt-ai-md .gt-ai-h2 {
          font-size: 13.5px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.01em;
          margin-top: 2px;
        }
        .gt-ai-md .gt-ai-h3 {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
        }
        .gt-ai-md .gt-ai-li {
          display: flex;
          align-items: flex-start;
          gap: 5px;
          font-size: 13px;
          line-height: 1.5;
          color: rgba(255,255,255,0.88);
        }
        .gt-ai-md .gt-ai-li-dot {
          color: #4F7EF7;
          font-size: 16px;
          line-height: 1.35;
          flex-shrink: 0;
          font-weight: 700;
        }
        .gt-ai-md .gt-ai-li-in { padding-left: 10px; }
        .gt-ai-md .gt-ai-hr {
          border: none;
          border-top: 1px solid rgba(255,255,255,0.1);
          width: 100%;
          margin: 1px 0;
        }
        .gt-ai-md .gt-ai-gap { height: 5px; }
        .gt-ai-code {
          background: rgba(255,255,255,0.1);
          padding: 1px 5px;
          border-radius: 4px;
          font-family: 'Fira Code', 'JetBrains Mono', monospace;
          font-size: 11.5px;
          color: #93C5FD;
        }

        /* Streaming cursor */
        .gt-ai-cursor {
          display: inline-block;
          width: 2px;
          height: 13px;
          background: rgba(255,255,255,0.7);
          border-radius: 1px;
          margin-left: 2px;
          vertical-align: text-bottom;
          animation: gtAiCursorBlink 0.8s step-end infinite;
          will-change: opacity;
        }

        /* ── Voice-wave bars ──────────────────────────────── */
        .gt-ai-wave {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          height: 18px;
          padding: 0 2px;
        }
        .gt-ai-wave-bar {
          display: inline-block;
          width: 3px;
          height: 100%;
          background: rgba(255,255,255,0.6);
          border-radius: 2px;
          transform-origin: center bottom;
          will-change: transform;
          animation: gtAiWaveBar 0.9s ease-in-out infinite;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        /* ── Input bar ────────────────────────────────────── */
        .gt-ai-input-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-top: 1px solid rgba(255,255,255,0.07);
          background: #0a1020;
          flex-shrink: 0;
        }
        .gt-ai-input {
          flex: 1;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 13px;
          font-family: Inter, system-ui, sans-serif;
          color: #fff;
          outline: none;
          min-width: 0;
          transition: border-color 0.15s, box-shadow 0.15s;
          caret-color: #4F7EF7;
        }
        .gt-ai-input::placeholder { color: rgba(255,255,255,0.3); }
        .gt-ai-input:focus {
          border-color: rgba(79,126,247,0.5);
          box-shadow: 0 0 0 3px rgba(79,126,247,0.15);
        }
        .gt-ai-send-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #4F7EF7, #7C5AF8);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.15s, opacity 0.15s, box-shadow 0.15s;
          -webkit-tap-highlight-color: transparent;
          will-change: transform;
        }
        .gt-ai-send-btn:hover:not(:disabled) {
          transform: scale(1.08);
          box-shadow: 0 4px 14px rgba(79,126,247,0.45);
        }
        .gt-ai-send-btn:active:not(:disabled) { transform: scale(0.92); }
        .gt-ai-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .gt-ai-send-icon {
          width: 16px;
          height: 16px;
          fill: none;
          stroke: #fff;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        /* ── Keyframes ────────────────────────────────────── */
        @keyframes gtAiFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-7px); }
        }
        @keyframes gtAiLauncherGlow {
          0%   { box-shadow: 0 0 0 0 rgba(79,126,247,0.7); opacity: 1; }
          70%  { box-shadow: 0 0 0 18px rgba(79,126,247,0); opacity: 1; }
          100% { box-shadow: 0 0 0 0 rgba(79,126,247,0); opacity: 0; }
        }
        @keyframes gtAiDotPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
          50%       { box-shadow: 0 0 0 5px rgba(239,68,68,0); }
        }
        @keyframes gtAiAvatarIdle {
          0%, 100% { filter: drop-shadow(0 2px 8px rgba(79,126,247,0.3)); }
          50%       { filter: drop-shadow(0 4px 16px rgba(79,126,247,0.6)) brightness(1.05); }
        }
        @keyframes gtAiStatusPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
        @keyframes gtAiAvatarGlow {
          0%   { filter: drop-shadow(0 0 0px rgba(79,126,247,0)) brightness(1); }
          30%  { filter: drop-shadow(0 0 14px rgba(79,126,247,0.9)) brightness(1.25); }
          100% { filter: drop-shadow(0 2px 6px rgba(79,126,247,0.3)) brightness(1); }
        }
        @keyframes gtAiWaveBar {
          0%, 100% { transform: scaleY(0.25); opacity: 0.5; }
          50%       { transform: scaleY(1);    opacity: 1;   }
        }
        @keyframes gtAiCursorBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes gtAiMsgIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes gtAiPanelIn {
          from { opacity: 0; transform: translateY(16px) scale(0.94); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes gtAiPanelOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(12px) scale(0.95); }
        }

        /* ── Mobile safe areas ────────────────────────────── */
        @media (max-width: 479px) {
          .gt-ai-launcher {
            bottom: calc(16px + env(safe-area-inset-bottom, 0px));
            right: 16px;
            width: 56px;
            height: 56px;
          }
          .gt-ai-launcher-img {
            width: 56px;
            height: 56px;
          }
          .gt-ai-panel {
            bottom: calc(88px + env(safe-area-inset-bottom, 0px));
            right: 12px;
            left: 12px;
            width: auto;
            max-width: 100%;
          }
        }

        /* Respect reduced-motion preference */
        @media (prefers-reduced-motion: reduce) {
          .gt-ai-launcher,
          .gt-ai-wave-bar,
          .gt-ai-cursor,
          .gt-ai-header-avatar,
          .gt-ai-welcome-avatar,
          .gt-ai-avatar-sm.glow {
            animation: none !important;
          }
        }
      `}</style>

      {/* ── Floating launcher ─────────────────────────────────────── */}
      <button
        className={`gt-ai-launcher${open ? " open" : ""}${launchGlow ? " launcher-glow" : ""}`}
        onClick={toggleOpen}
        aria-label={open ? "Close Guardian AI" : "Open Guardian AI assistant"}
        aria-expanded={open}
      >
        <span className="gt-ai-launcher-ring" aria-hidden="true" />
        <img
          src={AI_AVATAR}
          alt=""
          className="gt-ai-launcher-img"
          draggable={false}
        />
        {!open && messages.some((m) => m.role === "assistant" && !m.streaming) && launchGlow && (
          <span className="gt-ai-unread-dot" aria-hidden="true" />
        )}
      </button>

      {/* ── Chat panel ────────────────────────────────────────────── */}
      {open && (
        <div className="gt-ai-panel" role="dialog" aria-label="Guardian AI assistant">
          {/* Header */}
          <div className="gt-ai-header">
            <img src={AI_AVATAR} alt="" className="gt-ai-header-avatar" draggable={false} />
            <div className="gt-ai-header-info">
              <div className="gt-ai-header-name">Guardian AI</div>
              <div className="gt-ai-header-status">
                <span className="gt-ai-status-dot" aria-hidden="true" />
                Active — Trading Intelligence
              </div>
            </div>
            <button className="gt-ai-close-btn" onClick={() => setOpen(false)} aria-label="Close chat">
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="gt-ai-messages" role="log" aria-live="polite" aria-label="Chat messages">
            {messages.length === 0 ? (
              <div className="gt-ai-welcome">
                <img src={AI_AVATAR} alt="Guardian AI" className="gt-ai-welcome-avatar" draggable={false} />
                <div className="gt-ai-welcome-title">Guardian AI</div>
                <div className="gt-ai-welcome-sub">
                  Your intelligent trading assistant. Ask me anything about markets, orders, or your account.
                </div>
                <div className="gt-ai-welcome-chips">
                  {["What's the market outlook?", "How do I place an order?", "Explain DMA trading"].map((q) => (
                    <button
                      key={q}
                      className="gt-ai-chip"
                      onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  msg={msg}
                  glow={msg.id === lastAiId && !msg.streaming}
                />
              ))
            )}
            <div ref={messagesEndRef} style={{ height: 1 }} />
          </div>

          {/* Input bar */}
          <div className="gt-ai-input-bar">
            <input
              ref={inputRef}
              className="gt-ai-input"
              type="text"
              placeholder="Ask about trading, markets…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={busy}
              aria-label="Message input"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
            <button
              className="gt-ai-send-btn"
              onClick={sendMessage}
              disabled={busy || !input.trim()}
              aria-label="Send message"
            >
              <svg className="gt-ai-send-icon" viewBox="0 0 24 24" aria-hidden="true">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
