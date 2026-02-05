import type { Metadata } from "next";
import type { Article } from "@/components/writing/ArticleCard";
import { ArticleCard } from "@/components/writing/ArticleCard";

export const metadata: Metadata = {
  title: "Writing",
  description: "Articles and Blog Posts by Dan.",
};

const articles: Article[] = [
  {
    title: "Building an AI-Powered Personal Assistant from Scratch",
    publishDate: "January 15, 2026",
    topic: "AI",
    excerpt:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
  },
  {
    title: "Why Every Developer Should Learn Data Pipelines",
    publishDate: "December 8, 2025",
    topic: "Development",
    excerpt:
      "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante.",
  },
  {
    title: "From Spreadsheets to Dashboards: A Practical Analytics Migration",
    publishDate: "November 22, 2025",
    topic: "Analytics",
    excerpt:
      "Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra.",
  },
  {
    title: "The Unexpected Lessons of Training Your First Neural Network",
    publishDate: "October 5, 2025",
    topic: "Data Science",
    excerpt:
      "Praesent dapibus, neque id cursus faucibus, tortor neque egestas augue, eu vulputate magna eros eu erat. Aliquam erat volutpat. Nam dui mi, tincidunt quis, accumsan porttitor.",
  },
];

export default function WritingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-text-primary">Writing</h1>
      <p className="mt-2 text-text-secondary">Articles and Blog Posts by Dan</p>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.title} article={article} />
        ))}
      </div>
    </div>
  );
}
