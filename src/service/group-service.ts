import { StatusCodes } from "http-status-codes";
import { AppError } from "../middleware/error-handler";
import Group from "../models/group-model";
import { CreateGroupInput, UpdateGroupInput } from "../schema/group-schema";
import { assertValidId } from "../utils/assert-valid-id";

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
