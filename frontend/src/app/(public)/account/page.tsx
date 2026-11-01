import type { Metadata } from "next";
import { Bell, CircleHelp, Languages, LockKeyhole, Mail, Settings } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { ProfileForm } from "./ProfileForm";
import { PasswordChangeForm } from "./PasswordChangeForm";

export const metadata: Metadata = { title: "Tài khoản của tôi" };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <section className="site-container py-10 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-bold uppercase tracking-[.17em] text-[#b65338]">Góc riêng của bạn</p>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-[-.04em] text-[#2f2925] sm:text-5xl">Tài khoản của tôi</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#746a62]">Quản lý hồ sơ, bộ sưu tập món ngon và các tùy chọn cho trải nghiệm Bếp Nhà.</p>

        <div className="mt-9 grid gap-5 lg:grid-cols-2">
          <ProfileForm />
          <PasswordChangeForm />

          <article id="settings" className="scroll-mt-28 rounded-[1.75rem] border border-[#ddd1c3] bg-[#fffdf9] p-6 sm:p-8">
            <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-[#e3eee7] text-[#1f4b3f]"><Settings className="size-5" /></span><div><h2 className="font-display text-2xl font-bold">Cài đặt tài khoản</h2><p className="text-xs text-[#80756d]">Tùy chỉnh trải nghiệm của bạn</p></div></div>
            <div className="mt-6 divide-y divide-[#e7ded3]">
              <Setting icon={Bell} label="Thông báo từ Bếp Nhà" value="Tin mới và gợi ý món ngon" />
              <Setting icon={Languages} label="Ngôn ngữ" value="Tiếng Việt" />
              <Setting icon={LockKeyhole} label="Bảo mật" value="Quản lý đăng nhập và mật khẩu" />
            </div>
          </article>

          <article id="help" className="scroll-mt-28 rounded-[1.75rem] border border-[#ddd1c3] bg-[#1f4b3f] p-6 text-white sm:p-8">
            <CircleHelp className="size-8 text-[#efd3bf]" />
            <h2 className="font-display mt-5 text-2xl font-bold">Bạn cần trợ giúp?</h2>
            <p className="mt-2 text-sm leading-6 text-white/70">Bếp Nhà luôn sẵn lòng hỗ trợ khi bạn gặp vấn đề với tài khoản hoặc công thức.</p>
            <Button variant="secondary" className="mt-6" asChild><a href="mailto:hello@bepnha.vn"><Mail />Liên hệ hỗ trợ</a></Button>
          </article>
        </div>
      </div>
    </section>
  );
}

function Setting({ icon: Icon, label, value }: { icon: typeof Bell; label: string; value: string }) {
  return <div className="flex items-center gap-3 py-4"><Icon className="size-4 shrink-0 text-[#1f4b3f]" /><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-[#403934]">{label}</span><span className="mt-0.5 block text-xs text-[#847971]">{value}</span></span><span className="text-xs font-semibold text-[#a19890]">Sắp có</span></div>;
}
