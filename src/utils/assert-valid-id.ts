import mongoose from "mongoose";
import { AppError } from "../middleware/error-handler";
import { StatusCodes } from "http-status-codes";

export const assertValidId = (id: string) => {
  if (!mongoose.isObjectIdOrHexString(id)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid user ID");
  }
};