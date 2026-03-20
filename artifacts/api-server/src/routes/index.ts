import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import signupRouter from "./signup.js";
import uploadRouter from "./upload.js";
import ingestRouter from "./ingest.js";
import analyticsRouter from "./analytics.js";
import trackingScriptRouter from "./trackingScript.js";
import trackingRouter from "./tracking.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(signupRouter);
router.use(uploadRouter);
router.use(ingestRouter);
router.use(analyticsRouter);
router.use(trackingScriptRouter);
router.use(trackingRouter);

export default router;
