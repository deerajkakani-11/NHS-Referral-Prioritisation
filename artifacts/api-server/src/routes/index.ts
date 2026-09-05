import { Router, type IRouter } from "express";
import healthRouter from "./health";
import referralsRouter from "./referrals";

const router: IRouter = Router();

router.use(healthRouter);
router.use(referralsRouter);

export default router;
