import type { MetadataRoute } from "next";
import { TOOL_PAGES } from "@/config/nav";
import { siteConfig } from "@/config/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return TOOL_PAGES.map((p) => ({
    url: `${siteConfig.url}${p.href}`,
    lastModified,
    changeFrequency: "monthly",
    priority: p.priority,
  }));
}
