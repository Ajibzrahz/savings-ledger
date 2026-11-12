import { Request, Response } from "express";
import { AddMemberInput, UpdateMemberInput } from "./member-schema";
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
export const updateMemberHandler = async (
  req: Request<UpdateMemberInput["params"], {}, UpdateMemberInput["body"]>,
  res: Response,
) => {
  const member = await memberService.updateMember(
    req.params.groupId,
    req.params.memberId,
    res.locals.user._id,
    req.body,
  );

  res.status(StatusCodes.CREATED).json(member);
};

export const getMemberHandler = async (req: Request, res: Response) => {
  const member = await memberService.getMember(
    req.params.groupId.toString(),
    req.params.memberId.toString(),
  );

  res.status(StatusCodes.OK).json(member)
};
