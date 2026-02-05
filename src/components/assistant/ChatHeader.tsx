export function ChatHeader() {
  return (
    <div className="border-b border-border bg-surface/80 backdrop-blur-sm px-4 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white text-sm font-bold flex-shrink-0">
          DW
        </div>
        <div>
          <h1 className="text-base font-semibold text-text-primary">
            Dan&rsquo;s AI Assistant
          </h1>
          <p className="text-xs text-text-tertiary">
            Ask about Dan&rsquo;s work, projects, skills, or how to get in touch
          </p>
        </div>
      </div>
    </div>
  );
}
