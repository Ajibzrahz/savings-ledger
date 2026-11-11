import { Router } from "express";
import validate from "../../middleware/validate-resource";
import { updateUserSchema } from "./user-schema";
import requireUser from "../../middleware/require-user";
import { getMeHandler, updateMeHandler } from "./user-controller";
import deserializeUser from "../../middleware/deserializeUser";

const router = Router();

router.get("/me", deserializeUser, requireUser, getMeHandler);
router.patch(
  "/me",
  deserializeUser,
  requireUser,
  validate(updateUserSchema),
  updateMeHandler,
);
export default router;
