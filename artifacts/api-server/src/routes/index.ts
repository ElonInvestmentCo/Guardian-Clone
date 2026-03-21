import { Router, type IRouter } from "express";
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

const router: IRouter = Router();

router.use(healthRouter);
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

export default router;
