import { useState, useEffect, useCallback } from "react";
import { X, ArrowLeft, Minus, Home, MessageSquare } from "lucide-react";
import { useLocation } from "wouter";
import needHelpImg from "@assets/8362510f188d6ddbeb52744b9d477783_1773966680140.png";
import heroPattern from "@assets/pattern_1773965291387.png";
import letsChatBtn from "@assets/IMG_8080_1773969229592.PNG";

type Screen = "home" | "chat";

function formatTime() {
  const now = new Date();
  let h = now.getHours();
  const m = now.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

/* Speech bubble SVG with three dots */
function BubbleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width="28"
      height="28"
      fill="white"
      aria-hidden="true"
    >
      <path d="M16 2C8.28 2 2 7.48 2 14.2c0 3.9 2.02 7.36 5.2 9.66L6 29.5l6.08-3.28c1.27.3 2.6.46 3.92.46 7.72 0 14-5.48 14-12.2S23.72 2 16 2zm-4.5 13.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4.5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4.5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
    </svg>
  );
}

export default function ChatWidget() {
  const [open,           setOpen]           = useState(false);
  const [screen,         setScreen]         = useState<Screen>("home");
  const [showIcon,       setShowIcon]       = useState(false);
  const [showPopup,      setShowPopup]      = useState(false);
  const [popupDismissed, setPopupDismissed] = useState(false);
  const [hovered,        setHovered]        = useState(false);
  const [location]                          = useLocation();

  const startTimers = useCallback(() => {
    setShowIcon(false);
    setShowPopup(false);
    setPopupDismissed(false);
    const iconTimer  = setTimeout(() => setShowIcon(true), 5000);
    const popupTimer = setTimeout(() => setShowPopup(true), 6000);
    return () => {
      clearTimeout(iconTimer);
      clearTimeout(popupTimer);
    };
  }, []);

  useEffect(() => {
    const cleanup = startTimers();
    return cleanup;
  }, [location, startTimers]);

  const handleOpen = () => {
    setOpen(true);
    setShowPopup(false);
  };

  const handleClose = () => {
    setOpen(false);
    setScreen("home");
    setHovered(false);
  };

  const timeStr = formatTime();

  /* Trigger button computed style */
  const triggerStyle: React.CSSProperties = {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: 9999,
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: hovered && !open ? "#1a6ab1" : "#0b1f3a",
    boxShadow: hovered && !open
      ? "0 12px 28px rgba(0,0,0,0.4), 0 0 0 3px rgba(42,106,191,0.35)"
      : "0 8px 20px rgba(0,0,0,0.3)",
    transform: hovered && !open ? "translateY(-8px) scale(1.05)" : "translateY(0) scale(1)",
    transition: "transform 0.25s ease, background 0.25s ease, box-shadow 0.25s ease, opacity 0.4s ease",
    opacity: showIcon ? 1 : 0,
    pointerEvents: showIcon ? "auto" : "none",
    cursor: "pointer",
    border: "none",
    outline: "none",
  };

  return (
    <>
      {/* ── CHAT PANEL ──────────────────────────────────────────────────────── */}
      <div
        className={`fixed bottom-[88px] right-5 z-50 w-[340px] rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ease-out origin-bottom-right flex flex-col ${
          open
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-90 translate-y-4 pointer-events-none"
        }`}
        style={{ background: "#141414", maxHeight: "580px" }}
      >
        {/* ── HOME SCREEN ─────────────────────────────────────────────────── */}
        {screen === "home" && (
          <div className="flex flex-col" style={{ minHeight: "580px", background: "#0e0e0e" }}>
            {/* Hero gradient header */}
            <div
              className="relative overflow-hidden"
              style={{
                background: "linear-gradient(150deg, #1c7d8a 0%, #0f4a5c 35%, #081828 70%, #080e18 100%)",
                minHeight: "260px",
                flexShrink: 0,
              }}
            >
              <img
                src={heroPattern}
                alt=""
                aria-hidden="true"
                className="absolute top-0 right-0 h-full w-[52%] object-cover object-left pointer-events-none select-none"
                style={{ opacity: 0.28 }}
              />

              <div className="relative z-10 flex justify-end pt-4 pr-4">
                <button
                  onClick={handleClose}
                  aria-label="Minimize"
                  className="text-white/50 hover:text-white/90 transition-colors leading-none"
                  style={{ fontSize: "22px", lineHeight: 1 }}
                >
                  —
                </button>
              </div>

              <div className="relative z-10 px-5 pt-2 pb-10">
                <h2
                  className="text-white font-extrabold leading-[1.1]"
                  style={{ fontSize: "34px", letterSpacing: "-0.5px" }}
                >
                  Guardian<br />Trading<br />LiveChat
                </h2>
              </div>

              <div
                className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
                style={{ background: "linear-gradient(to bottom, transparent 0%, #0e0e0e 100%)" }}
              />
            </div>

            {/* Conversation card */}
            <div
              className="mx-4 relative z-10"
              style={{ background: "transparent", marginTop: "-20px", boxShadow: "none", border: "none" }}
            >
              <div className="flex items-start gap-3 px-4 pt-4 pb-3">
                <div className="relative flex-shrink-0 mt-0.5">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[15px]"
                    style={{ background: "#4a7fbd" }}
                  >
                    R
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#3dd68c] border-2 border-[#0e0e0e]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] leading-tight mb-1">
                    <span className="text-white font-semibold">Robert Cleary</span>
                    <span className="text-[#888] font-normal"> • {timeStr}</span>
                  </p>
                  <p className="text-[#ccc] text-[13px] leading-snug">
                    Have a question? Contact customer support, sales &amp; new accounts.
                  </p>
                </div>
              </div>

              <div className="px-3 pb-4">
                <button
                  onClick={() => setScreen("chat")}
                  className="w-full block focus:outline-none transition-opacity hover:opacity-90 active:opacity-80"
                  aria-label="Let's chat"
                >
                  <img src={letsChatBtn} alt="Let's chat" className="w-full h-auto block" />
                </button>
              </div>
            </div>

            <div className="flex-1" />

            {/* Bottom nav pill */}
            <div className="px-4 mb-3">
              <div className="flex rounded-[18px] overflow-hidden" style={{ background: "#1e1e1e" }}>
                <button className="flex-1 flex flex-col items-center justify-center gap-[6px] py-[14px] text-white">
                  <Home className="w-[20px] h-[20px]" style={{ fill: "white", strokeWidth: 0 }} />
                  <span className="text-[12px] font-bold">Home</span>
                </button>
                <button
                  onClick={() => setScreen("chat")}
                  className="flex-1 flex flex-col items-center justify-center gap-[6px] py-[14px] text-[#555] hover:text-[#888] transition-colors"
                >
                  <MessageSquare className="w-[20px] h-[20px]" style={{ strokeWidth: 1.8 }} />
                  <span className="text-[12px] font-bold">Chat</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-[6px] pb-4">
              <span className="text-[#555] text-[11px]">Powered by</span>
              <span className="text-[#ff5c35] text-[12px] leading-none">●</span>
              <span className="text-[#ccc] text-[11px] font-semibold">LiveChat</span>
            </div>
          </div>
        )}

        {/* ── CHAT SCREEN ─────────────────────────────────────────────────── */}
        {screen === "chat" && (
          <div className="flex flex-col flex-1">
            <div className="flex items-center justify-between px-4 py-3" style={{ background: "#111" }}>
              <button
                onClick={() => setScreen("home")}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-center py-5 px-4">
              <div className="flex items-center gap-3 bg-[#2a2a2a] rounded-full px-5 py-3 shadow-lg">
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-full bg-[#4a7fbd] flex items-center justify-center text-white font-bold text-lg">R</div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-[#2a2a2a]" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm leading-tight">Robert Cleary</p>
                  <p className="text-gray-400 text-xs">Product Expert</p>
                </div>
              </div>
            </div>

            <div className="px-4 pb-4 flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-[#4a7fbd] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">R</div>
                <div className="flex-1 rounded-2xl rounded-tl-sm overflow-hidden" style={{ background: "#2a2a2a" }}>
                  <video
                    src={`${import.meta.env.BASE_URL}chat-preview.mp4`}
                    className="w-full h-[170px] object-cover object-center"
                    autoPlay loop muted playsInline
                  />
                  <div className="px-4 py-3">
                    <p className="text-white text-sm leading-relaxed">
                      Have a question? Contact customer support, sales &amp; new accounts.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 pb-3">
              <button
                className="w-full py-3.5 rounded-full text-gray-900 font-bold text-[15px] transition-opacity hover:opacity-90 active:opacity-80"
                style={{ background: "#76c9f5" }}
              >
                Let's chat
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 py-2.5 border-t border-white/5">
              <span className="text-gray-500 text-[11px]">Powered by</span>
              <span className="text-[#ff5c35] text-[11px]">●</span>
              <span className="text-gray-400 text-[11px] font-semibold">LiveChat</span>
            </div>
          </div>
        )}
      </div>

      {/* ── "Need Help?" popup ───────────────────────────────────────────────── */}
      {!popupDismissed && (
        <div
          className={`fixed bottom-[88px] right-5 z-40 w-[190px] rounded-xl overflow-hidden shadow-2xl cursor-pointer transition-all duration-500 ease-out ${
            showPopup && !open
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-3 pointer-events-none"
          }`}
          onClick={handleOpen}
          role="button"
          aria-label="Open chat"
        >
          <button
            onClick={(e) => { e.stopPropagation(); setShowPopup(false); setPopupDismissed(true); }}
            aria-label="Close popup"
            className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <img
            src={needHelpImg}
            alt="Need Help? Click here and start chatting with us"
            className="block w-full h-auto"
          />
        </div>
      )}

      {/* ── Trigger button ───────────────────────────────────────────────────── */}
      <button
        onClick={() => open ? handleClose() : handleOpen()}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="Open chat"
        style={triggerStyle}
      >
        {open ? (
          <X style={{ width: "24px", height: "24px", color: "white" }} />
        ) : (
          <BubbleIcon />
        )}
      </button>
    </>
  );
}
