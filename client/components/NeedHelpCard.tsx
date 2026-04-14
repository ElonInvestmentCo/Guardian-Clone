import { useState, useEffect, useCallback } from "react";
import supportCardImg from "@assets/support-card.png";

declare global {
  interface Window {
    LC_API?: { open_chat_window?: () => void; chat_running?: () => boolean };
    LiveChatWidget?: {
      call: (action: string) => void;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      get: (prop: string) => unknown;
    };
  }
}

const STORAGE_KEY = "needHelpCardDismissed";

export default function NeedHelpCard() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (dismissed) return;

    let cancelled = false;
    let delayTimer: ReturnType<typeof setTimeout>;

    const showAfterDelay = () => {
      delayTimer = setTimeout(() => {
        if (!cancelled) setVisible(true);
      }, 2000);
    };

    if (window.LiveChatWidget) {
      try {
        const state = window.LiveChatWidget.get("state") as { visibility?: string } | undefined;
        if (state && state.visibility === "maximized" || state && state.visibility === "minimized") {
          showAfterDelay();
        } else {
          window.LiveChatWidget.on("ready", () => {
            if (!cancelled) showAfterDelay();
          });
        }
      } catch {
        window.LiveChatWidget.on("ready", () => {
          if (!cancelled) showAfterDelay();
        });
      }
    } else {
      const checkWidget = setInterval(() => {
        if (window.LiveChatWidget) {
          clearInterval(checkWidget);
          try {
            window.LiveChatWidget.on("ready", () => {
              if (!cancelled) showAfterDelay();
            });
            const state = window.LiveChatWidget.get("state") as { visibility?: string } | undefined;
            if (state && (state.visibility === "maximized" || state.visibility === "minimized")) {
              if (!cancelled) showAfterDelay();
            }
          } catch {
            if (!cancelled) showAfterDelay();
          }
        } else if (window.LC_API) {
          clearInterval(checkWidget);
          if (!cancelled) showAfterDelay();
        }
      }, 500);

      const fallbackTimer = setTimeout(() => {
        clearInterval(checkWidget);
      }, 15000);

      return () => {
        cancelled = true;
        clearInterval(checkWidget);
        clearTimeout(fallbackTimer);
        clearTimeout(delayTimer);
      };
    }

    return () => {
      cancelled = true;
      clearTimeout(delayTimer);
    };
  }, [dismissed]);

  const openChat = useCallback(() => {
    if (window.LiveChatWidget) {
      window.LiveChatWidget.call("maximize");
    } else if (window.LC_API?.open_chat_window) {
      window.LC_API.open_chat_window();
    }
  }, []);

  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setVisible(false);
    setDismissed(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {}
  }, []);

  if (dismissed) return null;

  return (
    <>
      <style>{`
        .need-help-card {
          position: fixed;
          bottom: 88px;
          right: 20px;
          z-index: 9998;
          cursor: pointer;
          opacity: 0;
          transform: translateY(20px) scale(0.95);
          transition: opacity 0.5s ease, transform 0.5s ease;
          pointer-events: none;
        }
        .need-help-card.is-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }
        .need-help-card:hover {
          transform: translateY(-2px) scale(1.03);
        }
        .need-help-card:hover .need-help-card__img {
          box-shadow: 0 8px 32px rgba(0,0,0,0.35);
        }
        .need-help-card__img {
          display: block;
          width: 220px;
          height: auto;
          border-radius: 0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.25);
          transition: box-shadow 0.3s ease;
        }
        .need-help-card__close {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #374151;
          border: 1px solid #4b5563;
          color: #d1d5db;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          font-size: 12px;
          line-height: 1;
          transition: background 0.15s ease;
          z-index: 1;
        }
        .need-help-card__close:hover {
          background: #4b5563;
          color: #fff;
        }
        @media (max-width: 480px) {
          .need-help-card {
            bottom: 76px;
            right: 12px;
          }
          .need-help-card__img {
            width: 160px;
          }
        }
      `}</style>
      <div
        className={`need-help-card${visible ? " is-visible" : ""}`}
        onClick={openChat}
        role="button"
        tabIndex={0}
        aria-label="Need help? Click here to start chatting with us"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openChat(); }}
      >
        <button
          className="need-help-card__close"
          onClick={handleDismiss}
          aria-label="Dismiss help card"
        >
          ✕
        </button>
        <img
          className="need-help-card__img"
          src={supportCardImg}
          alt="Need help? Click here and start chatting with us"
          loading="lazy"
          draggable={false}
        />
      </div>
    </>
  );
}
