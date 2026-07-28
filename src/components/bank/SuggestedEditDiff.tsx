"use client";

import React, { useState } from "react";
import { CheckCircle, XCircle, Loader2, Bot, Info } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { BankAiSuggestion } from "./types";

interface SuggestedEditDiffProps {
  suggestion: BankAiSuggestion;
  currentContent: string;
  resourceId: string;
  onAccepted: (newContent: string) => void;
  onRejected: () => void;
}

export function SuggestedEditDiff({
  suggestion,
  currentContent,
  resourceId,
  onAccepted,
  onRejected,
}: SuggestedEditDiffProps) {
  const json = suggestion.suggestion_json;
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (json.outcome === 'no_change') {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50/60 p-4 space-y-3">
        <div className="flex items-center gap-2 text-amber-900">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-xs font-extrabold uppercase tracking-wider">
            Review Analysis — No Revision Required
          </span>
        </div>

        <div className="space-y-2 text-sm text-amber-950">
          <div>
            <span className="font-bold">Feedback Summary: </span>
            <span>{json.feedback_summary}</span>
          </div>
          <div>
            <span className="font-bold">Reason: </span>
            <span>{json.reason_no_change}</span>
          </div>
          <div>
            <span className="font-bold">Teacher Guidance: </span>
            <span>{json.teacher_action}</span>
          </div>
        </div>

        <div className="pt-1 flex justify-end">
          <button
            type="button"
            onClick={onRejected}
            className="aralkada-btn-secondary text-xs py-1.5 px-3"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  // Outcome is 'actionable'
  const handleAccept = async () => {
    setAccepting(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? '';

      const res = await fetch(`/api/bank/resources/${resourceId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          suggestion_id: suggestion.id,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to accept edit.");
      }

      const data = await res.json();
      onAccepted(data.resource.content_text);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="rounded-xl border-2 border-aralkada-blue/30 bg-aralkada-blue/5 p-4 space-y-4">
      {/* AI draft label */}
      <div className="flex items-center gap-2">
        <Bot className="w-4 h-4 text-aralkada-blue shrink-0" />
        <span className="text-xs font-extrabold text-aralkada-blue uppercase tracking-wider">
          AI draft — teacher review required
        </span>
      </div>

      {/* Structured output */}
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-bold text-aralkada-border">Feedback Summary: </span>
          <span className="text-aralkada-border/80">{json.feedback_summary}</span>
        </div>
        <div>
          <span className="font-bold text-aralkada-border">Issue Identified: </span>
          <span className="text-aralkada-border/80">{json.issue_identified}</span>
        </div>
        <div>
          <span className="font-bold text-aralkada-border">Evidence from Review: </span>
          <span className="italic text-aralkada-border/80">"{json.evidence_from_review}"</span>
        </div>
        <div>
          <span className="font-bold text-aralkada-border">Teacher Action: </span>
          <span className="text-aralkada-border/80">{json.teacher_action}</span>
        </div>
      </div>

      {/* Target & Replacement preview */}
      <div className="space-y-2 bg-white rounded-xl border border-aralkada-border/15 p-3 text-xs font-mono">
        {json.edit_kind === 'replace' && json.target_excerpt && (
          <div>
            <span className="font-bold text-rose-700 block mb-1">Target Excerpt to Replace:</span>
            <div className="bg-rose-50 border border-rose-200 text-rose-900 p-2 rounded whitespace-pre-wrap">
              - {json.target_excerpt}
            </div>
          </div>
        )}
        <div>
          <span className="font-bold text-emerald-700 block mb-1">
            {json.edit_kind === 'replace' ? 'Replacement Text:' : 'New Content to Append:'}
          </span>
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-2 rounded whitespace-pre-wrap">
            + {json.replacement_text}
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs text-rose-600 font-medium">{error}</p>
      )}

      {/* Accept / Reject */}
      <div className="flex gap-2.5 pt-1">
        <button
          id={`accept-edit-${suggestion.id}`}
          onClick={handleAccept}
          disabled={accepting}
          className="aralkada-btn-primary text-sm flex items-center gap-2 disabled:opacity-60"
        >
          {accepting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CheckCircle className="w-3.5 h-3.5" />
          )}
          {accepting ? "Saving…" : "Accept edit"}
        </button>
        <button
          id={`reject-edit-${suggestion.id}`}
          onClick={onRejected}
          disabled={accepting}
          className="aralkada-btn-secondary text-sm flex items-center gap-2 disabled:opacity-60"
        >
          <XCircle className="w-3.5 h-3.5" />
          Reject
        </button>
      </div>
    </div>
  );
}
