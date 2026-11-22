"use client";

import { CalendarClock, CircleAlert, CircleCheck, Mail, Play, Save, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  cancelScheduledRun, listManagedJobs, runJobNow, scheduleJobOnce, updateJobSchedule,
  type ManagedJob,
} from "@/lib/api/admin-jobs";
import { getErrorMessage, getFieldErrors } from "@/lib/errors";

const WEEKDAYS = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
const pad = (value: number) => String(value).padStart(2, "0");

/** Hiển thị mốc thời gian theo giờ Việt Nam bất kể múi giờ của trình duyệt. */
function formatVietnam(iso: string | null) {
  if (!iso) return "Chưa có";
  return new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", weekday: "short", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Giá trị mặc định cho input datetime-local: 2 phút nữa theo giờ Việt Nam. */
function defaultRunAt() {
  const soon = new Date(Date.now() + 2 * 60_000 + 7 * 3_600_000);
  return soon.toISOString().slice(0, 16);
}

export function JobsPanel({ initialJobs }: { initialJobs: ManagedJob[] }) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [jobs, setJobs] = useState(initialJobs);

  async function refresh() {
    if (!token) return;
    try {
      setJobs(await listManagedJobs(token));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="space-y-5">
      {jobs.map((job) => <JobCard key={job.id} job={job} token={token} onChange={refresh} />)}
      <p className="text-xs leading-6 text-muted-foreground">
        Email trong môi trường dev được giữ ở Mailhog (cổng 8025). Lịch sử chạy chi tiết xem ở Hangfire Dashboard tại cổng API (<code>/hangfire</code>, cần tài khoản Hangfire).
      </p>
    </div>
  );
}

function JobCard({ job, token, onChange }: { job: ManagedJob; token?: string; onChange: () => Promise<void> }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [day, setDay] = useState(job.schedule?.dayOfWeek ?? 1);
  const [time, setTime] = useState(job.schedule ? `${pad(job.schedule.hour)}:${pad(job.schedule.minute)}` : "07:00");
  const [runAt, setRunAt] = useState(defaultRunAt);
  const isNewsletter = job.id === "weekly-newsletter";

  async function act(name: string, task: () => Promise<string | void>) {
    if (!token || busy) return;
    setBusy(name);
    try {
      const message = await task();
      if (message) toast.success(message);
      await onChange();
    } catch (error) {
      const fields = getFieldErrors(error);
      toast.error(fields.runAt ?? fields.hour ?? fields.dayOfWeek ?? getErrorMessage(error));
    } finally {
      setBusy(null);
    }
  }

  const scheduleSummary = job.schedule
    ? `${job.isWeekly && job.schedule.dayOfWeek !== null ? `${WEEKDAYS[job.schedule.dayOfWeek]} hằng tuần` : "Hằng ngày"} lúc ${pad(job.schedule.hour)}:${pad(job.schedule.minute)}`
    : job.cron ? `Lịch tùy chỉnh (${job.cron})` : "Chưa có lịch lặp";

  return (
    <article className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">{isNewsletter ? <Mail className="size-5" /> : <CalendarClock className="size-5" />}</span>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-foreground">{job.name}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{job.description}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {isNewsletter && (
            <Button variant="outline" size="sm" disabled={!token || busy !== null} onClick={() => act("me", () => runJobNow(job.id, true, token!).then((r) => r.message))}>
              <Mail />{busy === "me" ? "Đang gửi..." : "Gửi thử cho tôi"}
            </Button>
          )}
          <Button size="sm" disabled={!token || busy !== null} onClick={() => act("run", () => runJobNow(job.id, false, token!).then((r) => r.message))}>
            <Play />{busy === "run" ? "Đang chạy..." : "Chạy ngay"}
          </Button>
        </div>
      </header>

      <dl className="mt-6 grid gap-4 rounded-xl bg-muted/60 p-4 text-sm sm:grid-cols-3">
        <div><dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Lịch lặp</dt><dd className="mt-1 font-semibold text-foreground">{scheduleSummary}</dd></div>
        <div><dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Lần chạy kế tiếp</dt><dd className="mt-1 font-semibold text-foreground">{formatVietnam(job.nextRun)}</dd></div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Lần chạy gần nhất</dt>
          <dd className="mt-1 flex items-center gap-1.5 font-semibold text-foreground">
            {job.lastState === "Succeeded" && <CircleCheck className="size-4 text-primary" />}
            {job.lastState === "Failed" && <CircleAlert className="size-4 text-destructive" />}
            {formatVietnam(job.lastRun)}
          </dd>
        </div>
      </dl>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const [hour, minute] = time.split(":").map(Number);
            void act("schedule", async () => {
              await updateJobSchedule(job.id, { dayOfWeek: job.isWeekly ? day : null, hour, minute }, token!);
              return "Đã lưu lịch lặp mới.";
            });
          }}
        >
          <h3 className="text-sm font-bold text-foreground">Đổi lịch lặp</h3>
          <div className="flex flex-wrap items-end gap-3">
            {job.isWeekly && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Thứ</span>
                <select className="form-input w-40" value={day} onChange={(event) => setDay(Number(event.target.value))}>
                  {[1, 2, 3, 4, 5, 6, 0].map((value) => <option key={value} value={value}>{WEEKDAYS[value]}</option>)}
                </select>
              </label>
            )}
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Giờ (VN)</span>
              <input className="form-input w-32" type="time" required value={time} onChange={(event) => setTime(event.target.value)} />
            </label>
            <Button type="submit" variant="outline" disabled={!token || busy !== null}><Save />{busy === "schedule" ? "Đang lưu..." : "Lưu lịch"}</Button>
          </div>
        </form>

        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void act("once", async () => {
              await scheduleJobOnce(job.id, runAt, token!);
              return "Đã hẹn giờ chạy một lần.";
            });
          }}
        >
          <h3 className="text-sm font-bold text-foreground">Hẹn giờ chạy một lần</h3>
          <div className="flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Thời điểm (giờ VN)</span>
              <input className="form-input w-56" type="datetime-local" required value={runAt} onChange={(event) => setRunAt(event.target.value)} />
            </label>
            <Button type="submit" variant="outline" disabled={!token || busy !== null}><CalendarClock />{busy === "once" ? "Đang hẹn..." : "Hẹn giờ"}</Button>
          </div>
        </form>
      </div>

      {job.scheduledRuns.length > 0 && (
        <div className="mt-6 border-t border-border pt-5">
          <h3 className="text-sm font-bold text-foreground">Đã hẹn giờ ({job.scheduledRuns.length})</h3>
          <ul className="mt-3 space-y-2">
            {job.scheduledRuns.map((run) => (
              <li key={run.jobId} className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-2.5 text-sm">
                <span className="font-semibold text-foreground">{formatVietnam(run.runAt)}</span>
                <Button variant="ghost" size="sm" disabled={!token || busy !== null} onClick={() => act(`cancel-${run.jobId}`, async () => { await cancelScheduledRun(job.id, run.jobId, token!); return "Đã hủy lần hẹn giờ."; })}>
                  <X />Hủy
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
