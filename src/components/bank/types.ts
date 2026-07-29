// Shared TypeScript types for the LokalBank feature

export interface BankUser {
  id: string;
  email: string;
}

export interface BankResource {
  id: string;
  uploader_id: string;
  teacher_name: string;
  title: string;
  resource_type: 'Module' | 'Lesson Plan';
  subject: 'Numeracy' | 'Literacy' | 'Science' | 'Filipino';
  grade_level: string | null;
  content_text: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  // Computed aggregates joined from bank_reviews
  avg_rating: number | null;
  review_count: number;
}

export interface BankReview {
  id: string;
  resource_id: string;
  author_id: string;
  author_label: string;
  rating: number;
  comment: string;
  created_at: string;
}

export type NoChangeSuggestionJson = {
  outcome: 'no_change';
  feedback_summary: string;
  reason_no_change: string;
  teacher_action: string;
};

export type ActionableSuggestionJson = {
  outcome: 'actionable';
  feedback_summary: string;
  issue_identified: string;
  evidence_from_review: string;
  edit_kind: 'replace' | 'append';
  target_excerpt: string | null;
  replacement_text: string;
  teacher_action: string;
};

export type SuggestionJson = NoChangeSuggestionJson | ActionableSuggestionJson;

export interface BankAiSuggestion {
  id: string;
  resource_id: string;
  review_id: string | null;
  feedback_snapshot: string;
  suggestion_json: SuggestionJson;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}
