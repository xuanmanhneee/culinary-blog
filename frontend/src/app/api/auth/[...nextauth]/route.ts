import { handlers } from "@/auth";

/**
 * Toàn bộ endpoint nội bộ của Auth.js v5 (signin, callback, session, csrf...) nằm dưới
 * /api/auth/*, tách khỏi /api/v1 của backend để không lẫn với hợp đồng API.
 */
export const { GET, POST } = handlers;
