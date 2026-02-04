import Image from "next/image";

export function HeroSection() {
  return (
    <section className="relative py-16 md:py-24 motion-safe:animate-fade-in-up">
      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
        {/* Headshot */}
        <div className="flex-shrink-0">
          <Image
            src="/headshot.jpeg"
            alt="Dan Weinbeck"
            width={192}
            height={192}
            preload
            className="rounded-full object-cover ring-4 ring-white shadow-xl shadow-blue-500/10"
          />
        </div>

        {/* Text content */}
        <div className="text-center md:text-left">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-gray-900">
            Dan Weinbeck
          </h1>
          <p className="mt-3 text-xl sm:text-2xl text-gray-500 font-normal">
            Self-taught AI developer · analytics pro · data scientist
          </p>
          <p className="mt-4 max-w-lg text-gray-600">
            I build practical AI agents and data products that ship. Interests
            in experimentation, UX, automation, and side projects.
          </p>
        </div>
      </div>
    </section>
  );
}
