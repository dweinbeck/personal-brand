import createMDX from "@next/mdx";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  images: {
    qualities: [25, 50, 75, 100],
  },
  async redirects() {
    return [
      // Legacy route redirects
      {
        source: "/tutorials",
        destination: "/building-blocks",
        permanent: true,
      },
      {
        source: "/tutorials/:slug",
        destination: "/building-blocks/:slug",
        permanent: true,
      },
      // Add future redirects here
      // {
      //   source: "/old-path",
      //   destination: "/new-path",
      //   permanent: true,
      // },
    ];
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: ["rehype-slug", ["rehype-pretty-code", { theme: "github-light" }]],
  },
});

export default withMDX(nextConfig);
