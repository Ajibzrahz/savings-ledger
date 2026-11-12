import mongoose from "mongoose";
import { AppError } from "../app-error";
import { StatusCodes } from "http-status-codes";

export const assertValidId = (id: string) => {
  if (!mongoose.isObjectIdOrHexString(id)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid ID");
  }
};
