"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Download, FileText, MessageSquare, Sparkles } from "lucide-react";
import { ReviewPanel } from "./ReviewPanel";
import { OverallImprovementPanel } from "./OverallImprovementPanel";
import type { BankResource, BankUser, BankReview } from "./types";

interface ExpandedResourceRowProps {
  resource: BankResource;
  currentUser: BankUser | null;
  onResourceUpdated: () => void;
}

export function ExpandedResourceRow({ resource, currentUser, onResourceUpdated }: ExpandedResourceRowProps) {
  const [reviews, setReviews] = useState<BankReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  // Track latest content (may change after accepted AI edit)
  const [currentContent, setCurrentContent] = useState(resource.content_text);

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

  // Keep content in sync if resource prop changes (e.g. after parent reload)
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
    onResourceUpdated();
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

        {/* Downloads */}
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

          {/* Resource metadata */}
          <div className="bg-white rounded-2xl border-2 border-aralkada-border/15 p-5 text-xs space-y-2 font-medium text-aralkada-muted">
            <div><span className="font-bold text-aralkada-border">Type:</span> {resource.resource_type}</div>
            <div><span className="font-bold text-aralkada-border">Subject:</span> {resource.subject}</div>
            <div><span className="font-bold text-aralkada-border">Teacher:</span> {resource.teacher_name}</div>
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
