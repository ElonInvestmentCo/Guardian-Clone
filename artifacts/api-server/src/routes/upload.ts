import { Router } from "express";
import multer, { MulterError } from "multer";
import path from "path";
import {
  sanitizeEmail,
  addDocumentRef,
} from "../lib/userDataStore.js";
import { getPool } from "../lib/db.js";
import { uploadLimit } from "../middleware/security.js";

const uploadRouter = Router();

const MAX_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg", "image/jpg", "image/png", "application/pdf",
]);
const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".pdf"]);

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

uploadRouter.post(
  "/signup/upload-document",
  uploadLimit,
  upload.single("file"),
  async (req, res) => {
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

    const safeRole = role.replace(/[^a-z0-9_-]/gi, "_").toLowerCase();
    const ext = path.extname(req.file.originalname).toLowerCase();

    if (req.file.size < 1024) {
      res.status(400).json({ error: "File too small (minimum 1 KB)" });
      return;
    }

    const fileName = `${safeRole}${ext}`;
    const relativePath = `data/users/${sanitizeEmail(email)}/documents/${fileName}`;

    try {
      const pool = getPool();
      await pool.query(
        `INSERT INTO user_documents (email, role, filename, mimetype, file_data, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (email, role) DO UPDATE SET filename = $3, mimetype = $4, file_data = $5, created_at = NOW()`,
        [email, safeRole, fileName, req.file.mimetype, req.file.buffer]
      );

      await addDocumentRef(email, safeRole, relativePath);

      console.log(`[upload] Saved document "${fileName}" for ${email} (stored in DB)`);
      res.json({ success: true, path: relativePath, fileName });
    } catch (err) {
      console.error("[upload] Failed to save document:", err);
      res.status(500).json({ error: "Failed to save file" });
    }
  }
);

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
