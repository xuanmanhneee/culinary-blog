"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/errors";

export function NewsletterForm() {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "");

    try {
      const result = await apiFetch<{ message: string }>("/subscriptions", {
        method: "POST",
        body: { email },
      });
      setMessage(result.message);
      form.reset();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-7 w-full max-w-lg">
      <form className="flex flex-col gap-2 sm:flex-row" onSubmit={subscribe}>
        <label htmlFor="newsletter-email" className="sr-only">Địa chỉ email</label>
        <input id="newsletter-email" name="email" type="email" required placeholder="ban@email.com" className="h-12 min-w-0 flex-1 rounded-full border border-input bg-card px-5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
        <Button type="submit" size="lg" disabled={isSubmitting}>{isSubmitting ? "Đang đăng ký..." : "Nhận thư bếp"}</Button>
      </form>
      {message && <p role="status" className="mt-3 text-sm text-foreground">{message}</p>}
    </div>
  );
}
