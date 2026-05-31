import { useEffect, useRef, useState, useCallback } from "react";
import { useVoiceAgent, type VoiceStatus, type VoiceMessage } from "@/hooks/useVoiceAgent";

const AI_AVATAR = "/images/ai-avatar.gif";

function StatusBadge({ status }: { status: VoiceStatus }) {
  const cfg = {
    idle:       { dot: "#6b7280", label: "Ready" },
    connecting: { dot: "#f59e0b", label: "Connecting…" },
    active:     { dot: "#22c55e", label: "Listening" },
    error:      { dot: "#ef4444", label: "Error" },
  }[status];

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%", background: cfg.dot,
        boxShadow: status === "active" ? `0 0 8px ${cfg.dot}` : "none",
        animation: status === "active" ? "va-pulse 2s ease-in-out infinite" : "none",
      }} />
      {cfg.label}
    </span>
  );
}

function MicOrb({ micLevel, isSpeaking, status, onClick }: {
  micLevel: number;
  isSpeaking: boolean;
  status: VoiceStatus;
  onClick: () => void;
}) {
  const active = status === "active" || status === "connecting";
  const scale = active ? 1 + micLevel * 0.35 : 1;
  const ringScale = active ? 1 + micLevel * 0.6 : 1;

  return (
    <button
      onClick={onClick}
      aria-label={active ? "Tap to stop voice session" : "Tap to start voice session"}
      style={{
        position: "relative",
        width: 80, height: 80,
        borderRadius: "50%",
        border: "none",
        cursor: "pointer",
        background: "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        outline: "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <span style={{
        position: "absolute", inset: -8, borderRadius: "50%",
        background: active
          ? `radial-gradient(circle, rgba(79,126,247,0.18) 0%, transparent 70%)`
          : "transparent",
        transform: `scale(${ringScale})`,
        transition: "transform 80ms ease-out, background 0.3s",
        pointerEvents: "none",
      }} />
      <span style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        border: active
          ? "2px solid rgba(79,126,247,0.6)"
          : "2px solid rgba(255,255,255,0.15)",
        transform: `scale(${ringScale * 1.15})`,
        transition: "transform 80ms ease-out, border-color 0.3s",
        pointerEvents: "none",
      }} />
      <span style={{
        width: 64, height: 64, borderRadius: "50%",
        background: active
          ? (status === "connecting"
            ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
            : "linear-gradient(135deg, #4f7ef7 0%, #7c3aed 100%)")
          : "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transform: `scale(${scale})`,
        transition: "transform 80ms ease-out, background 0.3s",
        boxShadow: active
          ? "0 0 24px rgba(79,126,247,0.5), 0 4px 16px rgba(0,0,0,0.4)"
          : "0 4px 16px rgba(0,0,0,0.4)",
        flexShrink: 0,
      }}>
        {active ? (
          <WaveIcon isSpeaking={isSpeaking} />
        ) : (
          <MicIcon />
        )}
      </span>
    </button>
  );
}

function WaveIcon({ isSpeaking }: { isSpeaking: boolean }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 3, height: 20 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} style={{
          width: 3, borderRadius: 2,
          background: "rgba(255,255,255,0.9)",
          height: isSpeaking ? `${8 + Math.sin(i * 1.2) * 8}px` : "6px",
          animation: isSpeaking ? `va-bar 0.6s ease-in-out infinite` : "none",
          animationDelay: `${i * 0.1}s`,
          transition: "height 0.15s",
        }} />
      ))}
    </span>
  );
}

function MicIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="9" y1="22" x2="15" y2="22" />
    </svg>
  );
}

function MessageRow({ msg }: { msg: VoiceMessage }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex", gap: 12, alignItems: "flex-start",
      flexDirection: isUser ? "row-reverse" : "row",
      opacity: msg.interrupted ? 0.45 : 1,
      transition: "opacity 0.3s",
    }}>
      {!isUser && (
        <img src={AI_AVATAR} alt="Guardian AI"
          style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, marginTop: 2 }}
        />
      )}
      <div style={{
        maxWidth: "78%",
        padding: "9px 14px",
        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        background: isUser
          ? "linear-gradient(135deg, #4f7ef7 0%, #7c3aed 100%)"
          : "rgba(255,255,255,0.07)",
        border: isUser ? "none" : "1px solid rgba(255,255,255,0.1)",
        fontSize: 13.5, lineHeight: 1.55,
        color: isUser ? "#fff" : "rgba(255,255,255,0.88)",
      }}>
        {msg.text || (
          <span style={{ display: "flex", gap: 4, alignItems: "center", height: 16 }}>
            {[0,1,2].map((i) => (
              <span key={i} style={{
                width: 5, height: 5, borderRadius: "50%",
                background: "rgba(255,255,255,0.5)",
                animation: "va-dot 1.2s ease-in-out infinite",
                animationDelay: `${i * 0.2}s`,
              }} />
            ))}
          </span>
        )}
        {msg.interrupted && (
          <span style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
            — interrupted
          </span>
        )}
      </div>
    </div>
  );
}

function TextInput({ onSend, disabled }: { onSend: (t: string) => void; disabled: boolean }) {
  const [val, setVal] = useState("");
  const submit = () => {
    if (!val.trim() || disabled) return;
    onSend(val.trim());
    setVal("");
  };
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
        placeholder="Type a message…"
        disabled={disabled}
        style={{
          flex: 1, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 20, padding: "9px 16px", color: "rgba(255,255,255,0.9)", fontSize: 13,
          outline: "none",
        }}
      />
      <button
        onClick={submit}
        disabled={disabled || !val.trim()}
        style={{
          width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer",
          background: (disabled || !val.trim()) ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg,#4f7ef7,#7c3aed)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  );
}

interface VoiceAgentModalProps {
  onClose: () => void;
}

export default function VoiceAgentModal({ onClose }: VoiceAgentModalProps) {
  const { status, messages, error, micLevel, isSpeaking, connect, disconnect, sendText } = useVoiceAgent();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleToggle = useCallback(async () => {
    if (status === "idle" || status === "error") {
      await connect();
    } else {
      disconnect();
    }
  }, [status, connect, disconnect]);

  const handleClose = useCallback(() => {
    setClosing(true);
    disconnect();
    setTimeout(onClose, 220);
  }, [disconnect, onClose]);

  const isActive = status === "active" || status === "connecting";

  return (
    <>
      <style>{`
        @keyframes va-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes va-bar { 0%,100%{height:6px} 50%{height:18px} }
        @keyframes va-dot { 0%,80%,100%{opacity:0.3;transform:scale(0.8)} 40%{opacity:1;transform:scale(1)} }
        @keyframes va-enter { from{opacity:0;transform:scale(0.96) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes va-exit  { from{opacity:1;transform:scale(1) translateY(0)} to{opacity:0;transform:scale(0.96) translateY(12px)} }
        .va-panel { animation: va-enter 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .va-panel.closing { animation: va-exit 0.2s ease-in forwards; }
      `}</style>

      <div
        style={{
          position: "fixed", inset: 0, zIndex: 10000,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          padding: "0 0 80px",
        }}
        onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      >
        <div
          className={`va-panel${closing ? " closing" : ""}`}
          style={{
            width: "100%", maxWidth: 440,
            background: "#0d1829",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 24,
            boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(79,126,247,0.1)",
            display: "flex", flexDirection: "column",
            overflow: "hidden",
            maxHeight: "calc(100vh - 110px)",
          }}
        >
          {/* Header */}
          <div style={{
            padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src={AI_AVATAR} alt="" style={{ width: 28, height: 28, borderRadius: "50%" }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Guardian Voice AI</div>
                <StatusBadge status={status} />
              </div>
            </div>
            <button
              onClick={handleClose}
              style={{
                width: 30, height: 30, borderRadius: "50%", border: "none",
                background: "rgba(255,255,255,0.08)", cursor: "pointer", color: "rgba(255,255,255,0.6)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Transcript */}
          <div
            ref={scrollRef}
            style={{
              flex: 1, overflowY: "auto", padding: "16px 18px",
              display: "flex", flexDirection: "column", gap: 12,
              minHeight: 180,
              scrollbarWidth: "none",
            }}
          >
            {messages.length === 0 && (
              <div style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 8,
                color: "rgba(255,255,255,0.35)", fontSize: 13, textAlign: "center",
                padding: "24px 0",
              }}>
                {status === "idle" && !error && (
                  <>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="2" width="6" height="11" rx="3" />
                      <path d="M5 10a7 7 0 0 0 14 0" />
                      <line x1="12" y1="19" x2="12" y2="22" />
                    </svg>
                    <span>Tap the mic to start a voice conversation</span>
                  </>
                )}
                {status === "connecting" && (
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>Connecting to Guardian Voice AI…</span>
                )}
                {status === "active" && (
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>Listening — speak now</span>
                )}
              </div>
            )}
            {messages.map((msg) => (
              <MessageRow key={msg.id} msg={msg} />
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              margin: "0 18px 10px",
              padding: "10px 14px",
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 10, fontSize: 12.5,
              color: "rgba(255,180,180,0.9)",
              flexShrink: 0,
            }}>
              {error}
            </div>
          )}

          {/* Controls */}
          <div style={{
            padding: "14px 18px 18px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            display: "flex", flexDirection: "column", gap: 14, alignItems: "center",
            flexShrink: 0,
          }}>
            <MicOrb
              micLevel={micLevel}
              isSpeaking={isSpeaking}
              status={status}
              onClick={handleToggle}
            />

            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
              {status === "idle" && !error && "Tap to start"}
              {status === "connecting" && "Initialising…"}
              {status === "active" && !isSpeaking && "Tap to end session"}
              {status === "active" && isSpeaking && "Speaking — tap to stop"}
              {status === "error" && "Tap to retry"}
            </div>

            {isActive && (
              <div style={{ width: "100%" }}>
                <TextInput onSend={sendText} disabled={status !== "active"} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
