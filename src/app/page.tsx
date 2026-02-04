import type { Metadata } from "next";
import type { Person, WithContext } from "schema-dts";
import { BlogTeaser } from "@/components/home/BlogTeaser";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { HeroSection } from "@/components/home/HeroSection";

export const metadata: Metadata = {
  title: "Home",
  description:
    "AI developer, analytics professional, and data scientist. Explore projects, tutorials, and more.",
};

const personJsonLd: WithContext<Person> = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Dan Weinbeck",
  url: "https://dweinbeck.com",
  jobTitle: "AI Developer & Data Scientist",
  description:
    "AI developer, analytics professional, and data scientist. Explore projects, tutorials, and more.",
  email: "daniel.weinbeck@gmail.com",
  sameAs: [
    "https://www.linkedin.com/in/dw789/",
    "https://github.com/dweinbeck",
    "https://instagram.com/dweinbeck",
  ],
};

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires dangerouslySetInnerHTML per Next.js convention
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <HeroSection />
      <FeaturedProjects />
      <BlogTeaser />
    </div>
  );
}
