import { Router } from "express";
import deserializeUser from "../../middleware/deserializeUser";
import validate from "../../middleware/validate-resource";
import {
  createGroupHandler,
  deleteGroupHandler,
  getGroupHandler,
  updateGroupHandler,
} from "./group-controller";
import { createGroupSchema, updateGroupSchema } from "./group-schema";
import requireUser from "../../middleware/require-user";
import { addMemberSchema } from "../member/member-schema";
import { addMemberHandler } from "../member/member-controller";

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

//add member
router.post(
  "/:groupId/members",
  deserializeUser,
  requireUser,
  validate(addMemberSchema),
  addMemberHandler,
);
export default router;
