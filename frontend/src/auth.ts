import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { API_V1 } from "@/lib/config/env";
import type { AuthResponseDto, Role } from "@/lib/types/auth";

/** Các field của backend được gửi kèm trong JWT session của Auth.js. */
interface BackendSessionToken {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: number;
  roles?: Role[];
  error?: "RefreshAccessTokenError";
}

async function refreshAccessToken(token: BackendSessionToken & Record<string, unknown>) {
  if (!token.refreshToken) return { ...token, error: "RefreshAccessTokenError" as const };

  try {
    const response = await fetch(`${API_V1}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
      cache: "no-store",
    });

    if (!response.ok) throw new Error("Không thể làm mới phiên đăng nhập.");
    const result = (await response.json()) as AuthResponseDto;

    return {
      ...token,
      sub: result.user.id,
      name: result.user.fullName,
      email: result.user.email,
      picture: result.user.avatarUrl,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      accessTokenExpiresAt: new Date(result.expiresAt).getTime(),
      roles: result.user.roles,
      error: undefined,
    };
  } catch {
    return { ...token, error: "RefreshAccessTokenError" as const };
  }
}

/**
 * Cấu hình Auth.js v5 (`next-auth`) phía frontend.
 *
 * - Credentials provider: xác thực email/mật khẩu qua backend (FR-AUTH-002).
 * - Session dùng JWT của Auth.js; access/refresh token của backend được giữ trong đó
 *   (DESIGN_DECISIONS #18: API chỉ nhận refresh token qua body, không dùng cookie riêng).
 * - Google OAuth (FR-AUTH-003) sẽ thêm provider: frontend hoàn tất luồng PKCE rồi gửi
 *   `idToken` lên POST /api/v1/auth/google.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Email và mật khẩu",
      credentials: {
        action: { label: "Thao tác", type: "text" },
        fullName: { label: "Họ tên", type: "text" },
        userName: { label: "Tên đăng nhập", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials) {
        const action = credentials?.action === "register" ? "register" : "login";
        const fullName = typeof credentials?.fullName === "string" ? credentials.fullName : "";
        const userName = typeof credentials?.userName === "string" ? credentials.userName : "";
        const email = typeof credentials?.email === "string" ? credentials.email : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password || (action === "register" && (!fullName || !userName))) {
          return null;
        }

        const response = await fetch(`${API_V1}/auth/${action}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action === "register" ? { fullName, userName, email, password } : { email, password }),
          cache: "no-store",
        });

        // 401 (sai thông tin) và 423 (khóa tạm thời do lockout) đều coi là đăng nhập thất bại.
        if (!response.ok) {
          return null;
        }

        const result = (await response.json()) as AuthResponseDto;

        return {
          id: result.user.id,
          name: result.user.fullName,
          email: result.user.email,
          image: result.user.avatarUrl,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          accessTokenExpiresAt: new Date(result.expiresAt).getTime(),
          roles: result.user.roles,
        };
      },
    }),
  ],
  events: {
    async signOut(message) {
      if (!("token" in message) || !message.token) return;
      const backend = message.token as typeof message.token & Partial<BackendSessionToken>;
      if (!backend.accessToken || !backend.refreshToken) return;

      try {
        await fetch(`${API_V1}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${backend.accessToken}`,
          },
          body: JSON.stringify({ refreshToken: backend.refreshToken }),
          cache: "no-store",
        });
      } catch {
        // Cookie Auth.js vẫn cần được xoá dù backend tạm thời không phản hồi.
      }
    },
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // `user` chỉ có ở lần đăng nhập đầu tiên; các request sau token đã mang sẵn giá trị.
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpiresAt = user.accessTokenExpiresAt;
        token.roles = user.roles;
        return token;
      }

      if (trigger === "update" && session?.user) {
        token.name = session.user.name ?? token.name;
        token.picture = session.user.image ?? token.picture;
        token.roles = session.user.roles ?? token.roles;
      }

      const backend = token as typeof token & Partial<BackendSessionToken>;
      if (!backend.accessTokenExpiresAt || Date.now() < backend.accessTokenExpiresAt - 30_000) return token;
      return refreshAccessToken(backend);
    },
    session({ session, token }) {
      // JWT của Auth.js có index signature nên field tuỳ biến là `unknown`; ép về kiểu đã biết
      // để Session phía UI luôn có kiểu rõ ràng.
      const backend = token as typeof token & Partial<BackendSessionToken>;

      session.accessToken = backend.accessToken;
      session.error = backend.error;
      session.user.id = token.sub ?? "";
      session.user.roles = backend.roles ?? [];
      return session;
    },
  },
});
