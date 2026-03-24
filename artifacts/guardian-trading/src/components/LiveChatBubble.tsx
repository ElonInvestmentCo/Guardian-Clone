import { useState, useEffect, useCallback } from "react";
import { MessageCircle, X } from "lucide-react";

const LIVECHAT_LICENSE = "19606329";
const CHAT_URL = `https://direct.lc.chat/${LIVECHAT_LICENSE}/`;

export default function LiveChatBubble() {
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setPulse(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  return (
    <>
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 90,
            right: 20,
            width: 370,
            height: 500,
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
            zIndex: 99998,
            background: "#1a1a2e",
          }}
        >
          <iframe
            src={CHAT_URL}
            title="Live Chat"
            style={{ width: "100%", height: "100%", border: "none" }}
            allow="microphone; camera"
          />
        </div>
      )}

      <button
        onClick={toggle}
        aria-label={open ? "Close chat" : "Open chat"}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #0066ff 0%, #0052cc 100%)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px rgba(0, 102, 255, 0.4)",
          zIndex: 99999,
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          animation: pulse ? "chatPulse 2s ease-in-out infinite" : "none",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow =
            "0 6px 24px rgba(0, 102, 255, 0.55)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow =
            "0 4px 16px rgba(0, 102, 255, 0.4)";
        }}
      >
        {open ? (
          <X size={26} color="#fff" />
        ) : (
          <MessageCircle size={26} color="#fff" />
        )}
      </button>

      <style>{`
        @keyframes chatPulse {
          0%, 100% { box-shadow: 0 4px 16px rgba(0,102,255,0.4); }
          50% { box-shadow: 0 4px 24px rgba(0,102,255,0.7); }
        }
      `}</style>
    </>
  );
}
