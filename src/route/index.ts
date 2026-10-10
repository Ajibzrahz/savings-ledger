import { Router } from "express";
import userRouter from "./user-route";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
  });
});

router.use("/users", userRouter)

export default router;