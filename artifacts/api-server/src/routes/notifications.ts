import { Router } from "express";
import {
  getNotifications,
  markNotificationsRead,
  markAllNotificationsRead,
} from "../lib/userDataStore.js";
import { userDataLimit } from "../middleware/security.js";

const notificationsRouter = Router();

notificationsRouter.get("/notifications", userDataLimit, (req, res) => {
  const email = req.query["email"] as string | undefined;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Valid email is required" });
    return;
  }
  const notifications = getNotifications(email);
  const unreadCount = (notifications as Array<Record<string, unknown>>).filter(
    (n) => !n["read"]
  ).length;
  res.json({ notifications, unreadCount });
});

notificationsRouter.post("/notifications/read", userDataLimit, (req, res) => {
  const { email, ids } = req.body as { email?: string; ids?: string[] };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Valid email is required" });
    return;
  }
  if (ids && ids.length > 0) {
    markNotificationsRead(email, ids);
  } else {
    markAllNotificationsRead(email);
  }
  res.json({ success: true });
});

export default notificationsRouter;
