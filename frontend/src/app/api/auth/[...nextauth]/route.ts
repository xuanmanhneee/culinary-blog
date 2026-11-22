import type { NextRequest } from "next/server";
import { handlers } from "@/auth";

/**
 * Toàn bộ endpoint nội bộ của Auth.js v5 (signin, callback, session, csrf...) nằm dưới
 * /api/auth/*, tách khỏi /api/v1 của backend để không lẫn với hợp đồng API.
 *
 * "Ghi nhớ tôi": Auth.js luôn đặt cookie phiên có hạn. Khi người dùng không tick ô này, ta bỏ
 * Expires/Max-Age khỏi cookie phiên để nó hết hạn khi đóng trình duyệt, và đánh dấu bằng cookie
 * `bn-session-only` để các lần Auth.js gia hạn cookie sau đó vẫn giữ nguyên kiểu phiên.
 */
const SESSION_ONLY_COOKIE = "bn-session-only";
const isSessionTokenCookie = (cookie: string) => /^(__Secure-)?authjs\.session-token(\.\d+)?=/.test(cookie);

async function readRememberChoice(request: NextRequest): Promise<boolean | null> {
  if (request.method !== "POST" || !request.nextUrl.pathname.endsWith("/callback/credentials")) return null;
  try {
    const form = await request.clone().formData();
    return form.get("remember") === "true";
  } catch {
    return null;
  }
}

async function withSessionPolicy(request: NextRequest, handler: (request: NextRequest) => Promise<Response>) {
  const choice = await readRememberChoice(request);
  const sessionOnly = choice === null ? request.cookies.has(SESSION_ONLY_COOKIE) : !choice;
  const response = await handler(request);

  const setCookies = response.headers.getSetCookie();
  const hasSessionCookie = setCookies.some(isSessionTokenCookie);
  if (!hasSessionCookie && choice === null) return response;

  const headers = new Headers(response.headers);
  headers.delete("set-cookie");
  let cleared = false;
  for (const cookie of setCookies) {
    const isSession = isSessionTokenCookie(cookie);
    const isDeletion = /^[^=]+=;/.test(cookie) || /max-age=0/i.test(cookie);
    if (isSession && isDeletion) cleared = true;
    headers.append(
      "set-cookie",
      sessionOnly && isSession && !isDeletion ? cookie.replace(/;\s*(expires|max-age)=[^;]*/gi, "") : cookie,
    );
  }

  const secure = request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
  const attributes = `Path=/; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
  if (choice !== null || cleared) {
    headers.append(
      "set-cookie",
      sessionOnly && !cleared ? `${SESSION_ONLY_COOKIE}=1; ${attributes}` : `${SESSION_ONLY_COOKIE}=; ${attributes}; Max-Age=0`,
    );
  }

  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export const GET = (request: NextRequest) => withSessionPolicy(request, handlers.GET);
export const POST = (request: NextRequest) => withSessionPolicy(request, handlers.POST);
