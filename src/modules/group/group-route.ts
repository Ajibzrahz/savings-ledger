import { Router } from "express";
import deserializeUser from "../../middleware/deserializeUser";
import validate from "../../middleware/validate-resource";
import {
  createGroupHandler,
  deleteGroupHandler,
  getGroupHandler,
  updateGroupHandler,
} from "./group-controller";
import {
  createGroupSchema,
  groupIdSchema,
  updateGroupSchema,
} from "./group-schema";
import requireUser from "../../middleware/require-user";
import { addMemberSchema } from "../member/member-schema";
import { addMemberHandler } from "../member/member-controller";

const router = Router();

router.use(requireUser);

router.post("/", validate(createGroupSchema), createGroupHandler);
router.get("/:id", requireUser, getGroupHandler);
router.patch("/:groupId", validate(updateGroupSchema), updateGroupHandler);
router.delete("/:groupId", validate(groupIdSchema), deleteGroupHandler);

//add member
router.post("/:groupId/members", validate(addMemberSchema), addMemberHandler);
export default router;
