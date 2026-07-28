"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Brain, Star, GraduationCap, FileText, Languages } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { icon: GraduationCap, label: 'LokalSwap', href: '/' },
    { icon: BookOpen, label: 'BayanQuest', href: '/bayanquest' },
    { icon: Star, label: 'LokalBank', href: '#' },
  ];

  return (
    <div className="w-[260px] bg-aralkada-sidebar h-full flex flex-col text-aralkada-main border-r-2 border-aralkada-border shrink-0">
      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 mt-8">
        {navItems.map((item, i) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
          
          return (
            <Link
              key={i}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-full font-bold cursor-pointer transition-colors ${
                isActive 
                  ? 'bg-aralkada-cream-pill text-aralkada-sidebar' 
                  : 'text-aralkada-main/70 hover:text-aralkada-main hover:bg-white/5'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
}
