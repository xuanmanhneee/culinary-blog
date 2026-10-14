import type { DefaultSession } from "next-auth";

import type { Role } from "@/lib/types/auth";

// Lưu ý: KHÔNG augment "next-auth/jwt" vì file đó chỉ `export * from "@auth/core/jwt"`,
// interface JWT sẽ không merge. Các field backend nằm trong JWT được đọc qua BackendSessionToken
// trong src/auth.ts.
declare module "next-auth" {
  /** User do Credentials provider trả về (đã kèm token và role của backend). */
  interface User {
    accessToken: string;
    refreshToken: string;
    roles: Role[];
  }

  /** Session đọc được ở server (`auth()`) và client (`useSession`). */
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      roles: Role[];
    } & DefaultSession["user"];
  }
}
