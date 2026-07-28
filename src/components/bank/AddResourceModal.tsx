"use client";

import React, { useState } from "react";
import { X, Upload, AlertTriangle, FileText } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { BankUser } from "./types";

interface AddResourceModalProps {
  currentUser: BankUser;
  onClose: () => void;
  onResourceAdded: () => void;
}

const SUBJECTS = ["Numeracy", "Literacy", "Science", "Filipino"] as const;
const RESOURCE_TYPES = ["Module", "Lesson Plan"] as const;
const GRADES = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"] as const;

export function AddResourceModal({ currentUser, onClose, onResourceAdded }: AddResourceModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [teacherName, setTeacherName] = useState("");
  const [title, setTitle] = useState("");
  const [resourceType, setResourceType] = useState<typeof RESOURCE_TYPES[number]>("Lesson Plan");
  const [subject, setSubject] = useState<typeof SUBJECTS[number]>("Numeracy");
  const [gradeLevel, setGradeLevel] = useState<typeof GRADES[number]>("Grade 3");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f && !title) {
      // Auto-fill title from file name
      setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError("Please select a file."); return; }
    if (!teacherName.trim()) { setError("Please enter your teacher name."); return; }
    if (!title.trim()) { setError("Please enter a title."); return; }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Extract text via existing pipeline
      const formData = new FormData();
      formData.append("file", file);
      const extractRes = await fetch("/api/extract", { method: "POST", body: formData });
      if (!extractRes.ok) {
        const j = await extractRes.json().catch(() => ({}));
        throw new Error(j.error || "Failed to extract text from file.");
      }
      const { extractedText } = await extractRes.json();

      // Step 2: Save resource to Supabase via our API
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? '';

      const saveRes = await fetch("/api/bank/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          teacher_name: teacherName.trim(),
          title: title.trim(),
          resource_type: resourceType,
          subject,
          grade_level: gradeLevel,
          content_text: extractedText,
        }),
      });

      if (!saveRes.ok) {
        const j = await saveRes.json().catch(() => ({}));
        throw new Error(j.error || "Failed to save resource.");
      }

      onResourceAdded();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-aralkada-border/40 backdrop-blur-sm">
      <div className="aralkada-card w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="aralkada-card-inner">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-extrabold">Add Resource</h2>
              <p className="text-aralkada-muted text-sm font-medium mt-0.5">
                Upload a PDF, DOCX, or TXT file to share with the community.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-aralkada-cream-pill transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-300 rounded-xl p-3 mb-4 text-rose-800 text-sm font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* File picker */}
            <div>
              <label className="block text-sm font-bold mb-1.5">File *</label>
              <label
                htmlFor="resource-file"
                className={`flex items-center gap-3 border-2 border-dashed rounded-2xl p-4 cursor-pointer transition-colors ${
                  file
                    ? "border-aralkada-blue bg-aralkada-blue/5"
                    : "border-aralkada-border/40 hover:border-aralkada-blue/50 hover:bg-aralkada-blue/5"
                }`}
              >
                {file ? (
                  <>
                    <FileText className="w-6 h-6 text-aralkada-blue shrink-0" />
                    <span className="font-medium text-sm truncate">{file.name}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-aralkada-muted shrink-0" />
                    <span className="text-aralkada-muted text-sm font-medium">
                      Click to upload PDF, DOCX, or TXT (max 5MB)
                    </span>
                  </>
                )}
                <input
                  id="resource-file"
                  type="file"
                  accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {/* Teacher name */}
            <div>
              <label className="block text-sm font-bold mb-1.5" htmlFor="resource-teacher">
                Teacher Name *
              </label>
              <input
                id="resource-teacher"
                type="text"
                required
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="aralkada-input"
                placeholder="e.g. Ma. Clara Reyes"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-bold mb-1.5" htmlFor="resource-title">
                Title *
              </label>
              <input
                id="resource-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="aralkada-input"
                placeholder="e.g. Pagbibilang ng Piso: Grade 3 Numeracy Module"
              />
            </div>

            {/* Type + Subject row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold mb-1.5" htmlFor="resource-type">
                  Type
                </label>
                <select
                  id="resource-type"
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value as typeof RESOURCE_TYPES[number])}
                  className="aralkada-input"
                >
                  {RESOURCE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5" htmlFor="resource-subject">
                  Subject
                </label>
                <select
                  id="resource-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as typeof SUBJECTS[number])}
                  className="aralkada-input"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grade */}
            <div>
              <label className="block text-sm font-bold mb-1.5" htmlFor="resource-grade">
                Grade Level <span className="font-normal text-aralkada-muted">(reserved)</span>
              </label>
              <select
                id="resource-grade"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value as typeof GRADES[number])}
                className="aralkada-input"
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="aralkada-btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                id="resource-submit-btn"
                type="submit"
                disabled={loading}
                className="aralkada-btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? "Uploading…" : "Publish Resource"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
