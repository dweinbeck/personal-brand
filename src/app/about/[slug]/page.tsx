import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAccomplishmentBySlug,
  getAccomplishments,
} from "@/lib/accomplishments";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const accomplishments = await getAccomplishments();
  return accomplishments.map((a) => ({ slug: a.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const accomplishment = getAccomplishmentBySlug(slug);

  if (!accomplishment) {
    return {};
  }

  return {
    title: `${accomplishment.title} | About`,
    description: accomplishment.setup,
  };
}

export default async function AccomplishmentDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const accomplishment = getAccomplishmentBySlug(slug);

  if (!accomplishment) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      {/* Header section */}
      <header className="mb-10">
        {/* Company with logo placeholder */}
        <div className="flex items-center gap-3 mb-4">
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
          <span className="text-sm font-medium text-text-secondary">
            {accomplishment.company}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-text-primary">
          {accomplishment.title}
        </h1>

        {/* Role and Years */}
        <p className="mt-2 text-lg text-text-secondary">
          {accomplishment.role} &bull; {accomplishment.years}
        </p>

        {/* All skills as tags */}
        <div className="mt-4 flex flex-wrap gap-2">
          {accomplishment.tags.map((skill) => (
            <span
              key={skill}
              className="inline-block rounded-full bg-gold-light px-2.5 py-0.5 text-xs font-medium text-text-primary"
            >
              {skill}
            </span>
          ))}
        </div>
      </header>

      {/* Content sections */}
      <div className="prose prose-neutral max-w-none space-y-8">
        {accomplishment.setup && (
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              The Setup
            </h2>
            <p className="text-text-secondary leading-relaxed">
              {accomplishment.setup}
            </p>
          </section>
        )}

        {accomplishment.workCompleted && (
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              Work Completed
            </h2>
            <p className="text-text-secondary leading-relaxed">
              {accomplishment.workCompleted}
            </p>
          </section>
        )}

        {accomplishment.results && (
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              Results
            </h2>
            <p className="text-text-secondary leading-relaxed">
              {accomplishment.results}
            </p>
          </section>
        )}

        {accomplishment.skillsExercised &&
          accomplishment.skillsExercised.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-3">
                Skills Exercised
              </h2>
              <div className="flex flex-wrap gap-2">
                {accomplishment.skillsExercised.map((skill) => (
                  <span
                    key={skill}
                    className="inline-block rounded-full bg-gold-light px-3 py-1 text-sm font-medium text-text-primary"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}
      </div>

      {/* Back link */}
      <div className="mt-12 pt-6 border-t border-border">
        <Link
          href="/about"
          className="text-sm font-medium text-gold hover:text-gold-hover transition-colors duration-200"
        >
          &larr; Back to About
        </Link>
      </div>
    </article>
  );
}
