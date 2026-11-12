import { Router } from "express";
import deserializeUser from "../../middleware/deserializeUser";
import validate from "../../middleware/validate-resource";
import requireUser from "../../middleware/require-user";
import {
  listMembersSchema,
  removeMemberSchema,
  reorderMembersSchema,
  updateMemberSchema,
} from "./member-schema";
import {
  listMembersHandler,
  removeMemberHandler,
  reorderMembersHandler,
  updateMemberHandler,
} from "./member-controller";

const router = Router();

router.use(requireUser)

router.patch(
  "/:groupId/members/:memberId",
  validate(updateMemberSchema),
  updateMemberHandler,
);
router.get(
  "/:groupId",
  validate(listMembersSchema),
  listMembersHandler,
);
router.put(
  "/:groupId/order",
  validate(reorderMembersSchema),
  reorderMembersHandler,
);
router.delete(
  "/:groupId/:memberId",
  validate(removeMemberSchema),
  removeMemberHandler,
);

export default router;
