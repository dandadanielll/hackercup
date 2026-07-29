"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Download, FileText, MessageSquare, Sparkles, Trash2, Loader2 } from "lucide-react";
import { ReviewPanel } from "./ReviewPanel";
import { OverallImprovementPanel } from "./OverallImprovementPanel";
import { supabase } from "../../lib/supabase";
import type { BankResource, BankUser, BankReview } from "./types";

interface ExpandedResourceRowProps {
  resource: BankResource;
  currentUser: BankUser | null;
  onResourceUpdated: () => void;
}

export function ExpandedResourceRow({ resource, currentUser, onResourceUpdated }: ExpandedResourceRowProps) {
  const [reviews, setReviews] = useState<BankReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [currentContent, setCurrentContent] = useState(resource.content_text);

  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`/api/bank/reviews?resource_id=${resource.id}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews ?? []);
      }
    } finally {
      setReviewsLoading(false);
    }
  }, [resource.id]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    setCurrentContent(resource.content_text);
  }, [resource.content_text]);

  const handleDownload = async (format: "pdf" | "txt") => {
    const url = `/api/bank/export?id=${resource.id}&format=${format}`;
    const link = document.createElement("a");
    link.href = url;
    link.download = `${resource.title}.${format}`;
    link.click();
  };

  const handleContentAccepted = (newContent: string) => {
    setCurrentContent(newContent);
    loadReviews();
    onResourceUpdated();
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? '';

      const res = await fetch(`/api/bank/resources/${resource.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to delete resource.");
      }

      onResourceUpdated();
    } catch (err: any) {
      setDeleteError(err.message);
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Text Preview + Download */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Preview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border-2 border-aralkada-border/15 p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-aralkada-blue" />
            <span className="font-bold text-sm text-aralkada-border">Resource Preview</span>
          </div>
          <pre className="text-xs text-aralkada-border/80 whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto">
            {currentContent}
          </pre>
        </div>

        {/* Downloads & Management */}
        <div className="flex flex-col gap-3">
          <div className="bg-white rounded-2xl border-2 border-aralkada-border/15 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Download className="w-4 h-4 text-aralkada-blue" />
              <span className="font-bold text-sm text-aralkada-border">Download</span>
            </div>
            <div className="space-y-2.5">
              <button
                id={`download-pdf-${resource.id}`}
                onClick={() => handleDownload("pdf")}
                className="aralkada-btn-primary w-full flex items-center justify-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              <button
                id={`download-txt-${resource.id}`}
                onClick={() => handleDownload("txt")}
                className="aralkada-btn-secondary w-full flex items-center justify-center gap-2 text-sm"
              >
                <FileText className="w-4 h-4" />
                Download TXT
              </button>
            </div>
          </div>

          {/* Resource metadata & Delete option */}
          <div className="bg-white rounded-2xl border-2 border-aralkada-border/15 p-5 text-xs space-y-3 font-medium text-aralkada-muted">
            <div className="space-y-1.5">
              <div><span className="font-bold text-aralkada-border">Type:</span> {resource.resource_type}</div>
              <div><span className="font-bold text-aralkada-border">Subject:</span> {resource.subject}</div>
              <div><span className="font-bold text-aralkada-border">Teacher:</span> {resource.teacher_name}</div>
            </div>

            {/* Authenticated Delete Control */}
            {currentUser && (
              <div className="pt-2 border-t border-aralkada-border/10">
                {deleteError && (
                  <p className="text-xs text-rose-600 font-bold mb-2">{deleteError}</p>
                )}

                {!confirmDelete ? (
                  <button
                    id={`delete-resource-${resource.id}`}
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Resource
                  </button>
                ) : (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 space-y-2">
                    <p className="text-xs font-bold text-rose-900">Delete this resource permanently?</p>
                    <div className="flex gap-2">
                      <button
                        id={`confirm-delete-${resource.id}`}
                        onClick={handleDelete}
                        disabled={deleting}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-1 px-2.5 rounded-lg flex items-center gap-1 disabled:opacity-60"
                      >
                        {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        {deleting ? "Deleting…" : "Yes, Delete"}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        disabled={deleting}
                        className="bg-aralkada-cream-pill hover:bg-aralkada-border/10 text-aralkada-border font-bold text-xs py-1 px-2.5 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="bg-white rounded-2xl border-2 border-aralkada-border/15 p-5">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-4 h-4 text-aralkada-blue" />
          <span className="font-bold text-sm text-aralkada-border">Peer Reviews</span>
        </div>
        <ReviewPanel
          resource={resource}
          reviews={reviews}
          reviewsLoading={reviewsLoading}
          currentUser={currentUser}
          currentContent={currentContent}
          onReviewAdded={loadReviews}
          onContentAccepted={handleContentAccepted}
        />
      </div>

      {/* Overall Improvement Plan */}
      <div className="bg-white rounded-2xl border-2 border-aralkada-border/15 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-aralkada-blue" />
          <span className="font-bold text-sm text-aralkada-border">Overall Improvement Plan</span>
        </div>
        <OverallImprovementPanel
          resource={resource}
          reviews={reviews}
          currentUser={currentUser}
          currentContent={currentContent}
          onContentAccepted={handleContentAccepted}
        />
      </div>
    </div>
  );
}
