import { Request, Response } from "express";
import { AddMemberInput, ListMembersInput, RemoveMemberInput, ReorderMembersInput, UpdateMemberInput } from "./member-schema";
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

export const listMembersHandler = async (
  req: Request<ListMembersInput["params"]>,
  res: Response,
) => {
  const members = await memberService.listMembers(
    req.params.groupId,
    res.locals.user._id,
  );
  res.status(StatusCodes.OK).json({ members });
};

export const removeMemberHandler = async (
  req: Request<RemoveMemberInput["params"]>,
  res: Response,
) => {
  await memberService.removeMember(
    req.params.groupId,
    req.params.memberId,
    res.locals.user._id,
  );
  res.sendStatus(StatusCodes.NO_CONTENT);
};

export const reorderMembersHandler = async (
  req: Request<ReorderMembersInput["params"], {}, ReorderMembersInput["body"]>,
  res: Response,
) => {
  const members = await memberService.reorderMembers(
    req.params.groupId,
    res.locals.user._id,
    req.body.memberIds,
  );
  res.status(StatusCodes.OK).json({ members });
};