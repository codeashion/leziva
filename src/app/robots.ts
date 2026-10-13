import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://leziva.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/account", "/account/*", "/cart", "/api/*", "/login", "/register", "/forgot-password"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
