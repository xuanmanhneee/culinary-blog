import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/dashboard"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
