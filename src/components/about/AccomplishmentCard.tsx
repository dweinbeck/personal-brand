import Image from "next/image";
import Link from "next/link";
import type { Accomplishment } from "@/lib/accomplishments";

export function AccomplishmentCard({
  accomplishment,
}: {
  accomplishment: Accomplishment;
}) {
  const visibleSkills = accomplishment.skills.slice(0, 4);
  const remainingCount = accomplishment.skills.length - 4;

  return (
    <Link
      href={`/about/${accomplishment.slug}`}
      className="rounded-2xl border border-border bg-surface p-8 shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-card-hover)] motion-safe:hover:-translate-y-1 group cursor-pointer block flex flex-col"
    >
      {/* Title */}
      <h2 className="text-lg font-semibold text-text-primary group-hover:text-gold transition-colors duration-200">
        {accomplishment.title}
      </h2>

      {/* Role and Years subtitle */}
      <p className="mt-1 text-sm text-text-tertiary">
        {accomplishment.role} &bull; {accomplishment.years}
      </p>

      {/* Company/Organization name and location */}
      <p className="mt-3 text-sm font-medium text-text-secondary">
        {accomplishment.company}
        {accomplishment.location && (
          <span className="text-text-tertiary font-normal">
            {" "}
            &bull; {accomplishment.location}
          </span>
        )}
      </p>

      {/* Description */}
      <p className="mt-3 text-sm text-text-secondary leading-relaxed line-clamp-3">
        {accomplishment.description}
      </p>

      {/* Skills tags (max 4 visible) */}
      <div className="mt-4 flex flex-wrap gap-2">
        {visibleSkills.map((skill) => (
          <span
            key={skill}
            className="px-2.5 py-0.5 font-mono text-xs text-text-tertiary bg-[rgba(27,42,74,0.04)] rounded-full"
          >
            {skill}
          </span>
        ))}
        {remainingCount > 0 && (
          <span className="px-2.5 py-0.5 text-xs text-text-tertiary">
            +{remainingCount} more
          </span>
        )}
      </div>

      {/* Bottom row: Logo (left) + View Details (right) */}
      <div className="mt-auto pt-5 flex items-center justify-between">
        {accomplishment.companyLogo ? (
          <Image
            src={accomplishment.companyLogo}
            alt={accomplishment.company}
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
        ) : (
          <div className="h-8 w-8 rounded bg-gold-light flex items-center justify-center text-gold font-bold text-sm">
            {accomplishment.company.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm font-medium text-gold group-hover:text-gold-hover transition-colors duration-200">
          View Details &rarr;
        </span>
      </div>
    </Link>
  );
}
