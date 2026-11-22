import { apiFetch } from "@/lib/api/client";

export interface JobSchedule {
  dayOfWeek: number | null;
  hour: number;
  minute: number;
}

export interface ScheduledRun {
  jobId: string;
  runAt: string;
}

export interface ManagedJob {
  id: string;
  name: string;
  description: string;
  isWeekly: boolean;
  cron: string | null;
  schedule: JobSchedule | null;
  nextRun: string | null;
  lastRun: string | null;
  lastState: string | null;
  scheduledRuns: ScheduledRun[];
}

export const listManagedJobs = (token: string) =>
  apiFetch<ManagedJob[]>("/admin/jobs", { token, cache: "no-store" });

export const updateJobSchedule = (id: string, schedule: JobSchedule, token: string) =>
  apiFetch<ManagedJob>(`/admin/jobs/${id}/schedule`, { method: "PUT", token, body: schedule });

export const runJobNow = (id: string, onlyMe: boolean, token: string) =>
  apiFetch<{ message: string }>(`/admin/jobs/${id}/run`, { method: "POST", token, body: { onlyMe } });

/** `runAt` là giờ Việt Nam dạng `yyyy-MM-ddTHH:mm` (đúng giá trị của input datetime-local). */
export const scheduleJobOnce = (id: string, runAt: string, token: string) =>
  apiFetch<ScheduledRun>(`/admin/jobs/${id}/schedule-once`, { method: "POST", token, body: { runAt } });

export const cancelScheduledRun = (id: string, jobId: string, token: string) =>
  apiFetch<void>(`/admin/jobs/${id}/scheduled/${encodeURIComponent(jobId)}`, { method: "DELETE", token });
