import clsx from "clsx";
import type { ReactNode } from "react";

interface CardButtonLabelProps {
  children: ReactNode;
  className?: string;
}

export function CardButtonLabel({ children, className }: CardButtonLabelProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200",
        "bg-gradient-to-b from-primary to-primary-hover text-white border border-gold/40 shadow-lg shadow-[rgba(27,42,74,0.20)]",
        "group-hover:shadow-xl group-hover:shadow-[rgba(200,165,90,0.20)] group-hover:scale-[1.03]",
        "px-5 py-3 text-sm w-full",
        className,
      )}
    >
      {children}
    </span>
  );
}
