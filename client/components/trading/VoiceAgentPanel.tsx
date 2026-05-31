import { useRef, useEffect, useState, lazy, Suspense } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useVoiceAgent, type VoiceMessage } from "@/hooks/useVoiceAgent";
import { Mic, MicOff, Square, Wifi, WifiOff, MessageSquare } from "lucide-react";

const TRADING_INSTRUCTIONS = `You are Guardian AI, an expert trading assistant embedded in the Guardian Trading platform.
You help users with: real-time market analysis, trade signals interpretation, portfolio risk review, entry/exit strategies,
crypto and equity market outlook, margin management, and account questions.
Be concise, data-driven, and professional. Keep spoken responses under 3 sentences.
When asked about specific assets, provide price context, trend direction, and a clear recommendation.`;

function MicOrb({
  micLevel,
  isSpeaking,
  isActive,
  isConnecting,
  onClick,
  accentColor,
}: {
  micLevel: number;
  isSpeaking: boolean;
  isActive: boolean;
  isConnecting: boolean;
  onClick: () => void;
  accentColor: string;
}) {
  const scale = isActive ? 1 + micLevel * 0.28 : 1;
  const ringScale = isActive ? 1 + micLevel * 0.55 : 1;

  return (
    <button
      onClick={onClick}
      aria-label={isActive ? "Stop voice session" : "Start voice session"}
      style={{
        position: "relative",
        width: 56,
        height: 56,
        borderRadius: "50%",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        outline: "none",
        WebkitTapHighlightColor: "transparent",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: -6,
          borderRadius: "50%",
          border: `1.5px solid ${isActive ? accentColor : "rgba(255,255,255,0.1)"}`,
          opacity: isActive ? 0.45 : 0.3,
          transform: `scale(${ringScale})`,
          transition: "transform 80ms ease-out, opacity 0.3s, border-color 0.3s",
          pointerEvents: "none",
        }}
      />
      <span
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${scale})`,
          transition: "transform 80ms ease-out, background 0.25s, box-shadow 0.25s",
          background: isActive
            ? isConnecting
              ? "linear-gradient(135deg,#f59e0b,#d97706)"
              : "linear-gradient(135deg,#4f7ef7,#7c3aed)"
            : "rgba(255,255,255,0.07)",
          boxShadow: isActive
            ? `0 0 20px rgba(79,126,247,0.4), 0 4px 12px rgba(0,0,0,0.35)`
            : "0 2px 8px rgba(0,0,0,0.2)",
          border: isActive
            ? "none"
            : "1px solid rgba(255,255,255,0.12)",
        }}
      >
        {isActive ? (
          isConnecting ? (
            <span
              style={{
                width: 16,
                height: 16,
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "#fff",
                borderRadius: "50%",
                animation: "va-spin 0.7s linear infinite",
                display: "inline-block",
              }}
            />
          ) : (
            <Square size={14} fill="white" color="white" />
          )
        ) : (
          <Mic size={16} color="rgba(255,255,255,0.55)" />
        )}
      </span>
    </button>
  );
}

function WaveBars({ isSpeaking, micLevel }: { isSpeaking: boolean; micLevel: number }) {
  const heights = [5, 10, 14, 10, 5, 8, 13, 8, 5];
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 2, height: 18 }}>
      {heights.map((h, i) => (
        <span
          key={i}
          style={{
            width: 2.5,
            borderRadius: 2,
            background: isSpeaking ? "rgba(79,126,247,0.8)" : "rgba(255,255,255,0.18)",
            height: isSpeaking ? `${h}px` : "3px",
            animation: isSpeaking ? `va-bar 0.55s ease-in-out infinite` : "none",
            animationDelay: `${i * 0.065}s`,
            transition: "height 0.2s",
          }}
        />
      ))}
    </span>
  );
}

function TranscriptLine({ msg, accent }: { msg: VoiceMessage; accent: string }) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: isUser ? "row-reverse" : "row",
        gap: 8,
        alignItems: "flex-start",
        opacity: msg.interrupted ? 0.4 : 1,
        transition: "opacity 0.3s",
      }}
    >
      <div
        style={{
          maxWidth: "82%",
          padding: "7px 11px",
          borderRadius: isUser ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
          background: isUser
            ? `linear-gradient(135deg, ${accent}, #7c3aed)`
            : "rgba(255,255,255,0.06)",
          border: isUser ? "none" : "1px solid rgba(255,255,255,0.08)",
          fontSize: 12,
          lineHeight: 1.5,
          color: isUser ? "#fff" : "rgba(255,255,255,0.82)",
        }}
      >
        {msg.text || (
          <span style={{ display: "flex", gap: 3, alignItems: "center" }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.45)",
                  animation: "va-dot 1.2s ease-in-out infinite",
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </span>
        )}
        {msg.interrupted && (
          <span style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>
            — interrupted
          </span>
        )}
      </div>
    </div>
  );
}

export default function VoiceAgentPanel() {
  const { colors } = useTheme();
  const { status, messages, error, micLevel, isSpeaking, connect, disconnect, sendText } =
    useVoiceAgent({ voice: "Eve", instructions: TRADING_INSTRUCTIONS });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [textInput, setTextInput] = useState("");

  const isActive = status === "active" || status === "connecting";
  const isConnecting = status === "connecting";

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleToggle = async () => {
    if (isActive) {
      disconnect();
    } else {
      await connect();
    }
  };

  const handleSend = () => {
    if (!textInput.trim() || status !== "active") return;
    sendText(textInput.trim());
    setTextInput("");
  };

  return (
    <>
      <style>{`
        @keyframes va-spin { to { transform: rotate(360deg); } }
        @keyframes va-bar  { 0%,100%{height:3px} 50%{height:14px} }
        @keyframes va-dot  { 0%,80%,100%{opacity:0.3;transform:scale(0.8)} 40%{opacity:1;transform:scale(1)} }
        @keyframes va-pulse{ 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>

      <div
        className="rounded-xl"
        style={{
          background: colors.card,
          border: `1px solid ${colors.cardBorder}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 18px 12px",
            borderBottom: `1px solid ${colors.cardBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: isActive
                  ? "linear-gradient(135deg,rgba(79,126,247,0.2),rgba(124,58,237,0.2))"
                  : "rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${isActive ? "rgba(79,126,247,0.3)" : colors.cardBorder}`,
                transition: "all 0.3s",
              }}
            >
              <Mic size={13} color={isActive ? "#4f7ef7" : colors.textMuted} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary, lineHeight: 1.2 }}>
                Voice Trading AI
              </p>
              <p style={{ fontSize: 10.5, color: colors.textMuted, marginTop: 1 }}>
                Speak with Guardian Intelligence
              </p>
            </div>
          </div>

          {/* Status pill */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 9px",
              borderRadius: 20,
              fontSize: 10.5,
              fontWeight: 600,
              background: isActive
                ? "rgba(34,197,94,0.1)"
                : status === "error"
                ? "rgba(239,68,68,0.1)"
                : "rgba(255,255,255,0.05)",
              color: isActive
                ? "#22c55e"
                : status === "error"
                ? "#ef4444"
                : colors.textMuted,
              border: `1px solid ${
                isActive
                  ? "rgba(34,197,94,0.2)"
                  : status === "error"
                  ? "rgba(239,68,68,0.2)"
                  : colors.cardBorder
              }`,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: isActive ? "#22c55e" : status === "error" ? "#ef4444" : colors.textMuted,
                animation: isActive ? "va-pulse 2s ease-in-out infinite" : "none",
              }}
            />
            {isConnecting ? "Connecting" : isActive ? "Live" : status === "error" ? "Error" : "Offline"}
          </span>
        </div>

        {/* Transcript area */}
        <div
          ref={scrollRef}
          style={{
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 9,
            minHeight: 130,
            maxHeight: 220,
            overflowY: "auto",
            scrollbarWidth: "none",
          }}
        >
          {messages.length === 0 && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                padding: "16px 0",
                color: colors.textMuted,
              }}
            >
              {!isActive && !error && (
                <>
                  <MessageSquare size={22} color={colors.textMuted} style={{ opacity: 0.4 }} />
                  <p style={{ fontSize: 11.5, textAlign: "center", lineHeight: 1.55, maxWidth: 200 }}>
                    Tap the mic and ask about signals, positions, or market conditions
                  </p>
                </>
              )}
              {isConnecting && (
                <p style={{ fontSize: 11.5, color: colors.textMuted }}>Initialising voice session…</p>
              )}
              {status === "active" && (
                <p style={{ fontSize: 11.5, color: colors.textSub }}>Listening — speak now</p>
              )}
            </div>
          )}

          {messages.map((msg) => (
            <TranscriptLine key={msg.id} msg={msg} accent={colors.accent ?? "#4f7ef7"} />
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div
            style={{
              margin: "0 14px 10px",
              padding: "8px 12px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 8,
              fontSize: 11.5,
              color: "#fca5a5",
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

        {/* Controls */}
        <div
          style={{
            padding: "12px 16px 16px",
            borderTop: `1px solid ${colors.cardBorder}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          {/* Mic orb + wave visualiser row */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <MicOrb
              micLevel={micLevel}
              isSpeaking={isSpeaking}
              isActive={isActive}
              isConnecting={isConnecting}
              onClick={handleToggle}
              accentColor={colors.accent ?? "#4f7ef7"}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <WaveBars isSpeaking={isSpeaking} micLevel={micLevel} />
              <p style={{ fontSize: 10.5, color: colors.textMuted }}>
                {isConnecting && "Connecting…"}
                {status === "active" && !isSpeaking && "Listening for speech…"}
                {status === "active" && isSpeaking && "Guardian AI is speaking"}
                {status === "idle" && !error && "Tap mic to start"}
                {status === "error" && "Tap mic to retry"}
              </p>
            </div>
          </div>

          {/* Text input — shown only when active */}
          {status === "active" && (
            <div style={{ display: "flex", gap: 6, width: "100%", alignItems: "center" }}>
              <input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Or type a message…"
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${colors.cardBorder}`,
                  borderRadius: 16,
                  padding: "7px 13px",
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 12,
                  outline: "none",
                }}
              />
              <button
                onClick={handleSend}
                disabled={!textInput.trim()}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  border: "none",
                  cursor: textInput.trim() ? "pointer" : "not-allowed",
                  background: textInput.trim()
                    ? "linear-gradient(135deg,#4f7ef7,#7c3aed)"
                    : "rgba(255,255,255,0.07)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          )}

          {/* Quick prompts — shown when idle */}
          {!isActive && messages.length === 0 && !error && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, justifyContent: "center" }}>
              {["Analyse BTC signals", "Review my risk", "Top movers today"].map((q) => (
                <button
                  key={q}
                  onClick={async () => {
                    await connect();
                    setTimeout(() => sendText(q), 1200);
                  }}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 20,
                    border: `1px solid ${colors.cardBorder}`,
                    background: "rgba(255,255,255,0.04)",
                    color: colors.textMuted,
                    fontSize: 10.5,
                    cursor: "pointer",
                    transition: "background 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.background = "rgba(79,126,247,0.1)";
                    (e.target as HTMLElement).style.color = "#4f7ef7";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                    (e.target as HTMLElement).style.color = colors.textMuted;
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
