import { useEffect } from "react";

export default function AntiScrape() {
  useEffect(() => {
    function blockKeyboard(e: KeyboardEvent) {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "u"
      ) {
        e.preventDefault();
      }

      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        ["i", "j", "c"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
      }

      if (e.key === "F12") {
        e.preventDefault();
      }
    }

    function blockDragStart(e: DragEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG" || target.tagName === "VIDEO") {
        e.preventDefault();
      }
    }

    document.addEventListener("keydown", blockKeyboard);
    document.addEventListener("dragstart", blockDragStart);

    const style = document.createElement("style");
    style.textContent = `
      img, video, canvas {
        -webkit-user-drag: none;
        user-select: none;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener("keydown", blockKeyboard);
      document.removeEventListener("dragstart", blockDragStart);
      style.remove();
    };
  }, []);

  return null;
}
