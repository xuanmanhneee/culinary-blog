import { apiFetch } from "@/lib/api/client";

export interface SubscriptionStatus {
  subscribed: boolean;
}

export const getMySubscription = (token: string, signal?: AbortSignal) =>
  apiFetch<SubscriptionStatus>("/subscriptions/me", { token, signal, cache: "no-store" });

export const subscribeMyEmail = (token: string) =>
  apiFetch<SubscriptionStatus>("/subscriptions/me", { method: "PUT", token });

export const unsubscribeMyEmail = (token: string) =>
  apiFetch<SubscriptionStatus>("/subscriptions/me", { method: "DELETE", token });
