import { NextResponse } from "next/server";
import { AppError } from "./errors";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Creates a standardized JSON response body for success.
 */
export function successResponse<T>(
  data: T,
  meta?: Record<string, unknown>
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    meta,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a standardized JSON response body for errors.
 */
export function errorResponse(
  message: string,
  code = "INTERNAL_SERVER_ERROR",
  details?: unknown
): ApiErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a standardized JSON success response.
 */
export function apiSuccess<T>(
  data: T,
  meta?: Record<string, unknown>,
  status = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    successResponse(data, meta),
    { status }
  );
}

/**
 * Creates a standardized JSON error response from an error or custom parameters.
 */
export function apiError(
  error: unknown,
  fallbackMessage = "An unexpected error occurred"
): NextResponse<ApiErrorResponse> {
  const timestamp = new Date().toISOString();

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        timestamp,
      },
      { status: error.statusCode }
    );
  }

  const message = error instanceof Error ? error.message : fallbackMessage;

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message,
      },
      timestamp,
    },
    { status: 500 }
  );
}
