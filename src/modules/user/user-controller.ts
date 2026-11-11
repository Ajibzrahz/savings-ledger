import { Request, Response } from "express";
import * as userService from "./user-service";
import { StatusCodes } from "http-status-codes";

export const getMeHandler = async (req: Request, res: Response) => {
  const user = await userService.getUser(res.locals.user._id);
  res.status(200).json({ user });
};

export const updateMeHandler = async (req: Request, res: Response) => {
  const user = await userService.updateUser(res.locals.user._id, req.body);
  res.status(200).json({ user });
};