import { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, X, Minus, Maximize2, Send, Trash2, Zap, AlertTriangle, TrendingUp } from "lucide-react";
import DOMPurify from "dompurify";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

type WidgetState = "closed" | "minimized" | "open" | "expanded";

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: "4px", padding: "8px 0" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#3b82f6",
            animation: `bounce 1.4s infinite ease-in-out both`,
            animationDelay: `${i * 0.16}s`,
          }}
        />
      ))}
    </div>
  );
}

function formatMarkdown(text: string): string {
  const raw = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, '<code style="background:#1e293b;padding:1px 4px;border-radius:3px;font-size:12px">$1</code>')
    .replace(/\n/g, "<br/>");
  return DOMPurify.sanitize(raw, { ALLOWED_TAGS: ["strong", "em", "code", "br"], ALLOWED_ATTR: ["style"] });
}

export default function AiAssistant() {
  const [state, setState] = useState<WidgetState>("closed");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [autoTrading, setAutoTrading] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasAutoOpened = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const email = typeof sessionStorage !== "undefined"
    ? sessionStorage.getItem("signupEmail") ?? "trader@guardiantrading.com"
    : "trader@guardiantrading.com";

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (state === "open" || state === "expanded") {
      fetch(`${API}/api/ai/history?email=${encodeURIComponent(email)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.messages) setMessages(data.messages);
        })
        .catch((err: unknown) => console.error("[AiAssistant] Failed to load chat history:", err));
    }
  }, [state, email]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!hasAutoOpened.current) {
      const timer = setTimeout(() => {
        setState("minimized");
        hasAutoOpened.current = true;
      }, 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg = input.trim();
    setInput("");

    const newMsg: ChatMessage = { role: "user", content: userMsg, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, newMsg]);
    setIsStreaming(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await fetch(`${API}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, email }),
        signal: controller.signal,
      });

      if (!resp.ok) throw new Error("AI request failed");

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let assistantContent = "";
      let buffer = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "", timestamp: new Date().toISOString() }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n");
        buffer = parts.pop() ?? "";

        for (const line of parts) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              assistantContent += data.content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: assistantContent,
                };
                return updated;
              });
            }
          } catch {
            /* incomplete JSON in buffer — will be caught next iteration */
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again.", timestamp: new Date().toISOString() },
      ]);
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const clearChat = async () => {
    await fetch(`${API}/api/ai/clear`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setMessages([]);
  };

  const quickPrompts = [
    { icon: TrendingUp, label: "Analyze my portfolio", prompt: "Analyze my current portfolio and suggest optimizations" },
    { icon: Zap, label: "Trading opportunities", prompt: "What are the best trading opportunities right now?" },
    { icon: AlertTriangle, label: "Risk assessment", prompt: "Assess the risk level of my current positions" },
  ];

  if (state === "closed") {
    return (
      <button
        onClick={() => setState("open")}
        id="guardian-ai-widget"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(59, 130, 246, 0.5)",
          zIndex: 9999,
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = "0 6px 28px rgba(59, 130, 246, 0.7)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(59, 130, 246, 0.5)";
        }}
      >
        <MessageSquare size={24} color="#fff" />
      </button>
    );
  }

  if (state === "minimized") {
    return (
      <div
        id="guardian-ai-widget"
        onClick={() => setState("open")}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 20px",
          background: "linear-gradient(135deg, #0f172a, #1e293b)",
          borderRadius: "16px",
          border: "1px solid #334155",
          cursor: "pointer",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4)",
          zIndex: 9999,
          animation: "slideUp 0.3s ease-out",
        }}
      >
        <div style={{
          width: "36px", height: "36px", borderRadius: "50%",
          background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <MessageSquare size={18} color="#fff" />
        </div>
        <div>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#e2e8f0", margin: 0 }}>Guardian AI</p>
          <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>Trading Assistant</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setState("closed"); }}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", marginLeft: "8px" }}
        >
          <X size={14} color="#64748b" />
        </button>
      </div>
    );
  }

  const isExpanded = state === "expanded";
  const widgetWidth = isExpanded ? "480px" : "380px";
  const widgetHeight = isExpanded ? "85vh" : "520px";

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        .ai-msg-scroll::-webkit-scrollbar { width: 4px; }
        .ai-msg-scroll::-webkit-scrollbar-track { background: transparent; }
        .ai-msg-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
      `}</style>

      {showDisclaimer && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 10001,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#0f172a", border: "1px solid #334155", borderRadius: "16px",
            padding: "28px", maxWidth: "400px", width: "90%",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <AlertTriangle size={24} color="#f59e0b" />
              <h3 style={{ color: "#e2e8f0", fontSize: "16px", fontWeight: 700, margin: 0 }}>Auto-Trading Disclaimer</h3>
            </div>
            <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: 1.6, marginBottom: "20px" }}>
              By enabling Auto-Trading, you authorize Guardian AI to execute trades on your behalf based on AI analysis.
              All trades will respect your configured limits (max trade size, stop-loss). You can disable this at any time.
              <strong style={{ color: "#f59e0b" }}> Trading involves significant risk. Past performance does not guarantee future results.</strong>
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => { setAutoTrading(true); setShowDisclaimer(false); }}
                style={{ flex: 1, padding: "10px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 600, cursor: "pointer", fontSize: "13px" }}
              >
                I Understand, Enable
              </button>
              <button
                onClick={() => setShowDisclaimer(false)}
                style={{ flex: 1, padding: "10px", background: "transparent", color: "#94a3b8", border: "1px solid #334155", borderRadius: "10px", fontWeight: 600, cursor: "pointer", fontSize: "13px" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        id="guardian-ai-widget"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: widgetWidth,
          height: widgetHeight,
          background: "#0a0f1a",
          borderRadius: "20px",
          border: "1px solid #1e293b",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.6)",
          zIndex: 10000,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "slideUp 0.3s ease-out",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "16px 18px",
          background: "linear-gradient(135deg, #0f172a, #1e293b)",
          borderBottom: "1px solid #1e293b",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%",
              background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <MessageSquare size={16} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#e2e8f0", margin: 0 }}>Guardian AI</p>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981" }} />
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>Online</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              onClick={() => autoTrading ? setAutoTrading(false) : setShowDisclaimer(true)}
              title={autoTrading ? "Disable Auto-Trading" : "Enable Auto-Trading"}
              style={{
                padding: "4px 10px",
                fontSize: "10px",
                fontWeight: 700,
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                background: autoTrading ? "#10b981" : "#1e293b",
                color: autoTrading ? "#fff" : "#64748b",
                transition: "all 0.2s",
              }}
            >
              {autoTrading ? "AUTO ON" : "AUTO OFF"}
            </button>
            <button onClick={clearChat} style={{ background: "none", border: "none", cursor: "pointer", padding: "6px" }}>
              <Trash2 size={14} color="#64748b" />
            </button>
            <button onClick={() => setState(isExpanded ? "open" : "expanded")} style={{ background: "none", border: "none", cursor: "pointer", padding: "6px" }}>
              <Maximize2 size={14} color="#64748b" />
            </button>
            <button onClick={() => setState("minimized")} style={{ background: "none", border: "none", cursor: "pointer", padding: "6px" }}>
              <Minus size={14} color="#64748b" />
            </button>
            <button onClick={() => setState("closed")} style={{ background: "none", border: "none", cursor: "pointer", padding: "6px" }}>
              <X size={14} color="#64748b" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="ai-msg-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "30px 0" }}>
              <div style={{
                width: "56px", height: "56px", borderRadius: "50%", margin: "0 auto 16px",
                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <MessageSquare size={26} color="#fff" />
              </div>
              <p style={{ color: "#e2e8f0", fontSize: "16px", fontWeight: 700, marginBottom: "6px" }}>
                Welcome to Guardian AI
              </p>
              <p style={{ color: "#64748b", fontSize: "12px", marginBottom: "20px" }}>
                Your intelligent trading co-pilot. Ask me anything.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {quickPrompts.map(({ icon: Icon, label, prompt }) => (
                  <button
                    key={label}
                    onClick={() => { setInput(prompt); setTimeout(() => inputRef.current?.focus(), 50); }}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "10px 14px", background: "#111827", border: "1px solid #1e293b",
                      borderRadius: "10px", cursor: "pointer", textAlign: "left",
                      transition: "border-color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1e293b")}
                  >
                    <Icon size={16} color="#3b82f6" />
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                marginBottom: "12px",
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "85%",
                  padding: "10px 14px",
                  borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: msg.role === "user"
                    ? "linear-gradient(135deg, #3b82f6, #1d4ed8)"
                    : "#111827",
                  border: msg.role === "user" ? "none" : "1px solid #1e293b",
                  color: "#e2e8f0",
                  fontSize: "13px",
                  lineHeight: 1.6,
                }}
              >
                {msg.role === "assistant" ? (
                  msg.content ? (
                    <div dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} />
                  ) : (
                    <TypingIndicator />
                  )
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: "12px 16px",
          borderTop: "1px solid #1e293b",
          background: "#0f172a",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask Guardian AI..."
              disabled={isStreaming}
              style={{
                flex: 1,
                padding: "10px 14px",
                background: "#111827",
                border: "1px solid #1e293b",
                borderRadius: "12px",
                color: "#e2e8f0",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={isStreaming || !input.trim()}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: isStreaming || !input.trim() ? "#1e293b" : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                border: "none",
                cursor: isStreaming || !input.trim() ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Send size={16} color={isStreaming || !input.trim() ? "#475569" : "#fff"} />
            </button>
          </div>
          <p style={{ fontSize: "10px", color: "#475569", textAlign: "center", marginTop: "8px" }}>
            Powered by Guardian AI {autoTrading && "· Auto-Trading Active"}
          </p>
        </div>
      </div>
    </>
  );
}
