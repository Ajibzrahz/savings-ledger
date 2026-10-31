import { StatusCodes } from "http-status-codes";
import { AppError } from "../../middleware/error-handler";
import Group from "./group-model";
import { CreateGroupInput, UpdateGroupInput } from "./group-schema";
import { assertValidId } from "../../common/utils/assert-valid-id";

export async function createGroup(input: CreateGroupInput, userId: string) {
  const group = await Group.create({ ...input, organizer: userId });

  return group;
}

export async function getGroup(id: string) {
  assertValidId(id);
  const group = await Group.findById(id);
  if (!group) {
    throw new AppError(StatusCodes.NOT_FOUND, "group does not exist");
  }
  return group;
}

export async function updateGroup(
  groupId: string,
  organizerId: string,
  update: UpdateGroupInput["body"],
) {
  assertValidId(groupId);
  const group = await Group.findOneAndUpdate(
    { _id: groupId, organizer: organizerId, status: "draft" },
    update,
    {
      returnDocument: "after",
      runValidators: true,
    },
  );
  if (group) return group;

  const mine = await Group.findOne({ _id: groupId, organizer: organizerId });
  if (!mine) {
    throw new AppError(StatusCodes.NOT_FOUND, "Group not found");
  }
  throw new AppError(
    StatusCodes.BAD_REQUEST,
    "Only draft group can be updated",
  );
}

export async function deleteGroup(groupId: string, organizerId: string) {
  assertValidId(groupId);

  const group = await Group.findOneAndDelete({
    _id: groupId,
    organizer: organizerId,
    status: "completed",
  });
  if (group) return;

  const mine = await Group.findOne({ _id: groupId, organizer: organizerId });
  if (!mine) {
    throw new AppError(StatusCodes.NOT_FOUND, "Group not found");
  }
  throw new AppError(
    StatusCodes.BAD_REQUEST,
    "Only completed group can be deleted",
  );
}

// export async function startGroup(groupId: string, organizerId: string) {
//   assertValidId(groupId);

//   const group = await Group.findOne({ _id: groupId, organizer: organizerId });
//   if (!group) throw new AppError(StatusCodes.NOT_FOUND, "Group not found");
//   if (group.status !== "draft") {
//     throw new AppError(StatusCodes.CONFLICT, "Group has already started");
//   }
//   if (!group.startDate) {
//     throw new AppError(StatusCodes.BAD_REQUEST, "Set a start date first");
//   }

//   const members = await Member.find({ group: groupId }).sort("payoutPosition");
//   if (members.length < 2) {
//     throw new AppError(StatusCodes.BAD_REQUEST, "Add at least 2 members first");
//   }
//   // also check positions run 1..n with no gaps

//   // generate one Cycle per member from group.startDate + frequency ...

//   // Flip status LAST, and only if it's still a draft (blocks double-start races)
//   const started = await Group.findOneAndUpdate(
//     { _id: groupId, status: "draft" },
//     { $set: { status: "active" } },
//     { returnDocument: "after" },
//   );
//   if (!started)
//     throw new AppError(StatusCodes.CONFLICT, "Group has already started");
//   return started;
// }
