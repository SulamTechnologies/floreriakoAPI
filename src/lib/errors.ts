import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ZodError } from "zod/v4";
import { applyCors } from "./cors";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "INTERNAL_ERROR"
  | "INSUFFICIENT_STOCK"
  | "PAYMENT_ERROR";

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    public override readonly message: string,
    public readonly statusCode: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }

  static unauthorized(message = "No autorizado") {
    return new ApiError("UNAUTHORIZED", message, 401);
  }

  static forbidden(message = "Acceso denegado") {
    return new ApiError("FORBIDDEN", message, 403);
  }

  static notFound(resource = "Recurso") {
    return new ApiError("NOT_FOUND", `${resource} no encontrado`, 404);
  }

  static conflict(message: string) {
    return new ApiError("CONFLICT", message, 409);
  }

  static insufficientStock(productName: string) {
    return new ApiError("INSUFFICIENT_STOCK", `Stock insuficiente para: ${productName}`, 409);
  }

  static internal(message = "Error interno del servidor") {
    return new ApiError("INTERNAL_ERROR", message, 500);
  }
}

function toResponse(error: ApiError) {
  return applyCors(
    NextResponse.json(
      { error: { code: error.code, message: error.message, details: error.details } },
      { status: error.statusCode },
    ),
  );
}

type RouteHandler = (req: NextRequest, ctx?: unknown) => Promise<NextResponse>;

export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    try {
      const response = await handler(req, ctx);
      return applyCors(response);
    } catch (err) {
      if (err instanceof ApiError) {
        return toResponse(err);
      }

      if (err instanceof ZodError) {
        return applyCors(
          NextResponse.json(
            {
              error: { code: "VALIDATION_ERROR", message: "Datos inválidos", details: err.issues },
            },
            { status: 400 },
          ),
        );
      }

      console.error("[unhandled error]", err);
      return toResponse(ApiError.internal());
    }
  };
}
