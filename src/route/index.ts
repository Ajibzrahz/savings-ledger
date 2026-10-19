import { Router } from "express";
import authRouter from "./auth-route";
import userRouter from "./user-route";
import groupRouter from "./group-route";

const router = Router();

router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/groups", groupRouter);

export default router;
