"use client";

import React, { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { SuggestedEditDiff } from "./SuggestedEditDiff";
import type { BankResource, BankReview, BankUser, BankAiSuggestion } from "./types";

interface OverallImprovementPanelProps {
  resource: BankResource;
  reviews: BankReview[];
  currentUser: BankUser | null;
  currentContent: string;
  onContentAccepted: (newContent: string) => void;
}

export function OverallImprovementPanel({
  resource,
  reviews,
  currentUser,
  currentContent,
  onContentAccepted,
}: OverallImprovementPanelProps) {
  const [generating, setGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<BankAiSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (reviews.length === 0) {
      setError("No reviews available yet to generate an improvement plan.");
      return;
    }

    setGenerating(true);
    setError(null);
    setSuggestion(null);

    try {
      // Combine all review comments into one feedback snapshot
      const allFeedback = reviews
        .map((r, i) => `Review ${i + 1} (${r.author_label}, ${r.rating}★): ${r.comment}`)
        .join("\n\n");

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? '';

      const res = await fetch("/api/bank/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          resource_id: resource.id,
          mode: "overall",
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to generate improvement plan.");
      }

      const data = await res.json();
      setSuggestion(data.suggestion);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (!currentUser) {
    return (
      <p className="text-sm text-aralkada-muted font-medium">
        Sign in to generate an overall improvement plan from all available reviews.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-aralkada-muted font-medium">
        Generate a consolidated AI improvement plan that considers{" "}
        <span className="font-bold text-aralkada-border">{reviews.length}</span>{" "}
        {reviews.length === 1 ? "review" : "reviews"} for this resource.
      </p>

      {error && (
        <p className="text-xs text-rose-600 font-medium">{error}</p>
      )}

      {!suggestion ? (
        <button
          id={`overall-plan-btn-${resource.id}`}
          onClick={handleGenerate}
          disabled={generating || reviews.length === 0}
          className="aralkada-btn-yellow flex items-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {generating ? "Generating plan…" : "Generate overall improvement plan"}
        </button>
      ) : (
        <SuggestedEditDiff
          suggestion={suggestion}
          currentContent={currentContent}
          resourceId={resource.id}
          onAccepted={(newContent) => {
            setSuggestion(null);
            onContentAccepted(newContent);
          }}
          onRejected={() => setSuggestion(null)}
        />
      )}
    </div>
  );
}
