import clsx from "clsx";
import Link from "next/link";
import type { AnchorHTMLAttributes, HTMLAttributes } from "react";

type Variant = "default" | "clickable" | "featured";

type CardBaseProps = {
  variant?: Variant;
  className?: string;
};

type CardAsDiv = CardBaseProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof CardBaseProps> & {
    href?: undefined;
  };

type CardAsLink = CardBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CardBaseProps> & {
    href: string;
  };

type CardProps = CardAsDiv | CardAsLink;

const base = "rounded-2xl border p-6 transition-all duration-200";

const variantStyles: Record<Variant, string> = {
  default: "border-border bg-surface shadow-[var(--shadow-card)]",
  clickable:
    "border-border bg-surface shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] hover:border-gold/30 motion-safe:hover:-translate-y-1",
  featured:
    "border-border bg-surface border-l-4 border-l-gold shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] motion-safe:hover:-translate-y-1",
};

export function Card(props: CardProps) {
  const { variant = "default", className, href, ...rest } = props;
  const classes = clsx(base, variantStyles[variant], className);

  if (href) {
    const isExternal = href.startsWith("http");
    if (isExternal) {
      return (
        <a
          href={href}
          className={clsx(classes, "block")}
          target="_blank"
          rel="noopener noreferrer"
          {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
        />
      );
    }
    return (
      <Link
        href={href}
        className={clsx(classes, "block")}
        {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
      />
    );
  }

  return (
    <div className={classes} {...(rest as HTMLAttributes<HTMLDivElement>)} />
  );
}
