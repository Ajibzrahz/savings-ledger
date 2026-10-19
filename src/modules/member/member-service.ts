import { AppError } from "../../middleware/error-handler";
import Group from "../group/group-model";
import Member from "./member-model";
import { AddMemberInput } from "./member-schema";

export async function addMember(groupId: string, organizerId: string, input: AddMemberInput["body"]) {
  const group = await Group.findOne({ _id: groupId, organizer: organizerId });
  if (!group) throw new AppError(404, "Group not found");
  if (group.status !== "draft") throw new AppError(409, "Members can't be added after the group starts");

  const count = await Member.countDocuments({ group: groupId });
  return Member.create({ ...input, group: groupId, payoutPosition: count + 1 });
}