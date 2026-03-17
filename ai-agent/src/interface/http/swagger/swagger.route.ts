import { Hono } from "hono";
import { swaggerUI } from "@hono/swagger-ui";
import { openApiSpec } from "./openapi-spec.js";

export function createSwaggerRoute() {
  const app = new Hono();

  // OpenAPI JSON endpoint
  app.get("/doc", (c) => c.json(openApiSpec));

  // Swagger UI
  app.get("/", swaggerUI({ url: "/api/swagger/doc" }));

  return app;
}
