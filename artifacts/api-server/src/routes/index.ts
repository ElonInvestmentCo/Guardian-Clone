import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import signupRouter from "./signup.js";
import uploadRouter from "./upload.js";
import verifyRouter from "./verify.js";
import ingestRouter from "./ingest.js";
import analyticsRouter from "./analytics.js";
import trackingScriptRouter from "./trackingScript.js";
import trackingRouter from "./tracking.js";
import adminRouter from "./admin.js";
import fraudRouter from "./fraud.js";
import notificationsRouter from "./notifications.js";
import marketRouter from "./market.js";
import profileRouter from "./profile.js";
import twoFARouter from "./twofa.js";
import contactRouter from "./contact.js";
import aiRouter from "./ai/index.js";
import { isDatabaseAvailable } from "../lib/db.js";

const router: IRouter = Router();

router.use(healthRouter);

function requireDatabase(_req: Request, res: Response, next: NextFunction): void {
  if (!isDatabaseAvailable()) {
    res.status(503).json({
      error: "Service temporarily unavailable",
      detail: "Database connection is not configured or failed to initialize.",
    });
    return;
  }
  next();
}

router.use(requireDatabase);
router.use(authRouter);
router.use(signupRouter);
router.use(uploadRouter);
router.use(verifyRouter);
router.use(ingestRouter);
router.use(analyticsRouter);
router.use(trackingScriptRouter);
router.use(trackingRouter);
router.use(adminRouter);
router.use(fraudRouter);
router.use(notificationsRouter);
router.use(marketRouter);
router.use(profileRouter);
router.use(twoFARouter);
router.use(contactRouter);
router.use(aiRouter);

export default router;
