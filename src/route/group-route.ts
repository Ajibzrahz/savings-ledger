import { Router } from "express";
import deserializeUser from "../middleware/deserializeUser";
import validate from "../middleware/validate-resource";
import {
  createGroupHandler,
  deleteGroupHandler,
  getGroupHandler,
  updateGroupHandler,
} from "../controller/group-controller";
import { createGroupSchema, updateGroupSchema } from "../schema/group-schema";
import requireUser from "../middleware/require-user";

const router = Router();

router.post(
  "/",
  deserializeUser,
  requireUser,
  validate(createGroupSchema),
  createGroupHandler,
);
router.get("/:id", deserializeUser, requireUser, getGroupHandler);
router.patch(
  "/:groupId",
  deserializeUser,
  requireUser,
  validate(updateGroupSchema),
  updateGroupHandler,
);
router.delete("/:groupId", deserializeUser, requireUser, deleteGroupHandler);
export default router;
