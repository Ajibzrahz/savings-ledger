import { ZodError, type ZodObject } from "zod";
import type { Response, Request, NextFunction } from "express";

const validate =
  (schema: ZodObject) => (req: Request, res: Response, next: NextFunction) => {
    let parsed;
    try {
      parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }
      return next(error);
    }

    if (parsed.body !== undefined) req.body = parsed.body;
    next();
  };

export default validate;
