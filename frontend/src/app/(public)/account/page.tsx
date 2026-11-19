import type { Metadata } from "next";
import { Bell, CircleHelp, Languages, LockKeyhole, Mail, Settings } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Tài khoản của tôi" };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <section className="site-container py-10 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <PageHeader eyebrow="Góc riêng của bạn" title="Tài khoản của tôi" description="Quản lý hồ sơ và các tùy chọn cho trải nghiệm Bếp Nhà." />

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <ProfileForm />

          <article id="settings" className="scroll-mt-28 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-primary-soft text-primary"><Settings className="size-5" /></span><div><h2 className="text-lg font-bold">Cài đặt tài khoản</h2><p className="text-xs text-muted-foreground">Tùy chỉnh trải nghiệm của bạn</p></div></div>
            <div className="mt-6 divide-y divide-border">
              <Setting icon={Bell} label="Thông báo từ Bếp Nhà" value="Tin mới và gợi ý món ngon" />
              <Setting icon={Languages} label="Ngôn ngữ" value="Tiếng Việt" />
              <Setting icon={LockKeyhole} label="Bảo mật" value="Quản lý đăng nhập và mật khẩu" />
            </div>
          </article>

          <article id="help" className="scroll-mt-28 rounded-2xl border border-border bg-primary p-6 text-white sm:p-8">
            <CircleHelp className="size-8 text-accent-soft" />
            <h2 className="mt-5 text-2xl font-bold">Bạn cần trợ giúp?</h2>
            <p className="mt-2 text-sm leading-6 text-white/70">Bếp Nhà luôn sẵn lòng hỗ trợ khi bạn gặp vấn đề với tài khoản hoặc công thức.</p>
            <Button variant="secondary" className="mt-6" asChild><a href="mailto:hello@bepnha.vn"><Mail />Liên hệ hỗ trợ</a></Button>
          </article>
        </div>
      </div>
    </section>
  );
}

function Setting({ icon: Icon, label, value }: { icon: typeof Bell; label: string; value: string }) {
  return <div className="flex items-center gap-3 py-4"><Icon className="size-4 shrink-0 text-primary" /><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-foreground">{label}</span><span className="mt-0.5 block text-xs text-muted-foreground">{value}</span></span><span className="text-xs font-semibold text-muted-foreground">Sắp có</span></div>;
}
