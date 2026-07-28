"use client";

import React, { useState } from "react";
import { Star, Loader2, Sparkles } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { SuggestedEditDiff } from "./SuggestedEditDiff";
import type { BankResource, BankReview, BankUser, BankAiSuggestion } from "./types";

interface ReviewPanelProps {
  resource: BankResource;
  reviews: BankReview[];
  reviewsLoading: boolean;
  currentUser: BankUser | null;
  currentContent: string;
  onReviewAdded: () => void;
  onContentAccepted: (newContent: string) => void;
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1" role="group" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-6 h-6 ${
              n <= (hover || value)
                ? "text-amber-400 fill-amber-400"
                : "text-aralkada-muted/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({
  review,
  resource,
  currentUser,
  currentContent,
  onContentAccepted,
}: {
  review: BankReview;
  resource: BankResource;
  currentUser: BankUser | null;
  currentContent: string;
  onContentAccepted: (c: string) => void;
}) {
  const [generating, setGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<BankAiSuggestion | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? '';

      const res = await fetch("/api/bank/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          resource_id: resource.id,
          review_id: review.id,
          resource_text: currentContent,
          feedback: review.comment,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to generate suggestion.");
      }
      const data = await res.json();
      setSuggestion(data.suggestion);
    } catch (err: any) {
      setGenError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const formattedDate = new Date(review.created_at).toLocaleDateString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
  });

  return (
    <div className="border border-aralkada-border/10 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-aralkada-sidebar text-aralkada-main flex items-center justify-center text-xs font-bold shrink-0">
            {review.author_label.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-sm">{review.author_label}</p>
            <p className="text-xs text-aralkada-muted">{formattedDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={`w-3.5 h-3.5 ${n <= review.rating ? "text-amber-400 fill-amber-400" : "text-aralkada-muted/20"}`}
            />
          ))}
        </div>
      </div>

      {/* Comment */}
      <p className="text-sm text-aralkada-border/80 leading-relaxed">{review.comment}</p>

      {/* AI Suggestion section */}
      {currentUser && !suggestion && (
        <div>
          {genError && (
            <p className="text-xs text-rose-600 font-medium mb-2">{genError}</p>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 text-xs font-bold text-aralkada-blue hover:text-aralkada-blue/70 transition-colors disabled:opacity-60"
          >
            {generating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {generating ? "Generating suggestion…" : "Generate suggestion"}
          </button>
        </div>
      )}

      {suggestion && (
        <SuggestedEditDiff
          suggestion={suggestion}
          currentContent={currentContent}
          resourceId={resource.id}
          onAccepted={onContentAccepted}
          onRejected={() => setSuggestion(null)}
        />
      )}
    </div>
  );
}

export function ReviewPanel({
  resource,
  reviews,
  reviewsLoading,
  currentUser,
  currentContent,
  onReviewAdded,
  onContentAccepted,
}: ReviewPanelProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [authorLabel, setAuthorLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setSubmitError("Please select a star rating."); return; }
    if (!comment.trim()) { setSubmitError("Please write a comment."); return; }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? '';

      const res = await fetch("/api/bank/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          resource_id: resource.id,
          rating,
          comment: comment.trim(),
          author_label: authorLabel.trim() || "Teacher",
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to submit review.");
      }
      setRating(0);
      setComment("");
      setAuthorLabel("");
      onReviewAdded();
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing reviews */}
      {reviewsLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-aralkada-cream-pill rounded-xl animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-aralkada-muted font-medium text-center py-4">
          No reviews yet. Be the first to share feedback!
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              resource={resource}
              currentUser={currentUser}
              currentContent={currentContent}
              onContentAccepted={onContentAccepted}
            />
          ))}
        </div>
      )}

      {/* Write a review form (authenticated only) */}
      {currentUser && (
        <form onSubmit={handleSubmit} className="border-t border-aralkada-border/10 pt-4 space-y-3">
          <p className="font-bold text-sm">Write a Review</p>

          <StarInput value={rating} onChange={setRating} />

          <input
            type="text"
            placeholder="Your name (e.g. Teacher Liza M.)"
            value={authorLabel}
            onChange={(e) => setAuthorLabel(e.target.value)}
            className="aralkada-input text-sm py-2.5"
          />

          <textarea
            placeholder="Share your feedback about this resource…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="aralkada-input text-sm py-2.5 resize-none"
          />

          {submitError && (
            <p className="text-xs text-rose-600 font-medium">{submitError}</p>
          )}

          <button
            id={`submit-review-${resource.id}`}
            type="submit"
            disabled={submitting}
            className="aralkada-btn-primary text-sm flex items-center gap-2 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {submitting ? "Submitting…" : "Submit Review"}
          </button>
        </form>
      )}
    </div>
  );
}
