"use client";

import React from 'react';
import { BookOpen, Star, GraduationCap } from 'lucide-react';

export type Workspace = 'lokalswap' | 'bayanquest' | 'lokalbank';

interface SidebarProps {
  activeWorkspace: Workspace;
  onWorkspaceChange: (w: Workspace) => void;
}

export function Sidebar({ activeWorkspace, onWorkspaceChange }: SidebarProps) {
  const navItems: { id: Workspace; icon: React.ElementType; label: string }[] = [
    { id: 'lokalswap',  icon: GraduationCap, label: 'LokalSwap' },
    { id: 'bayanquest', icon: BookOpen,       label: 'BayanQuest' },
    { id: 'lokalbank',  icon: Star,           label: 'LokalBank' },
  ];

  return (
    <div className="w-[260px] bg-aralkada-sidebar h-full flex flex-col text-aralkada-main border-r-2 border-aralkada-border shrink-0">
      {/* Logo / App name */}
      <div className="px-6 pt-7 pb-2">
        <span className="text-aralkada-main font-extrabold text-lg tracking-tight opacity-80">
          AralKada
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeWorkspace === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onWorkspaceChange(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-full font-bold cursor-pointer transition-all duration-150 text-left ${
                isActive
                  ? 'bg-aralkada-cream-pill text-aralkada-sidebar shadow-sm'
                  : 'text-aralkada-main/70 hover:text-aralkada-main hover:bg-white/5'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
