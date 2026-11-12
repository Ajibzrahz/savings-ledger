import { AppError } from "../../common/app-error";
import Group from "../group/group-model";
import Member from "./member-model";
import { AddMemberInput, UpdateMemberInput } from "./member-schema";

const MAX_ATTEMPTS = 3;

const isDuplicateKey = (err: unknown) =>
  typeof err === "object" &&
  err !== null &&
  (err as { code?: number }).code === 11000;

async function getOwnedGroup(groupId: string, organizerId: string) {
  const group = await Group.findOne({ _id: groupId, organizer: organizerId });
  if (!group) throw new AppError(404, "Group not found");
  return group;
}

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

export async function listMembers(groupId: string, organizerId: string) {
  await getOwnedGroup(groupId, organizerId);
  return Member.find({ group: groupId }).sort({ payoutPosition: 1 }).lean();
}

export async function removeMember(
  groupId: string,
  memberId: string,
  organizerId: string,
) {
  const group = await getOwnedGroup(groupId, organizerId);
  if (group.status !== "draft")
    throw new AppError(409, "Members can't be removed after the group starts");

  const removed = await Member.findOneAndDelete({
    _id: memberId,
    group: groupId,
  });
  if (!removed) throw new AppError(404, "Member not found");

  // Close the gap so positions stay 1..n. Shift one at a time, lowest first,
  // so the unique (group, payoutPosition) index is never violated.
  const later = await Member.find({
    group: groupId,
    payoutPosition: { $gt: removed.payoutPosition },
  })
    .sort({ payoutPosition: 1 })
    .select("_id")
    .lean();

  if (later.length > 0) {
    await Member.bulkWrite(
      later.map((m) => ({
        updateOne: {
          filter: { _id: m._id },
          update: { $inc: { payoutPosition: -1 } },
        },
      })),
      { ordered: true },
    );
  }
}

export async function reorderMembers(
  groupId: string,
  organizerId: string,
  memberIds: string[],
) {
  const group = await getOwnedGroup(groupId, organizerId);
  if (group.status !== "draft")
    throw new AppError(
      409,
      "The payout order can't change after the group starts",
    );

  const members = await Member.find({ group: groupId }).select("_id").lean();
  const existing = new Set(members.map((m) => String(m._id)));
  const matches =
    memberIds.length === existing.size &&
    memberIds.every((id) => existing.has(id));
  if (!matches)
    throw new AppError(
      400,
      "memberIds must list every member of the group exactly once",
    );

  // Two passes, because the unique index forbids two members sharing a position
  // even for a moment. Pass 1 parks everyone on unique negative positions,
  // pass 2 assigns the final ones.
  const toOps = (position: (i: number) => number) =>
    memberIds.map((id, i) => ({
      updateOne: {
        filter: { _id: id, group: groupId },
        update: { $set: { payoutPosition: position(i) } },
      },
    }));

  await Member.bulkWrite(toOps((i) => -(i + 1)));
  await Member.bulkWrite(toOps((i) => i + 1));

  return Member.find({ group: groupId }).sort({ payoutPosition: 1 }).lean();
}
