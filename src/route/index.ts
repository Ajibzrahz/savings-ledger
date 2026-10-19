import { Router } from "express";
import authRouter from "../modules/user/auth-route";
import userRouter from "../modules/user/user-route";
import groupRouter from "../modules/group/group-route";
import memberRouter from "../modules/member/member-route";

const router = Router();

router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/groups", groupRouter);
router.use("/members", memberRouter);

export default router;
