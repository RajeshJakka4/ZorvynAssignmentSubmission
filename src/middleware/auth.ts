import { Database } from "better-sqlite3";
import { NextFunction, Request, Response } from "express";
import { getUserById } from "../services/userService";
import { NotFoundError, UnauthorizedError } from "../utils/errors";

declare global {
  namespace Express {
    interface Request {
      currentUser?: {
        id: number;
        name: string;
        email: string;
        role: "viewer" | "analyst" | "admin";
        status: "active" | "inactive";
      };
    }
  }
}

export function authenticate(db: Database) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (req.path === "/health") {
      next();
      return;
    }

    const rawUserId = req.header("x-user-id");
    if (!rawUserId) {
      next(new UnauthorizedError("Missing x-user-id header"));
      return;
    }

    const userId = Number(rawUserId);
    if (!Number.isInteger(userId) || userId <= 0) {
      next(new UnauthorizedError("x-user-id must be a valid numeric user id"));
      return;
    }

    let user;
    try {
      user = getUserById(db, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        next(new UnauthorizedError("Unknown x-user-id"));
        return;
      }

      next(error);
      return;
    }

    if (user.status !== "active") {
      next(new UnauthorizedError("Inactive users cannot access the API"));
      return;
    }

    req.currentUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    };
    next();
  };
}
