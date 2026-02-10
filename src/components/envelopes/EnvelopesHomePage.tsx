"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { envelopeFetch } from "@/lib/envelopes/api";
import { useEnvelopes } from "@/lib/envelopes/hooks";
import type { EnvelopeWithStatus, HomePageData } from "@/lib/envelopes/types";
import { CreateEnvelopeCard } from "./CreateEnvelopeCard";
import { EnvelopeCard } from "./EnvelopeCard";
import { EnvelopeCardGrid } from "./EnvelopeCardGrid";
import { EnvelopeForm } from "./EnvelopeForm";
import { GreetingBanner } from "./GreetingBanner";
import { SavingsBanner } from "./SavingsBanner";

export function EnvelopesHomePage() {
  const { user } = useAuth();
  const { data, error, isLoading, mutate } = useEnvelopes();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getToken = useCallback(async () => {
    const token = await user?.getIdToken();
    if (!token) throw new Error("Not authenticated");
    return token;
  }, [user]);

  // -- CRUD handlers --

  async function handleCreate(formData: {
    title: string;
    weeklyBudgetCents: number;
  }) {
    setIsSubmitting(true);
    try {
      const token = await getToken();
      await envelopeFetch("/api/envelopes", token, {
        method: "POST",
        body: JSON.stringify(formData),
      });
      await mutate();
      setIsCreating(false);
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Failed to create envelope.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(
    envelopeId: string,
    formData: { title: string; weeklyBudgetCents: number; rollover?: boolean },
  ) {
    setIsSubmitting(true);
    try {
      const token = await getToken();
      await envelopeFetch(`/api/envelopes/${envelopeId}`, token, {
        method: "PUT",
        body: JSON.stringify(formData),
      });
      await mutate();
      setEditingId(null);
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Failed to update envelope.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(envelopeId: string) {
    setIsSubmitting(true);
    try {
      const token = await getToken();
      await envelopeFetch(`/api/envelopes/${envelopeId}`, token, {
        method: "DELETE",
      });
      await mutate();
      setDeletingId(null);
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Failed to delete envelope.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReorder(envelopeId: string, direction: "up" | "down") {
    if (!data) return;

    const envelopes = [...data.envelopes];
    const index = envelopes.findIndex((e) => e.id === envelopeId);
    if (index === -1) return;

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= envelopes.length) return;

    // Swap positions
    [envelopes[index], envelopes[swapIndex]] = [
      envelopes[swapIndex],
      envelopes[index],
    ];

    const orderedIds = envelopes.map((e) => e.id);

    // Optimistic update
    const optimisticData: HomePageData = { ...data, envelopes };
    await mutate(optimisticData, { revalidate: false });

    try {
      const token = await getToken();
      await envelopeFetch("/api/envelopes/reorder", token, {
        method: "PUT",
        body: JSON.stringify({ orderedIds }),
      });
    } catch {
      // Revert on error
      await mutate();
    }
  }

  // -- Loading state --
  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-text-secondary">
          Loading your envelopes...
        </p>
      </div>
    );
  }

  // -- Error state --
  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-text-secondary mb-4">
            Something went wrong. Please try again.
          </p>
          <Button variant="secondary" size="sm" onClick={() => mutate()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // -- Data loaded --
  const envelopes = data?.envelopes ?? [];
  const onTrackCount = envelopes.filter(
    (e: EnvelopeWithStatus) => e.status === "On Track",
  ).length;
  const isEmpty = envelopes.length === 0 && !isCreating;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <GreetingBanner
        onTrackCount={onTrackCount}
        totalCount={envelopes.length}
      />

      {data && data.cumulativeSavingsCents > 0 && (
        <SavingsBanner savingsCents={data.cumulativeSavingsCents} />
      )}

      {data && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-primary">
            Week of {data.weekLabel}
          </h2>
        </div>
      )}

      {isEmpty && (
        <div className="mb-6 text-center">
          <p className="text-text-secondary mb-2">
            No envelopes yet. Create your first one to start budgeting!
          </p>
        </div>
      )}

      <EnvelopeCardGrid>
        {envelopes.map((env: EnvelopeWithStatus, i: number) =>
          editingId === env.id ? (
            <Card variant="default" key={env.id}>
              <EnvelopeForm
                mode="edit"
                initialValues={{
                  title: env.title,
                  weeklyBudgetCents: env.weeklyBudgetCents,
                  rollover: env.rollover,
                }}
                onSubmit={(formData) => handleUpdate(env.id, formData)}
                onCancel={() => setEditingId(null)}
                isSubmitting={isSubmitting}
              />
            </Card>
          ) : (
            <EnvelopeCard
              key={env.id}
              envelope={env}
              isFirst={i === 0}
              isLast={i === envelopes.length - 1}
              isDeleting={deletingId === env.id}
              onEdit={() => setEditingId(env.id)}
              onDelete={() => setDeletingId(env.id)}
              onConfirmDelete={() => handleDelete(env.id)}
              onCancelDelete={() => setDeletingId(null)}
              onMoveUp={() => handleReorder(env.id, "up")}
              onMoveDown={() => handleReorder(env.id, "down")}
            />
          ),
        )}

        {isCreating ? (
          <Card variant="default">
            <EnvelopeForm
              mode="create"
              onSubmit={handleCreate}
              onCancel={() => setIsCreating(false)}
              isSubmitting={isSubmitting}
            />
          </Card>
        ) : (
          <CreateEnvelopeCard onClick={() => setIsCreating(true)} />
        )}
      </EnvelopeCardGrid>
    </div>
  );
}
