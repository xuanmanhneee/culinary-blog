import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader } from "@/components/common/PageHeader";
import { listManagedJobs } from "@/lib/api/admin-jobs";
import { Roles } from "@/lib/types/auth";
import { JobsPanel } from "./JobsPanel";

export const metadata: Metadata = { title: "Tác vụ tự động" };

export default async function AutomationPage() {
  const session = await auth();
  if (!session?.accessToken || !session.user.roles?.includes(Roles.Admin)) redirect("/dashboard/recipes");

  const jobs = await listManagedJobs(session.accessToken);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Quản trị"
        title="Tác vụ tự động"
        description="Đặt lịch, chạy ngay hoặc hẹn giờ đúng lúc báo cáo. Mọi mốc thời gian tính theo giờ Việt Nam (UTC+7)."
      />
      <JobsPanel initialJobs={jobs} />
    </div>
  );
}
