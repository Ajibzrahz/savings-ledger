import { Router } from "express";
import deserializeUser from "../../middleware/deserializeUser";
import validate from "../../middleware/validate-resource";
import requireUser from "../../middleware/require-user";
import { addMemberSchema, updateMemberSchema } from "./member-schema";
import { addMemberHandler, updateMemberHandler } from "./member-controller";
import { updateMember } from "./member-service";

const router = Router();

router.patch(
  "/:groupId/members/:memberId",
  deserializeUser,
  requireUser,
  validate(updateMemberSchema),
  updateMemberHandler,
);

export default router;
