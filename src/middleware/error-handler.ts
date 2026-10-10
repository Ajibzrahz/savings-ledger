import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import logger from "../utils/logger";

// Your own errors: throw new AppError(404, "Group not found")
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

type DuplicateKeyError = { code: 11000; keyValue: Record<string, unknown> };

const isDuplicateKeyError = (err: unknown): err is DuplicateKeyError =>
  typeof err === "object" &&
  err !== null &&
  (err as { code?: unknown }).code === 11000;

const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (res.headersSent) return next(err);

  let statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = "Something went wrong, try again later";

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = Object.values(err.errors)
      .map((item) => item.message)
      .join(", ");
  } else if (isDuplicateKeyError(err)) {
    statusCode = StatusCodes.CONFLICT;
    message = `Duplicate value entered for ${Object.keys(err.keyValue).join(", ")}, please choose another value`;
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = StatusCodes.NOT_FOUND;
    message = `No item found with id: ${err.value}`;
  } else {
    logger.error(err); // only unexpected errors get logged as errors
  }

  return res.status(statusCode).json({ message });
};

export default errorHandler;