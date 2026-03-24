import { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import {
  getUserData,
  getCompletedStepNumbers,
  setProfilePicture,
  getProfilePicture,
  getUserProfileData,
  setUserProfileMeta,
  getStoredPasswordHash,
  saveUserCredentials,
  getDataDir,
} from "../lib/userDataStore.js";

const BCRYPT_ROUNDS = 12;

function legacySimpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (storedHash.startsWith("$2")) {
    return bcrypt.compare(password, storedHash);
  }
  return legacySimpleHash(password) === storedHash;
}

const profileRouter = Router();

const PROFILE_PIC_DIR = path.resolve(getDataDir(), "profile-pictures");
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
  try {
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
  } catch (err) {
    console.error("[Profile] /user/me error:", err);
    res.status(500).json({ error: "Failed to load user profile" });
  }
});

profileRouter.post(
  "/user/profile-picture",
  upload.single("picture"),
  (req, res) => {
    try {
      const email = (req.body as Record<string, string>)["email"];
      if (!email || !req.file) {
        res.status(400).json({ error: "email and picture are required" });
        return;
      }
      setProfilePicture(email, req.file.filename);
      res.json({ success: true, filename: req.file.filename });
    } catch (err) {
      console.error("[Profile] profile-picture upload error:", err);
      res.status(500).json({ error: "Failed to upload profile picture" });
    }
  }
);

profileRouter.get("/user/profile-picture/:filename", (req, res) => {
  try {
    const safeName = path.basename(req.params["filename"]!);
    const filePath = path.join(PROFILE_PIC_DIR, safeName);
    if (!filePath.startsWith(PROFILE_PIC_DIR + path.sep) && filePath !== PROFILE_PIC_DIR) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.sendFile(filePath);
  } catch (err) {
    console.error("[Profile] profile-picture serve error:", err);
    res.status(500).json({ error: "Failed to load profile picture" });
  }
});

profileRouter.delete("/user/profile-picture", (req, res) => {
  try {
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
  } catch (err) {
    console.error("[Profile] profile-picture delete error:", err);
    res.status(500).json({ error: "Failed to delete profile picture" });
  }
});

profileRouter.post("/user/update-profile", (req, res) => {
  try {
    const { email, firstName, lastName, phone, country, state, city } = req.body as Record<string, string>;
    if (!email) { res.status(400).json({ error: "email is required" }); return; }
    const profile = getUserProfileData(email);
    if (!profile["email"]) { res.status(404).json({ error: "User not found" }); return; }
    const settings = (profile["_settings"] as Record<string, unknown>) ?? {};
    if (firstName !== undefined) settings["firstName"] = firstName;
    if (lastName !== undefined) settings["lastName"] = lastName;
    if (phone !== undefined) settings["phone"] = phone;
    if (country !== undefined) settings["country"] = country;
    if (state !== undefined) settings["state"] = state;
    if (city !== undefined) settings["city"] = city;
    settings["updatedAt"] = new Date().toISOString();
    setUserProfileMeta(email, "_settings", settings);
    res.json({ success: true });
  } catch (err) {
    console.error("[Profile] update-profile error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

profileRouter.post("/user/change-password", async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body as Record<string, string>;
    if (!email || !currentPassword || !newPassword) {
      res.status(400).json({ error: "email, currentPassword, and newPassword are required" });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: "New password must be at least 8 characters" });
      return;
    }
    const storedHash = getStoredPasswordHash(email);
    if (!storedHash) {
      res.status(404).json({ error: "No credentials found for this user" });
      return;
    }
    const valid = await verifyPassword(currentPassword, storedHash);
    if (!valid) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }
    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    saveUserCredentials(email, newHash);
    res.json({ success: true });
  } catch (err) {
    console.error("[Profile] change-password error:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
});

profileRouter.post("/user/update-notifications", (req, res) => {
  try {
    const { email, preferences } = req.body as { email?: string; preferences?: Record<string, boolean> };
    if (!email) { res.status(400).json({ error: "email is required" }); return; }
    if (!preferences) { res.status(400).json({ error: "preferences are required" }); return; }
    setUserProfileMeta(email, "_notificationPreferences", {
      ...preferences,
      updatedAt: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (err) {
    console.error("[Profile] update-notifications error:", err);
    res.status(500).json({ error: "Failed to update notification preferences" });
  }
});

profileRouter.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ error: "File too large. Maximum size is 5MB." });
      return;
    }
    res.status(400).json({ error: err.message });
    return;
  }
  if (err.message?.includes("Only .jpg")) {
    res.status(400).json({ error: err.message });
    return;
  }
  console.error("[Profile] Unexpected error:", err);
  res.status(500).json({ error: "Internal server error" });
});

export default profileRouter;
