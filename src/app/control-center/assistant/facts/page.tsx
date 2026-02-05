import { getFacts } from "@/lib/assistant/facts-store";
import { getPromptVersions } from "@/lib/assistant/prompt-versions";
import { FactsEditor } from "@/components/admin/FactsEditor";
import { PromptVersions } from "@/components/admin/PromptVersions";
import { ReindexButton } from "@/components/admin/ReindexButton";

export const dynamic = "force-dynamic";

export default async function FactsPage() {
  const [facts, versions] = await Promise.all([
    getFacts(),
    getPromptVersions(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Canonical Facts Editor
        </h1>
        <div className="flex items-center gap-3">
          <ReindexButton />
          <a
            href="/control-center/assistant"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            &larr; Analytics
          </a>
        </div>
      </div>

      <div className="space-y-10">
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Editable Facts
          </h2>
          <p className="text-sm text-text-secondary mb-4">
            Facts stored in Firestore override the file-based data in src/data/.
            Clear the knowledge cache after making changes.
          </p>
          <FactsEditor initialFacts={facts} />
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Prompt Versions
          </h2>
          <PromptVersions versions={versions} />
        </section>
      </div>
    </div>
  );
}
