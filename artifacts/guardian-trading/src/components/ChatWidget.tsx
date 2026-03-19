import { useState } from "react";
import { ArrowLeft, MoreHorizontal, Minus, X } from "lucide-react";
import chatIcon from "@assets/DAFF4A91-FB9A-40ED-9CF7A-E072FEA1BB59_1773727452638.png";
import chatVideo from "@assets/7wZ4vcXS9HmFwr7xEB_1773947227987.mp4";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Chat Panel */}
      <div
        className={`fixed bottom-[84px] right-5 z-50 w-[340px] rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ease-out origin-bottom-right ${
          open
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-90 translate-y-4 pointer-events-none"
        }`}
        style={{ background: "#1a1a1a" }}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3" style={{ background: "#111" }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Agent card */}
        <div className="flex justify-center py-5 px-4">
          <div className="flex items-center gap-3 bg-[#2a2a2a] rounded-full px-5 py-3 shadow-lg">
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-full bg-[#c0622a] flex items-center justify-center text-white font-bold text-lg">
                M
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-[#2a2a2a]" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Michel Watteyne</p>
              <p className="text-gray-400 text-xs">Product Expert</p>
            </div>
          </div>
        </div>

        {/* Chat body */}
        <div className="px-4 pb-4 flex flex-col gap-3">
          <div className="flex items-start gap-2">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-[#c0622a] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">
              M
            </div>
            {/* Bubble */}
            <div className="flex-1 rounded-2xl rounded-tl-sm overflow-hidden" style={{ background: "#2a2a2a" }}>
              {/* Video player */}
              <video
                className="w-full h-[170px] object-cover"
                autoPlay
                loop
                muted
                playsInline
              >
                <source src={chatVideo} type="video/mp4" />
              </video>
              <div className="px-4 py-3">
                <p className="text-white text-sm leading-relaxed">
                  Have a question? Contact customer support, sales &amp; new accounts.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Let's chat button */}
        <div className="px-4 pb-3">
          <button
            className="w-full py-3.5 rounded-full text-gray-900 font-bold text-[15px] transition-opacity hover:opacity-90 active:opacity-80"
            style={{ background: "#76c9f5" }}
          >
            Let's chat
          </button>
        </div>

        {/* Powered by LiveChat */}
        <div className="flex items-center justify-center gap-1.5 py-2.5 border-t border-white/5">
          <span className="text-gray-500 text-[11px]">Powered by</span>
          <span className="text-[#ff5c35] text-[11px]">●</span>
          <span className="text-gray-400 text-[11px] font-semibold">LiveChat</span>
        </div>
      </div>

      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open chat"
        className="fixed bottom-5 right-5 z-50 w-[62px] h-[62px] rounded-full shadow-2xl transition-transform hover:scale-105 active:scale-95 focus:outline-none overflow-hidden bg-transparent"
      >
        {open ? (
          <div className="w-full h-full rounded-full bg-[#5aabdb] flex items-center justify-center">
            <X className="w-6 h-6 text-white" />
          </div>
        ) : (
          <div className="w-full h-full rounded-full bg-[#5aabdb] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="currentColor">
              <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
          </div>
        )}
      </button>
    </>
  );
}
