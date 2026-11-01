/**
 * Định dạng dữ liệu công thức để hiển thị (tiếng Việt).
 */

/** 45 → "45 phút", 75 → "1 giờ 15 phút", 120 → "2 giờ". */
export function formatMinutes(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0 phút";

  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  if (hours === 0) return `${rest} phút`;
  return rest === 0 ? `${hours} giờ` : `${hours} giờ ${rest} phút`;
}

/** Tổng thời gian chuẩn bị + nấu. */
export function formatTotalTime(prepTimeMinutes: number, cookTimeMinutes: number): string {
  return formatMinutes(prepTimeMinutes + cookTimeMinutes);
}

const dateFormatter = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

/** "2026-10-05T06:20:03+00:00" → "05/10/2026"; null → "—". */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}
