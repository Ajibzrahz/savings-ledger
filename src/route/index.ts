import { Router } from "express";
import userRouter from "./auth-route";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
  });
});

router.use("/auth", userRouter)

export default router;