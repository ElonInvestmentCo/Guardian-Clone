import { Router } from "express";
import {
  getNotifications,
  markNotificationsRead,
  markAllNotificationsRead,
} from "../lib/userDataStore.js";
import { userDataLimit } from "../middleware/security.js";
import { validate, AuthCheckEmailSchema, NotificationReadSchema } from "../lib/validation.js";

const notificationsRouter = Router();

notificationsRouter.get("/notifications", userDataLimit, validate(AuthCheckEmailSchema), async (req, res) => {
  const { email } = (req as unknown as { validatedQuery: { email: string } }).validatedQuery;
  const notifications = await getNotifications(email);
  const unreadCount = (notifications as Array<Record<string, unknown>>).filter(
    (n) => !n["read"]
  ).length;
  res.json({ notifications, unreadCount });
});

notificationsRouter.post("/notifications/read", userDataLimit, validate(NotificationReadSchema), async (req, res) => {
  const { email, ids } = req.body as { email: string; ids?: string[] };
  if (ids && ids.length > 0) {
    await markNotificationsRead(email, ids);
  } else {
    await markAllNotificationsRead(email);
  }
  res.json({ success: true });
});

export default notificationsRouter;
