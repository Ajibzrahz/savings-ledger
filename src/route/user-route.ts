import { Router } from "express";
import validate from "../middleware/validate-resource";
import { createUserSchema } from "../schema/user-schema";
import { createUserHandler } from "../controller/user-controller";

const router = Router();

router.post("/", validate(createUserSchema), createUserHandler);

export default router;
