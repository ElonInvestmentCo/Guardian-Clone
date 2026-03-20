import { useState, useEffect, useCallback } from "react";
import { X, ArrowLeft, MoreHorizontal, Minus } from "lucide-react";
import { useLocation } from "wouter";
import chatIcon from "@assets/DAFF4A91-FB9A-40ED-9CF7-E072FEA1BB59_1773727452638.png";
import needHelpImg from "@assets/8362510f188d6ddbeb52744b9d477783_1773966680140.png";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [showIcon, setShowIcon] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupDismissed, setPopupDismissed] = useState(false);
  const [location] = useLocation();

  const startTimers = useCallback(() => {
    setShowIcon(false);
    setShowPopup(false);
    setPopupDismissed(false);

    const iconTimer = setTimeout(() => setShowIcon(true), 5000);
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

  const handlePopupClick = () => {
    setOpen(true);
    setShowPopup(false);
  };

  const handlePopupClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPopup(false);
    setPopupDismissed(true);
  };

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
              <div className="w-11 h-11 rounded-full bg-[#4a7fbd] flex items-center justify-center text-white font-bold text-lg">
                R
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-[#2a2a2a]" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Robert Cleary</p>
              <p className="text-gray-400 text-xs">Product Expert</p>
            </div>
          </div>
        </div>

        {/* Chat body */}
        <div className="px-4 pb-4 flex flex-col gap-3">
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-[#4a7fbd] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">
              R
            </div>
            <div className="flex-1 rounded-2xl rounded-tl-sm overflow-hidden" style={{ background: "#2a2a2a" }}>
              <video
                src={`${import.meta.env.BASE_URL}chat-preview.mp4`}
                className="w-full h-[170px] object-cover object-center"
                autoPlay
                loop
                muted
                playsInline
              />
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

      {/* "Need Help?" popup — appears 6s after page load, clickable to open chat */}
      {!popupDismissed && (
        <div
          className={`fixed bottom-[84px] right-5 z-40 w-[190px] rounded-xl overflow-hidden shadow-2xl cursor-pointer transition-all duration-500 ease-out ${
            showPopup && !open
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-3 pointer-events-none"
          }`}
          onClick={handlePopupClick}
          role="button"
          aria-label="Open chat"
        >
          {/* Close (X) button */}
          <button
            onClick={handlePopupClose}
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

      {/* Trigger button — appears 5s after page load */}
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (showPopup) setShowPopup(false);
        }}
        aria-label="Open chat"
        className={`fixed bottom-5 right-5 z-50 w-[62px] h-[62px] rounded-full shadow-2xl transition-all duration-500 hover:scale-105 active:scale-95 focus:outline-none overflow-hidden bg-transparent ${
          showIcon ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {open ? (
          <div className="w-full h-full rounded-full bg-[#5aabdb] flex items-center justify-center">
            <X className="w-6 h-6 text-white" />
          </div>
        ) : (
          <img
            src={chatIcon}
            alt="Chat"
            className="w-full h-full object-cover rounded-full"
            style={{ imageRendering: "crisp-edges" }}
          />
        )}
      </button>
    </>
  );
}
