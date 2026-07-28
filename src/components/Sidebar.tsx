import React from 'react';
import { BookOpen, Brain, Star, GraduationCap, FileText, Languages } from 'lucide-react';

export function Sidebar() {
  const navItems = [
    { icon: GraduationCap, label: 'LokalSwap', active: true },
    { icon: BookOpen, label: 'BayanQuest', active: false },
    { icon: Star, label: 'LokalBank', active: false },
  ];

  return (
    <div className="w-[260px] bg-aralkada-sidebar h-full flex flex-col text-aralkada-main border-r-2 border-aralkada-border shrink-0">
      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 mt-8">
        {navItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className={`flex items-center gap-4 px-4 py-3 rounded-full font-bold cursor-pointer transition-colors ${
                item.active 
                  ? 'bg-aralkada-cream-pill text-aralkada-sidebar' 
                  : 'text-aralkada-main/70 hover:text-aralkada-main hover:bg-white/5'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={item.active ? 2.5 : 2} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>

    </div>
  );
}
