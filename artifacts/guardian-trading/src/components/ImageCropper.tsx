import { useRef, useState, useEffect, useCallback } from "react";

interface ImageCropperProps {
  imageSrc: string;
  onSave: (blob: Blob) => void;
  onCancel: () => void;
}

const PREVIEW_SIZE = 120;
const CROP_SIZE = 260;

export default function ImageCropper({ imageSrc, onSave, onCancel }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [cropShape, setCropShape] = useState<"square" | "circle">("circle");

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const fit = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight);
      setScale(fit);
      setOffset({ x: 0, y: 0 });
      setImgLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgLoaded) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    const iw = img.naturalWidth * scale;
    const ih = img.naturalHeight * scale;
    const cx = W / 2 + offset.x;
    const cy = H / 2 + offset.y;
    const ix = cx - iw / 2;
    const iy = cy - ih / 2;

    ctx.drawImage(img, ix, iy, iw, ih);

    const dimX = (W - CROP_SIZE) / 2;
    const dimY = (H - CROP_SIZE) / 2;
    ctx.fillStyle = "rgba(0,0,0,0.52)";
    ctx.fillRect(0, 0, W, dimY);
    ctx.fillRect(0, H - dimY, W, dimY);
    ctx.fillRect(0, dimY, dimX, CROP_SIZE);
    ctx.fillRect(W - dimX, dimY, dimX, CROP_SIZE);

    if (cropShape === "circle") {
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, CROP_SIZE / 2, 0, Math.PI * 2);
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.strokeRect(dimX, dimY, CROP_SIZE, CROP_SIZE);
    }

    const previewCanvas = previewRef.current;
    if (previewCanvas) {
      const pc = previewCanvas.getContext("2d")!;
      const srcX = (W - CROP_SIZE) / 2 - offset.x - iw / 2 + (W / 2 - (W - CROP_SIZE) / 2);
      const srcY = (H - CROP_SIZE) / 2 - offset.y - ih / 2 + (H / 2 - (H - CROP_SIZE) / 2);
      const ratio = img.naturalWidth !== 0 ? CROP_SIZE / iw : 1;

      pc.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
      if (cropShape === "circle") {
        pc.save();
        pc.beginPath();
        pc.arc(PREVIEW_SIZE / 2, PREVIEW_SIZE / 2, PREVIEW_SIZE / 2, 0, Math.PI * 2);
        pc.clip();
      }
      pc.drawImage(
        img,
        (-ix + (W - CROP_SIZE) / 2) / scale,
        (-iy + (H - CROP_SIZE) / 2) / scale,
        CROP_SIZE / scale,
        CROP_SIZE / scale,
        0,
        0,
        PREVIEW_SIZE,
        PREVIEW_SIZE
      );
      if (cropShape === "circle") pc.restore();
      void srcX; void srcY; void ratio;
    }
  }, [scale, offset, imgLoaded, cropShape]);

  useEffect(() => { draw(); }, [draw]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.08 : 0.93;
    setScale((s) => Math.min(Math.max(s * delta, 0.2), 10));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.mx),
      y: dragStart.current.oy + (e.clientY - dragStart.current.my),
    });
  };
  const onMouseUp = () => setDragging(false);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0]!;
      dragStart.current = { mx: t.clientX, my: t.clientY, ox: offset.x, oy: offset.y };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0]!;
      setOffset({
        x: dragStart.current.ox + (t.clientX - dragStart.current.mx),
        y: dragStart.current.oy + (t.clientY - dragStart.current.my),
      });
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const out = document.createElement("canvas");
    const SIZE = 400;
    out.width = SIZE;
    out.height = SIZE;
    const ctx = out.getContext("2d")!;

    const W = canvas.width;
    const H = canvas.height;
    const iw = img.naturalWidth * scale;
    const ih = img.naturalHeight * scale;
    const cx = W / 2 + offset.x;
    const cy = H / 2 + offset.y;
    const ix = cx - iw / 2;
    const iy = cy - ih / 2;

    const cropLeft = (W - CROP_SIZE) / 2;
    const cropTop = (H - CROP_SIZE) / 2;

    const srcX = (cropLeft - ix) / scale;
    const srcY = (cropTop - iy) / scale;
    const srcSize = CROP_SIZE / scale;

    if (cropShape === "circle") {
      ctx.save();
      ctx.beginPath();
      ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
      ctx.clip();
    }
    ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, SIZE, SIZE);
    if (cropShape === "circle") ctx.restore();

    out.toBlob(
      (blob) => { if (blob) onSave(blob); },
      "image/jpeg",
      0.88
    );
  };

  const CANVAS_W = 380;
  const CANVAS_H = 340;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.75)", padding: "16px",
    }}>
      <div style={{
        background: "#1a1f2e", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "440px",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.08)",
      }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>Edit Photo</h3>
        <p style={{ fontSize: "12px", color: "#8b9ab0", marginBottom: "16px" }}>Drag to reposition · Scroll to zoom</p>

        <div style={{ display: "flex", gap: "12px", marginBottom: "14px" }}>
          {(["circle", "square"] as const).map((s) => (
            <button key={s} onClick={() => setCropShape(s)} style={{
              padding: "5px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "none",
              background: cropShape === s ? "#3b82f6" : "rgba(255,255,255,0.08)",
              color: cropShape === s ? "#fff" : "#8b9ab0",
            }}>
              {s === "circle" ? "Circle" : "Square"}
            </button>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", color: "#8b9ab0" }}>Zoom</span>
            <input type="range" min={20} max={400} value={Math.round(scale * 100)}
              onChange={(e) => setScale(Number(e.target.value) / 100)}
              style={{ width: "80px", accentColor: "#3b82f6" }} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            style={{ borderRadius: "10px", cursor: dragging ? "grabbing" : "grab", display: "block", maxWidth: "100%" }}
            onWheel={onWheel}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onMouseUp}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
          <div>
            <p style={{ fontSize: "11px", color: "#8b9ab0", marginBottom: "8px" }}>Preview</p>
            <canvas
              ref={previewRef}
              width={PREVIEW_SIZE}
              height={PREVIEW_SIZE}
              style={{
                borderRadius: cropShape === "circle" ? "50%" : "10px",
                border: "2px solid rgba(59,130,246,0.4)",
                display: "block",
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "12px", color: "#8b9ab0", lineHeight: 1.6 }}>
              Drag the image to centre your face in the frame.
              Use the zoom slider or scroll wheel to resize.
              The final image is saved at 400×400px.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "10px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#8b9ab0",
          }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={!imgLoaded} style={{
            flex: 2, padding: "10px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
            background: "#3b82f6", border: "none", color: "#fff", opacity: imgLoaded ? 1 : 0.5,
          }}>
            Save Photo
          </button>
        </div>
      </div>
    </div>
  );
}
