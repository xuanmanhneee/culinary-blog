"use client";

import { CheckCircle2, LoaderCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { confirmEmail } from "@/lib/api/auth";

type State = "loading" | "success" | "error";

function ConfirmEmailStatus() {
  const params = useSearchParams();
  const userId = params.get("userId");
  const token = params.get("token");
  const [result, setResult] = useState<State>(userId && token ? "loading" : "error");

  useEffect(() => {
    if (!userId || !token) return;
    let active = true;
    confirmEmail(userId, token).then(
      () => { if (active) setResult("success"); },
      () => { if (active) setResult("error"); },
    );
    return () => { active = false; };
  }, [userId, token]);

  if (result === "loading") {
    return <p role="status" className="flex items-center gap-3 text-sm text-muted-foreground"><LoaderCircle className="size-5 animate-spin" />Đang xác nhận email...</p>;
  }

  const ok = result === "success";
  const Icon = ok ? CheckCircle2 : XCircle;
  return (
    <div role="status" className="text-center">
      <Icon className={`mx-auto size-12 ${ok ? "text-primary" : "text-destructive"}`} />
      <h1 className="font-display mt-5 text-3xl font-bold tracking-[-.03em] text-foreground">{ok ? "Email đã được xác nhận" : "Liên kết không hợp lệ"}</h1>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{ok ? "Cảm ơn bạn! Tài khoản của bạn đã sẵn sàng." : "Liên kết xác nhận không đúng hoặc đã hết hạn."}</p>
      <Button asChild className="mt-6"><Link href={ok ? "/login" : "/"}>{ok ? "Đăng nhập" : "Về trang chủ"}</Link></Button>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <section className="site-container grid min-h-[520px] place-items-center py-14">
      <div className="w-full max-w-md"><Suspense fallback={null}><ConfirmEmailStatus /></Suspense></div>
    </section>
  );
}
