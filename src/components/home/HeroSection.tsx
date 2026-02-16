import Image from "next/image";

const taglines = [
  "AI Developer",
  "Analytics Leader",
  "Data Visualization Specialist",
];

export function HeroSection() {
  return (
    <section className="relative pt-16 md:pt-24 pb-8 motion-safe:animate-fade-in-up">
      <div className="absolute top-0 bottom-0 -left-10 -right-10 md:-left-20 md:-right-20 bg-gradient-to-b from-[rgba(200,165,90,0.04)] to-transparent rounded-b-3xl -z-10" />
      <div className="flex flex-col items-center gap-8 md:grid md:grid-cols-[260px_1fr] md:gap-12 md:items-start">
        {/* Headshot */}
        <div className="md:pt-2">
          <div className="w-[260px] h-[260px] rounded-full overflow-hidden ring-4 ring-gold/30 shadow-xl shadow-[rgba(27,42,74,0.10)]">
            <Image
              src="/transparent-headshot-Dan Weinbeck-color.jpg"
              alt="Dan Weinbeck"
              width={512}
              height={512}
              preload
              className="w-full h-full object-cover object-[center_20%]"
            />
          </div>
        </div>

        {/* Text content */}
        <div className="text-center md:text-left">
          <h1 className="font-display text-[3rem] md:text-[4.5rem] font-semibold tracking-tight leading-[1.05] text-primary border-b border-primary pb-2 inline-block">
            Dan Weinbeck
          </h1>
          <div className="mt-3 flex flex-wrap justify-center md:justify-start items-center gap-2">
            {taglines.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center h-8 px-3 text-sm font-medium leading-none rounded-full bg-gold-light text-text-primary border border-primary"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="mt-4 text-base font-bold text-text-primary">
            Director, Data &amp; Analytics at{" "}
            <a
              href="https://transparent.partners"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:text-gold/80 transition-colors"
            >
              Transparent Partners
            </a>{" "}
            | Chicago, Illinois
          </p>
          <p className="mt-1 text-base font-bold text-text-primary">
            MBA, Tippie School of Management at the{" "}
            <a
              href="https://tippie.uiowa.edu/iowa-mba"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:text-gold/80 transition-colors"
            >
              University of Iowa
            </a>
          </p>
          <p className="mt-4 text-text-secondary leading-[1.7] max-w-[55ch]">
            I build data products that ship and interfaces that make sense. 12+
            years of experience transforming the analytics function at 4 Fortune
            500 companies across Marketing, Sales, and Operations, with a
            specialization in business intelligence, data science, and turning
            data into actionable insights.
          </p>
        </div>
      </div>

      <hr className="mt-10 border-t border-gold/40" />
    </section>
  );
}
