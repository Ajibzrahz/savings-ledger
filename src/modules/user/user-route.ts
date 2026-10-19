import { Router } from "express";
import validate from "../../middleware/validate-resource";
import { updateUserSchema } from "./user-schema";
import requireUser from "../../middleware/require-user";
import { getUserHandler, updateUserHandler } from "./user-controller";
import deserializeUser from "../../middleware/deserializeUser";

const router = Router();

router.get("/:id", getUserHandler);
router.patch(
  "/:id",
  deserializeUser,
  requireUser,
  validate(updateUserSchema),
  updateUserHandler,
);

export default router;
