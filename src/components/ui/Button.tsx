import clsx from "clsx";
import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

type BaseProps = {
  variant?: Variant;
  size?: Size;
  href?: string;
  className?: string;
};

type ButtonAsButton = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & {
    href?: undefined;
  };

type ButtonAsLink = BaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps> & {
    href: string;
  };

type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.03] active:scale-[0.98]",
  secondary:
    "border-2 border-gray-300 bg-white text-gray-700 hover:shadow-md hover:border-gray-400",
  ghost:
    "text-gray-600 hover:bg-gray-100",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-3 text-sm",
};

const base =
  "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:pointer-events-none";

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", className, href, ...rest } = props;
  const classes = clsx(base, variantStyles[variant], sizeStyles[size], className);

  if (href) {
    const isExternal = href.startsWith("http");
    if (isExternal) {
      return (
        <a
          href={href}
          className={classes}
          target="_blank"
          rel="noopener noreferrer"
          {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
        />
      );
    }
    return (
      <Link
        href={href}
        className={classes}
        {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
      />
    );
  }

  return (
    <button
      className={classes}
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
    />
  );
}
