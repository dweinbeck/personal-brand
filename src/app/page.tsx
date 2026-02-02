import { BlogTeaser } from "@/components/home/BlogTeaser";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { HeroSection } from "@/components/home/HeroSection";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <HeroSection />
      <FeaturedProjects />
      <BlogTeaser />
    </div>
  );
}
