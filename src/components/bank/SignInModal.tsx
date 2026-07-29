"use client";

import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { X, LogIn, AlertTriangle } from "lucide-react";
import type { BankUser } from "./types";

interface SignInModalProps {
  onClose: () => void;
  onSignedIn: (user: BankUser) => void;
}

export function SignInModal({ onClose, onSignedIn }: SignInModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError || !data.user) {
      setError(authError?.message || "Sign-in failed. Please check your credentials.");
      setLoading(false);
      return;
    }

    onSignedIn({ id: data.user.id, email: data.user.email ?? "" });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-aralkada-border/40 backdrop-blur-sm">
      <div className="aralkada-card w-full max-w-md mx-4 shadow-2xl">
        <div className="aralkada-card-inner">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-extrabold">Sign in to continue</h2>
              <p className="text-aralkada-muted text-sm font-medium mt-0.5">
                Only verified teachers can add resources or submit reviews.
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1.5" htmlFor="signin-email">
                Email
              </label>
              <input
                id="signin-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="aralkada-input"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5" htmlFor="signin-password">
                Password
              </label>
              <input
                id="signin-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="aralkada-input"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              id="signin-submit-btn"
              disabled={loading}
              className="aralkada-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <LogIn className="w-4 h-4" />
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
