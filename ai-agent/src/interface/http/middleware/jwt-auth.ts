import { createMiddleware } from "hono/factory";
import { jwtVerify } from "jose";
import { config } from "../../../shared/config.js";
import { UnauthorizedError } from "../../../shared/errors.js";

type AuthVariables = {
  userId: string;
};

export const jwtAuth = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or invalid Authorization header");
  }

  const token = authHeader.slice(7);
  try {
    const secret = new TextEncoder().encode(config.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    if (!payload.sub) {
      throw new UnauthorizedError("Token missing sub claim");
    }

    c.set("userId", payload.sub);
    await next();
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError("Invalid or expired token");
  }
});
