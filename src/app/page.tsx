import type { Metadata } from "next";
import type { Person, WithContext } from "schema-dts";
import { FeaturedBuildingBlocks } from "@/components/home/FeaturedBuildingBlocks";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { HeroSection } from "@/components/home/HeroSection";
import { CONTACT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Home",
  description:
    "I build practical AI agents and data products that ship. Interests in business intelligence, statistical modeling, intuitive UX, and polished design.",
};

const personJsonLd: WithContext<Person> = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Dan Weinbeck",
  url: "https://dan-weinbeck.com",
  jobTitle: "AI Developer & Data Scientist",
  description:
    "I build practical AI agents and data products that ship. Interests in business intelligence, statistical modeling, intuitive UX, and polished design.",
  email: CONTACT_EMAIL,
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
      <FeaturedBuildingBlocks />
    </div>
  );
}
