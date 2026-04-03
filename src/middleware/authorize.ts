import { NextFunction, Request, Response } from "express";
import { UserRole } from "../types";
import { ForbiddenError, UnauthorizedError } from "../utils/errors";

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const currentUser = req.currentUser;
    if (!currentUser) {
      next(new UnauthorizedError("Authentication is required"));
      return;
    }

    if (!roles.includes(currentUser.role)) {
      next(new ForbiddenError(`Role ${currentUser.role} cannot access this resource`));
      return;
    }

    next();
  };
}
