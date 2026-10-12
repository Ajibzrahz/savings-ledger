import jwt from "jsonwebtoken";
import env from "../config/env";

export const signJwt = (
  object: Object,
  secret: string,
  options?: jwt.SignOptions | undefined,
) => {
  return jwt.sign(object, secret, {
    ...(options && options),
    algorithm: "HS256",
  });
};

export const verifyJwt = (token: string, secret: string) => {
  try {
    const decoded = jwt.verify(token, secret);
    return {
      valid: true,
      expired: false,
      decoded,
    };
  } catch (error: any) {
    return {
      valid: false,
      expired: error.message === "jwt expired",
      decoded: null,
    };
  }
};
