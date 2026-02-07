import type { MetadataRoute } from "next";

const BASE_URL = "https://dan-weinbeck.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/control-center", "/control-center/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
