import { NextFunction, Request, Response } from "express";
import { environment } from "../environment";
import { ICookiePayload } from "../models/cookie-payload";
import { JWT } from "../utils/jwt.utils";

declare global {
  namespace Express {
    interface Request {
      user?: ICookiePayload;
    }
  }
}

export const CheckAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.session?.token) {
    const token = req.session.token as string;

    JWT.verifyJWT(token, environment.JWT_SECRET)
      .then((payload) => {
        req.user = payload as ICookiePayload;
      })
      .catch()
      .finally(() => next());
  } else {
    next();
  }
};
