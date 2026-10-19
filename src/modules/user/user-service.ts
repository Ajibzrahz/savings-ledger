import { StatusCodes } from "http-status-codes";
import userModel from "./user-model";
import { AppError } from "../../middleware/error-handler";
import { UpdateUserInput } from "./user-schema";
import { assertValidId } from "../../utils/assert-valid-id";


export async function getUser(id: string) {
  assertValidId(id);
  const user = await userModel.findById(id);

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "user not found");
  }
  return user;
}

export async function updateUser(id: string, update: UpdateUserInput) {
  assertValidId(id);
  const user = await userModel.findByIdAndUpdate(id, update, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "user not found");
  }
  return user;
}

