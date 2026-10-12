import { Request, Response } from "express";
import * as userService from "../service/auth-service";
import { omit } from "lodash";
import { createUserInput } from "../schema/user-schema";
import { validatePassword } from "../service/auth-service";
import { StatusCodes } from "http-status-codes";
import { createUserSession, updateSession } from "../service/session-service";
import { signJwt } from "../utils/jwt-utils";
import env from "../config/env";

export const createUserHandler = async (
  req: Request<{}, {}, createUserInput>,
  res: Response,
) => {
  const user = await userService.createUser(req.body);

  return res.status(201).json({
    message: "user created",
    user: omit(user.toJSON(), ["password"]),
  });
};

export const loginHandler = async (req: Request, res: Response) => {
  const user = await validatePassword(req.body);

  if (!user) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .send("invalid email or password");
  }

  const session = await createUserSession(
    user._id.toString(),
    req.get("user-agent") || "",
  );

  const accessToken = signJwt(
    { ...omit(user.toJSON(), ["password"]), session: session._id },
    env.accessTokenSecret,
    {
      expiresIn: env.accessTokenTtl,
    },
  );
  const refreshToken = signJwt(
    { ...omit(user.toJSON(), ["password"]), session: session._id },
    env.refreshTokenSecret,
    {
      expiresIn: env.refreshTokenTtl,
    },
  );

  res.cookie("accessToken", accessToken, {
    maxAge: env.accessTokenTtl * 1000,
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "strict",
  });

  res.cookie("refreshToken", refreshToken, {
    maxAge: env.refreshTokenTtl * 1000,
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "strict",
  });

  return res.status(StatusCodes.OK).send("Login successful");
};

export const logoutHandler = async (req: Request, res: Response) => {
  const sessionId = res.locals.user.session;

  await updateSession({ _id: sessionId }, { valid: false });

  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "strict",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "strict",
  });

  return res.status(StatusCodes.OK).json({
    status: "success",
  });
};
