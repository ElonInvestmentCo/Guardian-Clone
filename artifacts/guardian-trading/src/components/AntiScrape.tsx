import { useEffect } from "react";

export default function AntiScrape() {
  useEffect(() => {
    function blockContextMenu(e: MouseEvent) {
      e.preventDefault();
      return false;
    }

    function isEditableTarget(e: Event): boolean {
      const t = e.target as HTMLElement;
      if (!t) return false;
      const tag = t.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return true;
      if (t.isContentEditable) return true;
      return false;
    }

    function blockCopycut(e: ClipboardEvent) {
      if (isEditableTarget(e)) return;
      e.preventDefault();
      return false;
    }

    function blockSelectStart(e: Event) {
      if (isEditableTarget(e)) return;
      e.preventDefault();
      return false;
    }

    function blockKeyboard(e: KeyboardEvent) {
      if (!e.key) return;
      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const editable = isEditableTarget(e);

      if (ctrl && key === "u") e.preventDefault();
      if (ctrl && key === "s") e.preventDefault();
      if (ctrl && key === "p") e.preventDefault();
      if (ctrl && key === "a" && !editable) e.preventDefault();
      if (ctrl && key === "c" && !editable) e.preventDefault();
      if (ctrl && key === "x" && !editable) e.preventDefault();
      if (ctrl && key === "v" && !editable) e.preventDefault();
      if (ctrl && e.shiftKey && ["i", "j", "c", "k", "m"].includes(key)) e.preventDefault();
      if (e.key === "F12") e.preventDefault();
      if (ctrl && key === "g") e.preventDefault();
      if (ctrl && key === "h") e.preventDefault();
      if (e.key === "PrintScreen") {
        e.preventDefault();
        navigator.clipboard.writeText("").catch(() => {});
      }
    }

    function blockDragStart(e: DragEvent) {
      e.preventDefault();
      return false;
    }

    function blockBeforePrint() {
      document.body.style.visibility = "hidden";
    }

    function blockAfterPrint() {
      document.body.style.visibility = "visible";
    }

    document.addEventListener("contextmenu", blockContextMenu);
    document.addEventListener("copy", blockCopycut);
    document.addEventListener("cut", blockCopycut);
    document.addEventListener("selectstart", blockSelectStart);
    document.addEventListener("keydown", blockKeyboard);
    document.addEventListener("dragstart", blockDragStart);
    window.addEventListener("beforeprint", blockBeforePrint);
    window.addEventListener("afterprint", blockAfterPrint);

    const style = document.createElement("style");
    style.textContent = `
      *, *::before, *::after {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      input, textarea, [contenteditable="true"] {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
      img, video, canvas, svg, picture, source {
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
            node.addEventListener("contextmenu", blockContextMenu);
          }
          if (node instanceof HTMLElement) {
            const imgs = node.querySelectorAll("img");
            imgs.forEach((img) => {
              img.setAttribute("draggable", "false");
              img.addEventListener("contextmenu", blockContextMenu);
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
      document.removeEventListener("contextmenu", blockContextMenu);
      document.removeEventListener("copy", blockCopycut);
      document.removeEventListener("cut", blockCopycut);
      document.removeEventListener("selectstart", blockSelectStart);
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
