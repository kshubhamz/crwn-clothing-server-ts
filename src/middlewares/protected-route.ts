import { ClientErrorResponse } from "@kz-ts/express-common";
import { NextFunction, Request, Response } from "express";

export const ProtectedRoute = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user) {
    next();
    return;
  }
  throw ClientErrorResponse.UnAuthorized("Not Authorized for this operation.");
};
