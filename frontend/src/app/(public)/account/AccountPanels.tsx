"use client";

import { Bell, CircleHelp, Languages, LockKeyhole, Mail, UserRound, type LucideIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getMySubscription, subscribeMyEmail, unsubscribeMyEmail } from "@/lib/api/subscriptions";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { ProfileForm } from "./ProfileForm";

type TabId = "profile" | "security" | "settings" | "help";

const tabs: { id: TabId; label: string; title: string; description: string; icon: LucideIcon }[] = [
  { id: "profile", label: "Hồ sơ", title: "Hồ sơ cá nhân", description: "Thông tin hiển thị công khai trên các công thức của bạn.", icon: UserRound },
  { id: "security", label: "Bảo mật", title: "Đổi mật khẩu", description: "Bạn sẽ cần đăng nhập lại trên mọi thiết bị sau khi đổi.", icon: LockKeyhole },
  { id: "settings", label: "Cài đặt", title: "Cài đặt tài khoản", description: "Tùy chỉnh trải nghiệm của bạn trên Bếp Nhà.", icon: Bell },
  { id: "help", label: "Trợ giúp", title: "Bạn cần trợ giúp?", description: "Chúng tôi luôn sẵn lòng hỗ trợ.", icon: CircleHelp },
];

const isTabId = (value: string): value is TabId => tabs.some((tab) => tab.id === value);

/** Một khung duy nhất: thanh chọn mục bên trái, nội dung mục đang chọn bên phải. Mục được lưu trong URL hash. */
export function AccountPanels() {
  const [active, setActive] = useState<TabId>("profile");

  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.slice(1);
      if (isTabId(hash)) setActive(hash);
    };
    sync();
    // Link có hash của Next.js đổi URL bằng pushState (không phát hashchange), nên đọc lại sau mỗi lần bấm.
    const syncAfterClick = () => window.setTimeout(sync, 0);
    window.addEventListener("hashchange", sync);
    window.addEventListener("click", syncAfterClick);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("click", syncAfterClick);
    };
  }, []);

  function select(id: TabId) {
    setActive(id);
    window.history.replaceState(null, "", `#${id}`);
  }

  const current = tabs.find((tab) => tab.id === active) ?? tabs[0];

  return (
    <div className="mt-8 grid overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:grid-cols-[240px_minmax(0,1fr)]">
      <nav aria-label="Mục tài khoản" className="flex gap-1 overflow-x-auto border-b border-border bg-muted/50 p-2 lg:flex-col lg:border-r lg:border-b-0 lg:p-4">
        <div role="tablist" aria-orientation="vertical" className="flex gap-1 lg:w-full lg:flex-col">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`tab-${id}`}
              role="tab"
              type="button"
              aria-selected={active === id}
              aria-controls={`panel-${id}`}
              onClick={() => select(id)}
              className={cn(
                "flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition-colors lg:w-full",
                active === id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-card hover:text-primary",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <div id={`panel-${current.id}`} role="tabpanel" aria-labelledby={`tab-${current.id}`} className="min-w-0 p-6 sm:p-8">
        <header className="mb-6 border-b border-border pb-5">
          <h2 className="text-xl font-bold text-foreground">{current.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{current.description}</p>
        </header>

        {active === "profile" && <ProfileForm />}
        {active === "security" && <ChangePasswordForm />}
        {active === "settings" && (
          <div className="divide-y divide-border">
            <NewsletterSetting />
            <Setting icon={Languages} label="Ngôn ngữ" value="Tiếng Việt" />
          </div>
        )}
        {active === "help" && (
          <div className="max-w-lg">
            <p className="text-sm leading-7 text-muted-foreground">Bếp Nhà luôn sẵn lòng hỗ trợ khi bạn gặp vấn đề với tài khoản hoặc công thức.</p>
            <Button className="mt-5" asChild><a href="mailto:hello@bepnha.vn"><Mail />Liên hệ hỗ trợ</a></Button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Bật/tắt nhận bản tin món ngon qua email đăng ký của tài khoản (dùng luồng subscriptions có sẵn). */
function NewsletterSetting() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    getMySubscription(token, controller.signal)
      .then((result) => setSubscribed(result.subscribed))
      .catch(() => { if (!controller.signal.aborted) setSubscribed(null); });
    return () => controller.abort();
  }, [token]);

  async function toggle() {
    if (!token || subscribed === null || busy) return;
    setBusy(true);
    try {
      const result = await (subscribed ? unsubscribeMyEmail(token) : subscribeMyEmail(token));
      setSubscribed(result.subscribed);
      toast.success(result.subscribed ? "Đã bật nhận thư. Chúng tôi vừa gửi bản tin đầu tiên cho bạn." : "Đã tắt nhận thư từ Bếp Nhà.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary"><Bell className="size-4" /></span>
      <span className="min-w-0 flex-1">
        <span id="newsletter-label" className="block text-sm font-bold text-foreground">Thông báo từ Bếp Nhà</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">Nhận email tin mới và những món được chấm điểm cao nhất</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={subscribed === true}
        aria-labelledby="newsletter-label"
        disabled={subscribed === null || busy}
        onClick={toggle}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2 disabled:opacity-50",
          subscribed ? "bg-primary" : "bg-border",
        )}
      >
        <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform", subscribed && "translate-x-5")} />
      </button>
    </div>
  );
}

function Setting({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary"><Icon className="size-4" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-foreground">{label}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{value}</span>
      </span>
      <span className="text-xs font-semibold text-muted-foreground">Sắp có</span>
    </div>
  );
}
