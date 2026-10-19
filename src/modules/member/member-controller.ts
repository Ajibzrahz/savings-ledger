import { Request, Response } from "express";
import { AddMemberInput } from "./member-schema";
import * as memberService from "./member-service";
import { StatusCodes } from "http-status-codes";

export const addMemberHandler = async (
  req: Request<AddMemberInput["params"], {}, AddMemberInput["body"]>,
  res: Response,
) => {
  const member = await memberService.addMember(
    req.params.groupId,
    res.locals.user._id,
    req.body,
  );

  res.status(StatusCodes.CREATED).json(member);
};
