import { Router } from "express";
import validate from "../../middleware/validate-resource";
import { createUserSchema } from "../user/user-schema";
import {
  createUserHandler,
  loginHandler,
  logoutHandler,
} from "./auth-controller";
import { createSessionSchema } from "../session/session-schema";
import requireUser from "../../middleware/require-user";
import deserializeUser from "../../middleware/deserializeUser";

const router = Router();

router.post("/", validate(createUserSchema), createUserHandler);
router.post("/login", validate(createSessionSchema), loginHandler);
router.delete("/logout", deserializeUser, requireUser, logoutHandler);

export default router;
