import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { API_V1 } from "@/lib/config/env";
import type { AuthResponseDto, Role } from "@/lib/types/auth";

/** Các field của backend được gửi kèm trong JWT session của Auth.js. */
interface BackendSessionToken {
  accessToken?: string;
  refreshToken?: string;
  roles?: Role[];
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
        email: { label: "Email", type: "email" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) {
          return null;
        }

        const response = await fetch(`${API_V1}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
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
          roles: result.user.roles,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      // `user` chỉ có ở lần đăng nhập đầu tiên; các request sau token đã mang sẵn giá trị.
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.roles = user.roles;
      }

      return token;
    },
    session({ session, token }) {
      // JWT của Auth.js có index signature nên field tuỳ biến là `unknown`; ép về kiểu đã biết
      // để Session phía UI luôn có kiểu rõ ràng.
      const backend = token as typeof token & Partial<BackendSessionToken>;

      session.accessToken = backend.accessToken;
      session.user.id = token.sub ?? "";
      session.user.roles = backend.roles ?? [];
      return session;
    },
  },
});
