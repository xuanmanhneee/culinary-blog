import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader } from "@/components/common/PageHeader";
import { AccountPanels } from "./AccountPanels";

export const metadata: Metadata = { title: "Tài khoản của tôi" };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <section className="site-container py-10 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <PageHeader eyebrow="Góc riêng của bạn" title="Tài khoản của tôi" description="Quản lý hồ sơ, bảo mật và các tùy chọn cho trải nghiệm Bếp Nhà." />
        <AccountPanels />
      </div>
    </section>
  );
}
