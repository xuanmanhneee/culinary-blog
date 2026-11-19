"use client";

import { UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { canUseDashboard } from "@/lib/types/auth";

const createRecipeUrl = "/dashboard/recipes/new";

export function ShareRecipeButton() {
  const { data: session, status } = useSession();
  if (status === "loading" || (session?.user && !canUseDashboard(session.user.roles))) return null;

  const href = session?.user ? createRecipeUrl : `/login?callbackUrl=${encodeURIComponent(createRecipeUrl)}`;
  return (
    <Button variant="outline" className="border-accent/35 bg-accent-soft text-accent-hover hover:border-accent hover:bg-accent hover:text-white" asChild>
      <Link href={href}><UtensilsCrossed />Chia sẻ món ăn của bạn</Link>
    </Button>
  );
}
