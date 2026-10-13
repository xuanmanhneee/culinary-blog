/**
 * HTTP client dùng chung cho các trang gọi backend API (dashboard, form...).
 * Lỗi từ backend trả về RFC 7807 Problem Details; apiFetch ném ApiError mang đủ thông tin đó
 * để UI hiển thị theo mã lỗi (`type`, ví dụ RECIPE_FORBIDDEN) hoặc theo field (`errors`).
 */

export const API_URL = (
  (typeof window === "undefined" ? process.env.API_URL : undefined) ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");

/** RFC 7807 Problem Details do GlobalExceptionMiddleware của backend trả về. */
export interface ProblemDetails {
  type?: string | null;
  title?: string;
  status?: number;
  detail?: string | null;
  instance?: string;
  traceId?: string;
  /** Lỗi validation theo field: { "title": ["..."], "ingredients[0].name": ["..."] }. */
  errors?: Record<string, string[]>;
}

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

export async function apiFetchWithHeaders<T>(
  path: string,
  { body, token, headers, ...init }: ApiFetchOptions = {},
): Promise<ApiResponse<T>> {
  const requestHeaders = new Headers(headers);
  if (token) requestHeaders.set("Authorization", `Bearer ${token}`);

  let requestBody: BodyInit | undefined;
  if (body instanceof FormData) {
    requestBody = body;
  } else if (body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${path}`, { ...init, headers: requestHeaders, body: requestBody });

  if (!response.ok) {
    const problem = await response.json().catch(() => ({}) as ProblemDetails);
    throw new ApiError(response.status, { status: response.status, ...problem });
  }

  // 204 No Content (DELETE) không có body.
  const text = await response.text();
  return { data: (text ? JSON.parse(text) : undefined) as T, headers: response.headers };
}

export async function apiFetch<T>(path: string, options?: ApiFetchOptions): Promise<T> {
  return (await apiFetchWithHeaders<T>(path, options)).data;
}
