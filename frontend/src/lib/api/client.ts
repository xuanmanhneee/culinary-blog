/**
 * HTTP client dùng chung cho các trang gọi backend API (dashboard, form...).
 * Lỗi từ backend trả về RFC 7807 Problem Details; apiFetch ném ApiError mang đủ thông tin đó
 * để UI hiển thị theo mã lỗi (`type`, ví dụ RECIPE_FORBIDDEN) hoặc theo field (`errors`).
 */

import { API_URL, API_V1 } from "@/lib/config/env";
import type { ProblemDetails } from "@/lib/types/api";

export { API_URL };
export type { ProblemDetails };

export class ApiError extends Error {
  readonly status: number;
  readonly problem: ProblemDetails;

  constructor(status: number, problem: ProblemDetails) {
    super(problem.detail ?? problem.title ?? `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.problem = problem;
  }

  /** Mã lỗi ứng dụng (SRS Phụ lục B), ví dụ "RECIPE_SLUG_EXISTS". */
  get code(): string | undefined {
    return this.problem.type ?? undefined;
  }
}

/** Lỗi mạng/timeout khi request chưa nhận được HTTP response từ backend. */
export class ApiNetworkError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "ApiNetworkError";
    this.cause = cause;
  }
}

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  /** Object sẽ được JSON.stringify; FormData được gửi nguyên (multipart). */
  body?: unknown;
  /** Access token JWT, gửi qua header Authorization: Bearer. */
  token?: string | null;
}

export interface ApiResponse<T> {
  data: T;
  /** Header của response, ví dụ ETag (FR-RCP-004) hoặc Location (201 Created). */
  headers: Headers;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readProblemDetails(response: Response): Promise<ProblemDetails> {
  const problem: ProblemDetails = {
    status: response.status,
    title: response.statusText || "Request failed",
  };
  const body = await response.text();

  if (!body.trim()) {
    return problem;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch (parseError) {
    if (!(parseError instanceof SyntaxError)) {
      throw parseError;
    }
    problem.detail = body;
    return problem;
  }

  if (!isRecord(parsed)) {
    problem.detail = body;
    return problem;
  }

  if (typeof parsed.type === "string" || parsed.type === null) {
    problem.type = parsed.type;
  }
  if (typeof parsed.title === "string") {
    problem.title = parsed.title;
  }
  if (typeof parsed.detail === "string" || parsed.detail === null) {
    problem.detail = parsed.detail;
  }
  if (typeof parsed.instance === "string") {
    problem.instance = parsed.instance;
  }
  if (typeof parsed.traceId === "string") {
    problem.traceId = parsed.traceId;
  }
  if (isRecord(parsed.errors)) {
    const errors = Object.fromEntries(
      Object.entries(parsed.errors).flatMap(([field, messages]) => {
        if (!Array.isArray(messages)) {
          return [];
        }
        const strings = messages.filter((message): message is string => typeof message === "string");
        return strings.length > 0 ? [[field, strings]] : [];
      }),
    );
    if (Object.keys(errors).length > 0) {
      problem.errors = errors;
    }
  }

  return problem;
}

export async function apiFetchWithHeaders<T>(
  path: string,
  { body, token, headers, ...init }: ApiFetchOptions = {},
): Promise<ApiResponse<T>> {
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");
  if (token) requestHeaders.set("Authorization", `Bearer ${token}`);

  let requestBody: BodyInit | undefined;
  if (body instanceof FormData) {
    requestBody = body;
  } else if (body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  }
  let response: Response;
  try {
    // Các hàm apiFetch nhận path tương đối dưới `/api/v1` (ví dụ `/recipes`).
    response = await fetch(`${API_V1}${path}`, { ...init, headers: requestHeaders, body: requestBody });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiNetworkError("Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.", error);
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readProblemDetails(response));
  }

  // 204 No Content (DELETE) không có body.
  const responseText = await response.text();
  if (!responseText) {
    return { data: undefined as T, headers: response.headers };
  }

  try {
    return { data: JSON.parse(responseText) as T, headers: response.headers };
  } catch (parseError) {
    if (!(parseError instanceof SyntaxError)) throw parseError;
    return { data: responseText as T, headers: response.headers };
  }
}

export async function apiFetch<T>(path: string, options?: ApiFetchOptions): Promise<T> {
  return (await apiFetchWithHeaders<T>(path, options)).data;
}
