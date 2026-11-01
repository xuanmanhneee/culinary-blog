"use client";

import { useSession } from "next-auth/react";

/**
 * Access token backend của người đang đăng nhập (Auth.js lưu trong session, xem src/auth.ts).
 * `isReady = false` khi session còn đang tải – các query cần token nên chờ (enabled: isReady).
 */
export function useAccessToken(): { token: string | undefined; isReady: boolean } {
  const { data, status } = useSession();
  return { token: data?.accessToken, isReady: status !== "loading" && Boolean(data?.accessToken) };
}
