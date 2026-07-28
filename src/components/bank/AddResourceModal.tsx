"use client";

import React, { useState } from "react";
import { X, Upload, AlertTriangle, FileText } from "lucide-react";
import { supabase } from "../../lib/supabase";
import {
  RESOURCE_TYPES,
  SUBJECTS,
  GRADES,
  validateResourceFile,
} from "../../lib/bank/resourceInput";
import type { BankUser } from "./types";

interface AddResourceModalProps {
  currentUser: BankUser;
  onClose: () => void;
  onResourceAdded: () => void;
}

type Phase = 'idle' | 'extracting' | 'publishing';

export function AddResourceModal({ currentUser, onClose, onResourceAdded }: AddResourceModalProps) {
  const [file, setFile] = useState<File | null>(null);
  // All metadata fields start blank — teacher must choose/type them manually
  const [teacherName, setTeacherName] = useState("");
  const [title, setTitle] = useState("");
  const [resourceType, setResourceType] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [gradeLevel, setGradeLevel] = useState<string>("");
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);

  const loading = phase !== 'idle';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;

    // Validate before accepting the file
    const validationError = validateResourceFile(f);
    if (validationError) {
      setError(validationError);
      setFile(null);
      e.target.value = '';
      return;
    }

    setError(null);
    setFile(f);
    // No autofill of title or any other field
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Explicit field-specific validation
    if (!file) { setError("Please select a file to upload."); return; }
    if (!teacherName.trim()) { setError("Teacher Name is required."); return; }
    if (!title.trim()) { setError("Title is required."); return; }
    if (!resourceType) { setError("Please select a Resource Type."); return; }
    if (!subject) { setError("Please select a Subject."); return; }
    if (!gradeLevel) { setError("Please select a Grade Level."); return; }

    setError(null);
    setPhase('extracting');

    try {
      // Phase 1: Extract text
      const formData = new FormData();
      formData.append("file", file);
      const extractRes = await fetch("/api/extract", { method: "POST", body: formData });
      if (!extractRes.ok) {
        const j = await extractRes.json().catch(() => ({}));
        if (j.stage === 'extraction') {
          throw new Error(`Extraction failed: ${j.error || "Could not read file text."}`);
        }
        throw new Error(j.error || "Could not extract text from the file.");
      }
      const { extractedText } = await extractRes.json();

      // Phase 2: Save resource
      setPhase('publishing');
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
        const stageLabel = j.stage === 'configuration' ? 'configuration' :
                           j.stage === 'metadata' ? 'metadata' : 'save';
        throw new Error(`Publishing failed (${stageLabel}): ${j.error || "Could not save resource."}`);
      }

      onResourceAdded();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setPhase('idle');
    }
  };

  const phaseLabel =
    phase === 'extracting' ? "Extracting file…" :
    phase === 'publishing' ? "Publishing resource…" :
    "Publish Resource";

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
              disabled={loading}
              className="p-2 rounded-full hover:bg-aralkada-cream-pill transition-colors disabled:opacity-40"
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
                      Click to upload PDF, DOCX, or TXT (max 5 MB)
                    </span>
                  </>
                )}
                <input
                  id="resource-file"
                  type="file"
                  accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  className="sr-only"
                  onChange={handleFileChange}
                  disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>

            {/* Type + Subject row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold mb-1.5" htmlFor="resource-type">
                  Type *
                </label>
                <select
                  id="resource-type"
                  value={resourceType}
                  required
                  onChange={(e) => setResourceType(e.target.value)}
                  className="aralkada-input"
                  disabled={loading}
                >
                  <option value="" disabled>Select a type</option>
                  {RESOURCE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5" htmlFor="resource-subject">
                  Subject *
                </label>
                <select
                  id="resource-subject"
                  value={subject}
                  required
                  onChange={(e) => setSubject(e.target.value)}
                  className="aralkada-input"
                  disabled={loading}
                >
                  <option value="" disabled>Select a subject</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grade */}
            <div>
              <label className="block text-sm font-bold mb-1.5" htmlFor="resource-grade">
                Grade Level *
              </label>
              <select
                id="resource-grade"
                value={gradeLevel}
                required
                onChange={(e) => setGradeLevel(e.target.value)}
                className="aralkada-input"
                disabled={loading}
              >
                <option value="" disabled>Select a grade level</option>
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
                disabled={loading}
                className="aralkada-btn-secondary flex-1 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                id="resource-submit-btn"
                type="submit"
                disabled={loading}
                className="aralkada-btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {phaseLabel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
