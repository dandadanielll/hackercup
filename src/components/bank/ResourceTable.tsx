"use client";

import React, { useState } from "react";
import { Star, ChevronDown, ChevronUp } from "lucide-react";
import { ExpandedResourceRow } from "./ExpandedResourceRow";
import type { BankResource, BankUser } from "./types";

interface ResourceTableProps {
  resources: BankResource[];
  loading: boolean;
  currentUser: BankUser | null;
  onResourceUpdated: () => void;
}

function StarRating({ value }: { value: number | null }) {
  const rounded = value ? Math.round(value * 10) / 10 : null;
  return (
    <div className="flex items-center gap-1">
      <Star className={`w-3.5 h-3.5 ${rounded ? "text-amber-400 fill-amber-400" : "text-aralkada-muted/40"}`} />
      <span className="font-bold text-sm">
        {rounded !== null ? rounded.toFixed(1) : "—"}
      </span>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export function ResourceTable({ resources, loading, currentUser, onResourceUpdated }: ResourceTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <div className="aralkada-card">
        <div className="aralkada-card-inner">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-aralkada-cream-pill rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="aralkada-card">
        <div className="aralkada-card-inner text-center py-16">
          <Star className="w-10 h-10 text-aralkada-muted/30 mx-auto mb-3" />
          <p className="font-bold text-aralkada-border text-lg mb-1">No resources yet</p>
          <p className="text-aralkada-muted text-sm font-medium">
            Be the first to share a lesson resource with the community.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="aralkada-card overflow-visible">
      {/* Table header */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm font-medium">
          <thead>
            <tr className="border-b-2 border-aralkada-border/10 bg-aralkada-cream-pill/60">
              <th className="px-5 py-3.5 font-extrabold text-xs uppercase tracking-wider text-aralkada-muted">Title</th>
              <th className="px-4 py-3.5 font-extrabold text-xs uppercase tracking-wider text-aralkada-muted">Teacher</th>
              <th className="px-4 py-3.5 font-extrabold text-xs uppercase tracking-wider text-aralkada-muted">Type</th>
              <th className="px-4 py-3.5 font-extrabold text-xs uppercase tracking-wider text-aralkada-muted">Subject</th>
              <th className="px-4 py-3.5 font-extrabold text-xs uppercase tracking-wider text-aralkada-muted">Grade</th>
              <th className="px-4 py-3.5 font-extrabold text-xs uppercase tracking-wider text-aralkada-muted">Avg Rating</th>
              <th className="px-4 py-3.5 font-extrabold text-xs uppercase tracking-wider text-aralkada-muted">Reviews</th>
              <th className="px-4 py-3.5 font-extrabold text-xs uppercase tracking-wider text-aralkada-muted">Latest Update</th>
              <th className="px-3 py-3.5 w-8" />
            </tr>
          </thead>
          <tbody>
            {resources.map((resource, idx) => {
              const isExpanded = expandedId === resource.id;
              const isLast = idx === resources.length - 1;

              return (
                <React.Fragment key={resource.id}>
                  <tr
                    onClick={() => toggleRow(resource.id)}
                    className={`cursor-pointer transition-colors hover:bg-aralkada-blue/5 ${
                      isExpanded ? "bg-aralkada-blue/5" : ""
                    } ${!isLast || isExpanded ? "border-b border-aralkada-border/10" : ""}`}
                  >
                    <td className="px-5 py-4 font-bold text-aralkada-border max-w-[220px]">
                      <span className="line-clamp-2">{resource.title}</span>
                    </td>
                    <td className="px-4 py-4 text-aralkada-border">{resource.teacher_name}</td>
                    <td className="px-4 py-4">
                      <span className="bg-aralkada-cream-pill border border-aralkada-border/20 rounded-full px-2.5 py-0.5 text-xs font-bold">
                        {resource.resource_type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-aralkada-border">{resource.subject}</td>
                    <td className="px-4 py-4 text-aralkada-muted text-xs">—</td>
                    <td className="px-4 py-4">
                      <StarRating value={resource.avg_rating} />
                    </td>
                    <td className="px-4 py-4 text-aralkada-muted font-bold">
                      {resource.review_count}
                    </td>
                    <td className="px-4 py-4 text-aralkada-muted text-xs">
                      {formatDate(resource.updated_at)}
                    </td>
                    <td className="px-3 py-4 text-aralkada-muted">
                      {isExpanded
                        ? <ChevronUp className="w-4 h-4" />
                        : <ChevronDown className="w-4 h-4" />
                      }
                    </td>
                  </tr>

                  {/* Expanded inline row */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={9} className="bg-aralkada-main/70 border-b border-aralkada-border/10">
                        <ExpandedResourceRow
                          resource={resource}
                          currentUser={currentUser}
                          onResourceUpdated={onResourceUpdated}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
