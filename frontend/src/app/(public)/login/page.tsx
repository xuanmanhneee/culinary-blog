"use client";

import { ArrowRight, Eye, LockKeyhole, Mail } from "lucide-react";
import { signIn, getSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import ErrorState from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl: "/dashboard/recipes",
        redirect: false,
      });

      if (!result?.ok) {
        setError("Email hoặc mật khẩu không chính xác.");
        return;
      }

      const session = await getSession();
      if (!session?.accessToken || !session.user.id) {
        setError("Không thể tạo phiên đăng nhập. Vui lòng thử lại.");
        return;
      }

      const userEmail = session.user.email ?? email;
      setSession(
        {
          id: session.user.id,
          fullName: session.user.name ?? userEmail,
          email: userEmail,
          userName: userEmail.split("@")[0],
          avatarUrl: session.user.image ?? null,
          roles: session.user.roles,
        },
        session.accessToken,
      );

      router.replace(result.url ?? "/dashboard/recipes");
      router.refresh();
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : "Không thể đăng nhập. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="site-container grid min-h-[720px] items-center gap-12 py-14 lg:grid-cols-2">
      <div className="hidden h-[620px] overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,#1f4b3f,#2f6958)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[#e2c3ad]">
          Căn bếp của riêng bạn
        </p>
        <blockquote className="font-display max-w-lg text-5xl leading-[1.08] font-bold tracking-[-.04em]">
          “Mỗi công thức được lưu là một kỷ niệm có thể nếm lại.”
        </blockquote>
        <div className="flex items-center gap-3 text-sm text-white/70">
          <span className="grid size-10 place-items-center rounded-full bg-white/10">🍲</span>
          Cùng chia sẻ niềm vui nấu nướng
        </div>
      </div>
      <div className="mx-auto w-full max-w-md">
        <p className="text-xs font-bold uppercase tracking-[.17em] text-[#b65338]">
          Chào mừng trở lại
        </p>
        <h1 className="font-display mt-3 text-5xl font-bold tracking-[-.045em] text-[#2f2925]">
          Vào bếp thôi!
        </h1>
        <p className="mt-3 text-sm leading-7 text-[#746a62]">
          Đăng nhập để lưu món yêu thích và chia sẻ công thức của riêng bạn.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#48413b]">Email</span>
            <span className="flex items-center gap-3 rounded-xl border border-[#d9cdbf] bg-white px-4">
              <Mail className="size-4 text-[#998e84]" aria-hidden="true" />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="h-12 w-full bg-transparent text-sm outline-none"
              />
            </span>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#48413b]">Mật khẩu</span>
            <span className="flex items-center gap-3 rounded-xl border border-[#d9cdbf] bg-white px-4">
              <LockKeyhole className="size-4 text-[#998e84]" aria-hidden="true" />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="h-12 w-full bg-transparent text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                <Eye className="size-4 text-[#776d65]" />
              </button>
            </span>
          </label>
          {error && <ErrorState message={error} />}
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            {!isSubmitting && <ArrowRight />}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-[#746a62]">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-bold text-[#b65338]">
            Đăng ký miễn phí
          </Link>
        </p>
      </div>
    </section>
  );
}
