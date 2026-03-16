import { Hono } from "hono";

export function createHealthRoute() {
  const app = new Hono();
  app.get("/", (c) => c.json({ status: "ok" }));
  return app;
}
