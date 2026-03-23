import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  getUserData,
  getCompletedStepNumbers,
  setProfilePicture,
  getProfilePicture,
} from "../lib/userDataStore.js";

const profileRouter = Router();

const PROFILE_PIC_DIR = path.resolve(process.cwd(), "data", "profile-pictures");
if (!fs.existsSync(PROFILE_PIC_DIR)) {
  fs.mkdirSync(PROFILE_PIC_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PROFILE_PIC_DIR),
  filename: (req, file, cb) => {
    const email = (req.body as Record<string, string>)["email"] ?? "unknown";
    const sanitized = email.replace(/[^a-zA-Z0-9]/g, "_");
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${sanitized}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only .jpg, .jpeg, .png, .webp files are allowed"));
    }
  },
});

profileRouter.get("/user/me", (req, res) => {
  const email = req.query["email"] as string | undefined;
  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }

  const userData = getUserData(email);
  if (!userData) {
    res.json({
      status: "not_found",
      kycComplete: false,
      completedSteps: [],
    });
    return;
  }

  const completedSteps = getCompletedStepNumbers(email);
  const status = (userData["status"] as string) ?? "pending";
  const totalSteps = 12;
  const kycComplete = completedSteps.length >= totalSteps;
  const profilePic = getProfilePicture(email);

  res.json({
    status,
    kycComplete,
    completedSteps,
    totalSteps,
    profilePicture: profilePic,
    role: (userData["role"] as string) ?? "user",
  });
});

profileRouter.post(
  "/user/profile-picture",
  upload.single("picture"),
  (req, res) => {
    const email = (req.body as Record<string, string>)["email"];
    if (!email || !req.file) {
      res.status(400).json({ error: "email and picture are required" });
      return;
    }
    setProfilePicture(email, req.file.filename);
    res.json({ success: true, filename: req.file.filename });
  }
);

profileRouter.get("/user/profile-picture/:filename", (req, res) => {
  const filePath = path.join(PROFILE_PIC_DIR, req.params["filename"]!);
  if (!filePath.startsWith(PROFILE_PIC_DIR)) {
    res.status(403).json({ error: "Access denied" });
    return;
  }
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.sendFile(filePath);
});

profileRouter.delete("/user/profile-picture", (req, res) => {
  const email = req.query["email"] as string | undefined;
  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }
  const current = getProfilePicture(email);
  if (current) {
    const filePath = path.join(PROFILE_PIC_DIR, current);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    setProfilePicture(email, "");
  }
  res.json({ success: true });
});

export default profileRouter;
