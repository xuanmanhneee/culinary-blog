import { API_URL } from "@/lib/config/env";

export async function GET() {
  const response = await fetch(`${API_URL}/sitemap.xml`, { cache: "no-store" });

  return new Response(response.body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/xml; charset=utf-8",
    },
  });
}
