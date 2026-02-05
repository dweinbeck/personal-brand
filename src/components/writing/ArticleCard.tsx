export interface Article {
  title: string;
  publishDate: string;
  topic: string;
  excerpt: string;
}

interface ArticleCardProps {
  article: Article;
}

const topicColors: Record<string, string> = {
  AI: "bg-gold-light text-gold-hover border-gold",
  Development: "bg-primary/10 text-primary border-primary/40",
  Analytics: "bg-[#8B1E3F]/10 text-[#8B1E3F] border-[#8B1E3F]/30",
  "Data Science": "bg-primary/10 text-primary border-primary/40",
};

function getTopicColor(topic: string): string {
  return topicColors[topic] ?? "bg-primary/10 text-primary border-primary/40";
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <div className="relative rounded-2xl border border-border bg-surface p-8 shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-card-hover)] motion-safe:hover:-translate-y-1 group cursor-pointer">
      {/* Topic badge */}
      <span
        className={`absolute top-4 right-4 px-2.5 py-0.5 text-xs font-medium rounded-full border ${getTopicColor(article.topic)}`}
      >
        {article.topic}
      </span>

      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-text-primary pr-24 group-hover:text-gold transition-colors duration-200">
        {article.title}
      </h3>

      <p className="mt-1.5 text-xs text-text-tertiary">{article.publishDate}</p>

      <p className="mt-3 text-sm text-text-secondary leading-relaxed line-clamp-3">
        {article.excerpt}
      </p>

      <span className="mt-5 inline-block text-sm font-medium text-gold group-hover:text-gold-hover transition-colors duration-200">
        Read More &rarr;
      </span>
    </div>
  );
}
