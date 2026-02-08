import { CONTACT_EMAIL } from "@/lib/constants";

const EXIT_LINKS = [
  {
    label: "Email Dan",
    href: `mailto:${CONTACT_EMAIL}`,
    icon: "✉",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/dw789/",
    icon: "in",
  },
  {
    label: "GitHub",
    href: "https://github.com/dweinbeck",
    icon: "</>",
  },
  {
    label: "Contact",
    href: "/contact",
    icon: "→",
  },
];

export function ExitRamps() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-text-tertiary mr-1">Quick links:</span>
      {EXIT_LINKS.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target={
            link.href.startsWith("http") || link.href.startsWith("mailto")
              ? "_blank"
              : undefined
          }
          rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-secondary transition-all duration-200 hover:border-gold/40 hover:bg-gold-light hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          <span className="text-[10px]" aria-hidden="true">
            {link.icon}
          </span>
          {link.label}
        </a>
      ))}
    </div>
  );
}
