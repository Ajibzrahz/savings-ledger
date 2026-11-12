import { AppError } from "../../common/app-error";
import Group from "../group/group-model";
import Member from "./member-model";
import { AddMemberInput, UpdateMemberInput } from "./member-schema";

const MAX_ATTEMPTS = 3;

const isDuplicateKey = (err: unknown) =>
  typeof err === "object" &&
  err !== null &&
  (err as { code?: number }).code === 11000;

export async function addMember(
  groupId: string,
  organizerId: string,
  input: AddMemberInput["body"],
) {
  const group = await Group.findOne({ _id: groupId, organizer: organizerId });
  if (!group) throw new AppError(404, "Group not found");
  if (group.status !== "draft")
    throw new AppError(409, "Members can't be added after the group starts");

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const last = await Member.findOne({ group: groupId })
      .sort({ payoutPosition: -1 })
      .select("payoutPosition")
      .lean();
    const payoutPosition = (last?.payoutPosition ?? 0) + 1;

    try {
      return await Member.create({ ...input, group: groupId, payoutPosition });
    } catch (err) {
      if (isDuplicateKey(err) && attempt < MAX_ATTEMPTS) continue; // someone took it, try the next one
      throw err;
    }
  }

  throw new AppError(409, "Could not add the member, please try again");
}
export async function updateMember(
  groupId: string,
  memberId: string,
  organizerId: string,
  update: UpdateMemberInput["body"],
) {
  const member = await Member.exists({ _id: memberId, group: groupId });
  if (!member) throw new AppError(404, "Member does exist in this group");

  const group = await Group.findOne({ _id: groupId, organizer: organizerId });
  if (String(group?.organizer) !== organizerId)
    throw new AppError(403, "Not allowed to update member");

  const updated = await Member.findOneAndUpdate(
    { _id: memberId, group: groupId },
    update,
    { returnDocument: "after", runValidators: true },
  );
  return updated;
}
export async function getMember(groupId: string, memberId: string) {
  const member = await Member.findOne({ group: groupId, _id: memberId });

  if (!member) throw new AppError(404, "Member does exist in this group");

  return member;
}
