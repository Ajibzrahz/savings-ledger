import {  Request, Response } from "express";
import * as userService from "../service/user-service";
import { omit } from "lodash";
import { createUserInput } from "../schema/user-schema";


export const createUserHandler = async (
  req: Request<{}, {}, createUserInput>,
  res: Response,
) => {
  const user = await userService.createUser(req.body);

  return res.status(201).json({
    message: "user created",
    user: omit(user.toJSON(), ["password"]),
  });

};
