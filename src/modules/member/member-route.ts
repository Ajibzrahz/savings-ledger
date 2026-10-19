import { Router } from "express";
import deserializeUser from "../../middleware/deserializeUser";
import validate from "../../middleware/validate-resource";
import requireUser from "../../middleware/require-user";
import { addMemberSchema } from "./member-schema";
import { addMemberHandler } from "./member-controller";

const router = Router();

router.post(
  "/:groupId",
  deserializeUser,
  requireUser,
  validate(addMemberSchema),
  addMemberHandler,
);

export default router;
