import type { ErrorHandler } from "hono";
import { AppError } from "../../../shared/errors.js";
import { logger } from "../../../shared/logger.js";

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error({ err }, "Unexpected error");
    } else {
      logger.warn({ err, code: err.code }, err.message);
    }
    return c.json(
      { error: { code: err.code, message: err.message } },
      err.statusCode as 400 | 401 | 403 | 404 | 500 | 502 | 503,
    );
  }

  logger.error({ err }, "Unhandled error");
  return c.json(
    { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
    500,
  );
};
