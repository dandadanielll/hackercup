"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { Star, Plus, Library, LogOut } from "lucide-react";
import { SignInModal } from "./SignInModal";
import { AddResourceModal } from "./AddResourceModal";
import { ResourceTable } from "./ResourceTable";
import type { BankResource, BankUser } from "./types";

export function LokalBankWorkspace() {
  const [resources, setResources] = useState<BankResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<BankUser | null>(null);

  const [showSignIn, setShowSignIn] = useState(false);
  const [showAddResource, setShowAddResource] = useState(false);

  // Load session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser({ id: session.user.id, email: session.user.email ?? "" });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({ id: session.user.id, email: session.user.email ?? "" });
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadResources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bank/resources");
      if (!res.ok) throw new Error("Failed to load resources");
      const data = await res.json();
      setResources(data.resources ?? []);
    } catch (err: any) {
      setError(err.message || "Could not load community resources.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const handleAddResourceClick = () => {
    if (!currentUser) {
      setShowSignIn(true);
    } else {
      setShowAddResource(true);
    }
  };

  const handleSignedIn = (user: BankUser) => {
    setCurrentUser(user);
    setShowSignIn(false);
    setShowAddResource(true);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const handleResourceAdded = () => {
    setShowAddResource(false);
    loadResources();
  };

  return (
    <div className="min-h-full px-8 py-10 max-w-[1200px] mx-auto">
      {/* Page Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 bg-aralkada-cream-pill px-4 py-1.5 rounded-full border-2 border-aralkada-border font-extrabold text-[10px] tracking-widest text-aralkada-sidebar mb-4 uppercase">
          <Library className="w-3.5 h-3.5" />
          Community Vault
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-3">LokalBank</h1>
            <p className="text-aralkada-muted font-medium text-lg">
              Browse, rate, and share community lesson resources built for Filipino classrooms.
            </p>
          </div>

          {/* Auth + Add Resource controls */}
          <div className="flex items-center gap-3 shrink-0 mt-1">
            {currentUser && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-aralkada-muted bg-aralkada-cream-pill px-3 py-1.5 rounded-full border border-aralkada-border/30">
                  {currentUser.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-full border-2 border-aralkada-border/40 hover:bg-white/30 transition-all"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4 text-aralkada-muted" />
                </button>
              </div>
            )}
            <button
              id="add-resource-btn"
              onClick={handleAddResourceClick}
              className="aralkada-btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Resource
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="aralkada-card bg-rose-50 border-rose-400 !p-4 mb-6 text-rose-800 font-medium text-sm">
          {error}{" "}
          <button onClick={loadResources} className="underline font-bold ml-1">
            Retry
          </button>
        </div>
      )}

      {/* Resource Table */}
      <ResourceTable
        resources={resources}
        loading={loading}
        currentUser={currentUser}
        onResourceUpdated={loadResources}
      />

      {/* Modals */}
      {showSignIn && (
        <SignInModal
          onClose={() => setShowSignIn(false)}
          onSignedIn={handleSignedIn}
        />
      )}
      {showAddResource && currentUser && (
        <AddResourceModal
          currentUser={currentUser}
          onClose={() => setShowAddResource(false)}
          onResourceAdded={handleResourceAdded}
        />
      )}
    </div>
  );
}
