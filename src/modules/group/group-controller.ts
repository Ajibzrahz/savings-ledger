import { Request, Response } from "express";
import { CreateGroupInput, UpdateGroupInput } from "./group-schema";
import * as groupService from "./group-service";
import { StatusCodes } from "http-status-codes";

export const createGroupHandler = async (
  req: Request<{}, {}, CreateGroupInput>,
  res: Response,
) => {
  const group = await groupService.createGroup(req.body, res.locals.user._id);

  res.status(StatusCodes.CREATED).json({ message: "group created", group });
};

export const getGroupHandler = async (req: Request, res: Response) => {
  const group = await groupService.getGroup(
    String(req.params.id),
    res.locals.user._id,
  );
  res.status(StatusCodes.OK).json({ group });
};

export const updateGroupHandler = async (
  req: Request<UpdateGroupInput["params"], {}, UpdateGroupInput>["body"],
  res: Response,
) => {
  const group = await groupService.updateGroup(
    req.params.groupId,
    res.locals.user._id,
    req.body,
  );
  return res.status(StatusCodes.OK).json({ group });
};

export const deleteGroupHandler = async (req: Request, res: Response) => {
  await groupService.deleteGroup(
    String(req.params.groupId),
    res.locals.user._id,
  );
  res.status(StatusCodes.NO_CONTENT).json();
};
