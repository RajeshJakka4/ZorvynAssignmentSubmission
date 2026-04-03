import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({
    error: {
      message: "Route not found"
    }
  });
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        message: error.message,
        details: error.details ?? null
      }
    });
    return;
  }

  console.error(error);
  res.status(500).json({
    error: {
      message: "Internal server error"
    }
  });
}
