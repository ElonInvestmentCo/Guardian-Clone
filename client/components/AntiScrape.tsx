import { useEffect } from "react";

export default function AntiScrape() {
  useEffect(() => {
    function blockImageContextMenu(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "IMG" || t.tagName === "VIDEO" || t.tagName === "CANVAS")) {
        e.preventDefault();
        return false;
      }
    }

    function blockKeyboard(e: KeyboardEvent) {
      if (!e.key) return;
      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && key === "u") e.preventDefault();
      if (ctrl && key === "s") e.preventDefault();
      if (ctrl && key === "p") e.preventDefault();
      if (ctrl && e.shiftKey && ["i", "j", "k", "m"].includes(key)) e.preventDefault();
      if (e.key === "F12") e.preventDefault();
      if (e.key === "PrintScreen") {
        e.preventDefault();
        navigator.clipboard.writeText("").catch(() => {});
      }
    }

    function blockDragStart(e: DragEvent) {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "IMG" || t.tagName === "VIDEO" || t.tagName === "CANVAS")) {
        e.preventDefault();
        return false;
      }
    }

    function blockBeforePrint() {
      document.body.style.visibility = "hidden";
    }

    function blockAfterPrint() {
      document.body.style.visibility = "visible";
    }

    document.addEventListener("contextmenu", blockImageContextMenu);
    document.addEventListener("keydown", blockKeyboard);
    document.addEventListener("dragstart", blockDragStart);
    window.addEventListener("beforeprint", blockBeforePrint);
    window.addEventListener("afterprint", blockAfterPrint);

    const style = document.createElement("style");
    style.textContent = `
      img, video, canvas, picture, source {
        -webkit-user-drag: none !important;
        pointer-events: none !important;
      }
      a img, button img, [role="button"] img {
        pointer-events: none !important;
      }
      a, button, [role="button"], input, textarea, select, label, [tabindex] {
        pointer-events: auto !important;
      }
      img {
        -webkit-touch-callout: none !important;
      }
      @media print {
        html, body {
          display: none !important;
          visibility: hidden !important;
        }
      }
    `;
    document.head.appendChild(style);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLImageElement) {
            node.setAttribute("draggable", "false");
          }
          if (node instanceof HTMLElement) {
            node.querySelectorAll("img").forEach((img) => {
              img.setAttribute("draggable", "false");
            });
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    document.querySelectorAll("img").forEach((img) => {
      img.setAttribute("draggable", "false");
    });

    return () => {
      document.removeEventListener("contextmenu", blockImageContextMenu);
      document.removeEventListener("keydown", blockKeyboard);
      document.removeEventListener("dragstart", blockDragStart);
      window.removeEventListener("beforeprint", blockBeforePrint);
      window.removeEventListener("afterprint", blockAfterPrint);
      observer.disconnect();
      style.remove();
    };
  }, []);

  return null;
}
