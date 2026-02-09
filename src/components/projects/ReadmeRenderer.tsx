import type { Components } from "react-markdown";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ReadmeRendererProps {
  content: string;
  repoSlug?: string;
}

/**
 * Check whether a URL string is absolute (starts with http(s) or protocol-relative).
 */
function isAbsoluteUrl(url: string): boolean {
  return /^https?:\/\/|^\/\//i.test(url);
}

/**
 * Strip a leading "./" from a relative path.
 */
function stripLeadingDotSlash(path: string): string {
  return path.replace(/^\.\//, "");
}

/**
 * Build react-markdown component overrides that rewrite relative URLs
 * to point at the GitHub repository.
 */
function buildComponents(repoSlug?: string): Components {
  return {
    a: ({ href, children, ...rest }) => {
      // Anchor links stay as-is
      if (!href || href.startsWith("#")) {
        return (
          <a href={href} {...rest}>
            {children}
          </a>
        );
      }

      // Absolute URLs open in a new tab
      if (isAbsoluteUrl(href)) {
        return (
          <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
            {children}
          </a>
        );
      }

      // Relative URL -- rewrite to GitHub blob if we know the repo
      if (repoSlug) {
        const resolved = `https://github.com/${repoSlug}/blob/master/${stripLeadingDotSlash(href)}`;
        return (
          <a
            href={resolved}
            target="_blank"
            rel="noopener noreferrer"
            {...rest}
          >
            {children}
          </a>
        );
      }

      // Fallback: render as-is
      return (
        <a href={href} {...rest}>
          {children}
        </a>
      );
    },

    img: ({ src, alt, ...rest }) => {
      const srcStr = typeof src === "string" ? src : undefined;
      if (srcStr && !isAbsoluteUrl(srcStr) && repoSlug) {
        const resolved = `https://raw.githubusercontent.com/${repoSlug}/master/${stripLeadingDotSlash(srcStr)}`;
        // biome-ignore lint/performance/noImgElement: react-markdown component overrides require native <img>; Next Image needs static dimensions
        return <img src={resolved} alt={alt ?? ""} {...rest} />;
      }
      // biome-ignore lint/performance/noImgElement: react-markdown component overrides require native <img>; Next Image needs static dimensions
      return <img src={srcStr} alt={alt ?? ""} {...rest} />;
    },
  };
}

export function ReadmeRenderer({ content, repoSlug }: ReadmeRendererProps) {
  return (
    <div className="prose prose-neutral max-w-none prose-headings:text-text-primary prose-p:text-text-secondary prose-a:text-gold prose-a:no-underline hover:prose-a:underline prose-strong:text-text-primary prose-code:text-gold-hover prose-code:bg-gold-light/30 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-primary/5 prose-pre:border prose-pre:border-border">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={buildComponents(repoSlug)}
      >
        {content}
      </Markdown>
    </div>
  );
}
