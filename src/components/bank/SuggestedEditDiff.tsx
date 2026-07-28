"use client";

import React, { useState } from "react";
import { CheckCircle, XCircle, Loader2, Bot, Edit3 } from "lucide-react";
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
  const { feedback_addressed, issue_identified, proposed_edit, teacher_action } =
    suggestion.suggestion_json;

  const [editedProposal, setEditedProposal] = useState(proposed_edit);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

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
          new_content: editedProposal,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to accept edit.");
      }
      onAccepted(editedProposal);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAccepting(false);
    }
  };

  // Compute a simple line-level diff for display
  const originalLines = currentContent.split("\n");
  const proposedLines = editedProposal.split("\n");

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
      <div className="space-y-2.5 text-sm">
        <div>
          <span className="font-bold text-aralkada-border">Feedback addressed: </span>
          <span className="text-aralkada-border/80">{feedback_addressed}</span>
        </div>
        <div>
          <span className="font-bold text-aralkada-border">Issue identified: </span>
          <span className="text-aralkada-border/80">{issue_identified}</span>
        </div>
        <div>
          <span className="font-bold text-aralkada-border">Teacher action to consider: </span>
          <span className="text-aralkada-border/80">{teacher_action}</span>
        </div>
      </div>

      {/* Diff / proposed edit */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-sm text-aralkada-border">Proposed edit</span>
          <button
            onClick={() => setIsEditing((v) => !v)}
            className="flex items-center gap-1 text-xs font-bold text-aralkada-muted hover:text-aralkada-blue transition-colors"
          >
            <Edit3 className="w-3 h-3" />
            {isEditing ? "Preview" : "Edit proposal"}
          </button>
        </div>

        {isEditing ? (
          <textarea
            value={editedProposal}
            onChange={(e) => setEditedProposal(e.target.value)}
            rows={10}
            className="aralkada-input text-xs font-mono resize-y"
          />
        ) : (
          <div className="bg-white rounded-xl border border-aralkada-border/15 p-4 max-h-56 overflow-y-auto text-xs font-mono leading-relaxed">
            {proposedLines.map((line, i) => {
              const origLine = originalLines[i] ?? "";
              const changed = line !== origLine;
              return (
                <div
                  key={i}
                  className={changed ? "bg-emerald-50 text-emerald-800 -mx-1 px-1 rounded" : "text-aralkada-border/70"}
                >
                  {line || "\u00A0"}
                </div>
              );
            })}
          </div>
        )}
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
