import createMDX from "@next/mdx";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  images: {
    qualities: [25, 50, 75, 100],
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: [["rehype-pretty-code", { theme: "github-light" }]],
  },
});

export default withMDX(nextConfig);
