import Image from "next/image";

const taglines = [
  "AI Developer",
  "Analytics Leader",
  "Data Visualization Specialist",
];

export function HeroSection() {
  return (
    <section className="relative pt-16 md:pt-24 pb-8 motion-safe:animate-fade-in-up">
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(200,165,90,0.04)] to-transparent rounded-3xl -z-10" />
      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
        {/* Headshot */}
        <div className="flex-shrink-0">
          <div className="w-[256px] h-[256px] rounded-full overflow-hidden ring-4 ring-gold/30 shadow-xl shadow-[rgba(27,42,74,0.10)]">
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
          <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
            {taglines.map((tag) => (
              <span
                key={tag}
                className="px-4 py-1.5 text-sm font-medium rounded-full bg-gold-light text-text-primary border border-primary"
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
          <p className="mt-3 max-w-lg text-text-secondary leading-relaxed">
            I build data products that ship and interfaces that make sense. 12+
            years of experience transforming the analytics function at 4 Fortune
            500 companies across Marketing, Sales, and Operations, with a
            specialization in business intelligence, data science, and turning
            data into actionable insights.
          </p>

          <div className="mt-8 flex items-center gap-4">
            <span className="text-base font-semibold text-text-primary">For More Information:</span>
            <a
              href="https://github.com/dweinbeck"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-gold transition-colors"
              aria-label="GitHub"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/dw789/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-gold transition-colors"
              aria-label="LinkedIn"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            <a
              href="mailto:daniel.weinbeck@gmail.com"
              className="text-primary hover:text-gold transition-colors"
              aria-label="Email"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden="true">
                <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
      <hr className="mt-14 border-t border-gold/40" />
    </section>
  );
}
