import type { Metadata } from "next";
import { AccomplishmentCard } from "@/components/about/AccomplishmentCard";
import { getAccomplishments } from "@/lib/accomplishments";

export const metadata: Metadata = {
  title: "About",
  description:
    "Career accomplishments and professional experience of Dan Weinbeck.",
};

export default async function AboutPage() {
  const accomplishments = await getAccomplishments();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-text-primary">About</h1>
      <p className="mt-2 text-text-secondary">
        Career accomplishments and professional experience.
      </p>
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        {accomplishments.map((accomplishment) => (
          <AccomplishmentCard
            key={accomplishment.slug}
            accomplishment={accomplishment}
          />
        ))}
      </div>
    </div>
  );
}
