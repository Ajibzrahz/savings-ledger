import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

const requireUser = (req: Request, res: Response, next: NextFunction) => {
  const user = res.locals.user;

  if (!user) {
    return res.sendStatus(StatusCodes.UNAUTHORIZED);
  }

  return next();
};

 export default requireUser