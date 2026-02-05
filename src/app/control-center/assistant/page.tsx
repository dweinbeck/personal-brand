import { getAnalytics } from "@/lib/assistant/analytics";
import { AssistantAnalytics } from "@/components/admin/AssistantAnalytics";
import { TopQuestions } from "@/components/admin/TopQuestions";
import { UnansweredQuestions } from "@/components/admin/UnansweredQuestions";

export const dynamic = "force-dynamic";

export default async function AssistantAdminPage() {
  const [data7d, data30d] = await Promise.all([
    getAnalytics(7),
    getAnalytics(30),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          AI Assistant Analytics
        </h1>
        <a
          href="/control-center"
          className="text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          &larr; Control Center
        </a>
      </div>

      {!data7d && !data30d ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-text-secondary">
            Firebase is not configured. Analytics will appear once Firestore is
            connected.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* 7-day stats */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Last 7 Days
            </h2>
            {data7d && (
              <AssistantAnalytics data={data7d} period="7 days" />
            )}
          </section>

          {/* 30-day stats */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Last 30 Days
            </h2>
            {data30d && (
              <AssistantAnalytics data={data30d} period="30 days" />
            )}
          </section>

          {/* Top questions */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Top Questions (30 days)
            </h2>
            <div className="rounded-xl border border-border bg-surface p-4">
              {data30d && (
                <TopQuestions questions={data30d.topQuestions} />
              )}
            </div>
          </section>

          {/* Safety blocked */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Safety-Blocked Conversations (30 days)
            </h2>
            <div className="rounded-xl border border-border bg-surface p-4">
              {data30d && (
                <UnansweredQuestions
                  conversations={data30d.recentConversations}
                />
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
