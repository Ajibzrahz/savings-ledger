import { Request, Response } from "express";
import * as userService from "./user-service";
import { StatusCodes } from "http-status-codes";

export const getUserHandler = async (req: Request, res: Response) => {
  const user = await userService.getUser(String(req.params.id));

  return res.status(StatusCodes.OK).json({ user });
};

export const updateUserHandler = async (req: Request, res: Response) => {
  const user = await userService.updateUser(String(req.params.id), req.body);

  return res.status(StatusCodes.OK).json({ user });
};
