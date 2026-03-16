import pino from "pino";
import { config } from "./config.js";

export const logger = pino({
  level: config.NODE_ENV === "development" ? "debug" : "info",
});

export const createChildLogger = (bindings: Record<string, unknown>) =>
  logger.child(bindings);
