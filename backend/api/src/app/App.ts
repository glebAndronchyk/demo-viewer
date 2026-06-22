import { Elysia } from "elysia";
import openapi from "@elysiajs/openapi";
import {
  UnauthorizedError,
  ForbiddenError,
  ResourceNotFoundError,
  BadRequestError,
  ConflictError,
  ServiceUnavailableError,
} from "../lib/errors/AppErrors";
import {
  DomainNotFoundError,
  DomainConflictError,
  DomainUnavailableError,
  DomainForbiddenError,
} from "@demo-viewer/domain/src/lib/errors/DomainErrors";
import { EnvConfiguration } from "../configuration/EnvConfiguration";
import serverTiming from "@elysiajs/server-timing";
import { cors } from "@elysia/cors";
import { join } from "node:path";
import { existsSync } from "node:fs";

export class App {
  constructor(config: EnvConfiguration) {
    return new Elysia()
      .use(openapi())
      .use(serverTiming())
      .use(cors())
      .onRequest(({ request }) => {
        if (config.debug) {
          const url = new URL(request.url);
          console.log(
            `[API][${new Date().toISOString()}] ${request.method} ${url.pathname}${url.search}`,
          );
        }
      })
      .error({
        UNAUTHORIZED: UnauthorizedError,
        FORBIDDEN: ForbiddenError,
        RESOURCE_NOT_FOUND: ResourceNotFoundError,
        BAD_REQUEST: BadRequestError,
        CONFLICT: ConflictError,
        SERVICE_UNAVAILABLE: ServiceUnavailableError,
      })
      .onError({ as: "global" }, ({ error, set, request, code }) => {
        // Static file serving / SPA fallback for unmatched routes
        if (code === "NOT_FOUND" && config.staticAssetsPath) {
          const url = new URL(request.url);
          const filePath = join(config.staticAssetsPath, url.pathname);
          if (existsSync(filePath) && !filePath.endsWith("/")) {
            const ext = filePath.split(".").pop() ?? "";
            const mime: Record<string, string> = {
              js: "application/javascript",
              css: "text/css",
              html: "text/html",
              svg: "image/svg+xml",
              png: "image/png",
              jpg: "image/jpeg",
              jpeg: "image/jpeg",
              ico: "image/x-icon",
              woff: "font/woff",
              woff2: "font/woff2",
              json: "application/json",
              webp: "image/webp",
            };
            return new Response(Bun.file(filePath), {
              headers: { "Content-Type": mime[ext] ?? "application/octet-stream" },
            });
          }
          return new Response(Bun.file(join(config.staticAssetsPath, "index.html")), {
            headers: { "Content-Type": "text/html" },
          });
        }

        // AppErrors — carry their own HTTP status
        if ("status" in error && typeof error.status === "number") {
          set.status = error.status;
          return {
            data: null,
            error: { message: error.message, code: error.name.toUpperCase() },
            isSuccess: false,
          };
        }

        // DomainErrors — map to HTTP status codes
        if (error instanceof DomainNotFoundError) {
          set.status = 404;
          return {
            data: null,
            error: { message: error.message, code: "NOT_FOUND" },
            isSuccess: false,
          };
        }
        if (error instanceof DomainConflictError) {
          set.status = 409;
          return {
            data: null,
            error: { message: error.message, code: "CONFLICT" },
            isSuccess: false,
          };
        }
        if (error instanceof DomainUnavailableError) {
          set.status = 503;
          return {
            data: null,
            error: { message: error.message, code: "SERVICE_UNAVAILABLE" },
            isSuccess: false,
          };
        }
        if (error instanceof DomainForbiddenError) {
          set.status = 403;
          return {
            data: null,
            error: { message: error.message, code: "FORBIDDEN" },
            isSuccess: false,
          };
        }

        // Elysia built-ins
        const err = error instanceof Error ? error : null;
        if (err?.name === "ValidationError") {
          set.status = 422;
          return {
            data: null,
            error: { message: err.message, code: "VALIDATION_ERROR" },
            isSuccess: false,
          };
        }
        if (err?.name === "NotFoundError") {
          set.status = 404;
          return {
            data: null,
            error: { message: err.message, code: "NOT_FOUND" },
            isSuccess: false,
          };
        }
        if (err?.name === "ParseError") {
          set.status = 400;
          return {
            data: null,
            error: { message: err.message, code: "PARSE_ERROR" },
            isSuccess: false,
          };
        }

        // Catch-all
        console.error("[App] Unhandled error:", error, err?.stack);
        set.status = 500;
        return {
          data: null,
          error: {
            message: "Internal server error",
            code: "INTERNAL_SERVER_ERROR",
          },
          isSuccess: false,
        };
      })
      .get(
        "/health",
        () => ({
          data: { status: "up" },
          error: null,
          isSuccess: true,
        }),
        { detail: { tags: ["health"] } },
      );
  }

  static getTypedConstructor() {
    return App as never as typeof Elysia;
  }
}
