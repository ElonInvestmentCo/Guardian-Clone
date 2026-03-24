import { Router } from "express";
import multer, { MulterError } from "multer";
import path from "path";
import fs from "fs";
import {
  sanitizeEmail,
  getUserDocDir,
  addDocumentRef,
} from "../lib/userDataStore.js";
import { uploadLimit } from "../middleware/security.js";

const uploadRouter = Router();

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
]);
const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".pdf"]);

// Store files in memory first so we can choose the destination after reading req.body
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_MIME.has(file.mimetype) && ALLOWED_EXT.has(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: only JPG, PNG, and PDF are accepted`));
    }
  },
});

// ── Route ────────────────────────────────────────────────────────────────────

uploadRouter.post(
  "/signup/upload-document",
  uploadLimit,
  upload.single("file"),
  (req, res) => {
    const { email, role } = req.body as { email?: string; role?: string };

    if (!email || !role) {
      res.status(400).json({ error: "email and role are required" });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "Invalid email address" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    // Sanitize the role name to prevent path traversal
    const safeRole = role.replace(/[^a-z0-9_-]/gi, "_").toLowerCase();
    const ext = path.extname(req.file.originalname).toLowerCase();

    // Validate size (belt-and-suspenders — multer already enforces this)
    if (req.file.size < 1024) {
      res.status(400).json({ error: "File too small (minimum 1 KB)" });
      return;
    }

    // Build destination
    const docDir = getUserDocDir(email);
    try {
      if (!fs.existsSync(docDir)) {
        fs.mkdirSync(docDir, { recursive: true, mode: 0o700 });
      }
    } catch (err) {
      console.error("[upload] Failed to create document directory:", err);
      res.status(500).json({ error: "Failed to create storage directory" });
      return;
    }

    const fileName = `${safeRole}${ext}`;
    const destPath = path.join(docDir, fileName);

    // Write buffer to disk
    const writeRetries = 3;
    for (let attempt = 1; attempt <= writeRetries; attempt++) {
      try {
        fs.writeFileSync(destPath, req.file.buffer, { mode: 0o600 });
        fs.chmodSync(destPath, 0o600);
        break;
      } catch (err) {
        console.error(`[upload] File write failed (attempt ${attempt}/${writeRetries}):`, err);
        if (attempt === writeRetries) {
          res.status(500).json({ error: "Failed to save file" });
          return;
        }
      }
    }

    const relativePath = `data/users/${sanitizeEmail(email)}/documents/${fileName}`;
    try {
      addDocumentRef(email, safeRole, relativePath);
    } catch (err) {
      console.error("[upload] Failed to update document reference:", err);
      try { fs.unlinkSync(destPath); } catch { /* cleanup best-effort */ }
      res.status(500).json({ error: "Failed to record document reference" });
      return;
    }

    console.log(`[upload] Saved document "${fileName}" for ${email}`);
    res.json({ success: true, path: relativePath, fileName });
  }
);

// ── Multer error handler ──────────────────────────────────────────────────────

uploadRouter.use(
  "/signup/upload-document",
  (
    err: unknown,
    _req: import("express").Request,
    res: import("express").Response,
    _next: import("express").NextFunction
  ) => {
    if (err instanceof MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: "File exceeds 8 MB limit" });
        return;
      }
      res.status(400).json({ error: err.message });
      return;
    }
    if (err instanceof Error) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Upload failed" });
  }
);

export default uploadRouter;
