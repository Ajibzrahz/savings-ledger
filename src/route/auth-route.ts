import { Router } from "express";
import validate from "../middleware/validate-resource";
import { createUserSchema } from "../schema/user-schema";
import {
  createUserHandler,
  loginHandler,
  logoutHandler,
} from "../controller/auth-controller";
import { createSessionSchema } from "../schema/session-schema";
import requireUser from "../middleware/require-user";
import deserializeUser from "../middleware/deserializeUser";

const router = Router();

router.post("/", validate(createUserSchema), createUserHandler);
router.post("/login", validate(createSessionSchema), loginHandler);
router.delete("/logout", deserializeUser, requireUser, logoutHandler);

export default router;
