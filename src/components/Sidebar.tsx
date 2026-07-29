"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Star, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react';
import KonLogo from '../utils/Kon.png';

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [transitionEnabled, setTransitionEnabled] = useState(false);

  useEffect(() => {
    const storedState = localStorage.getItem("sidebar-collapsed");
    if (storedState !== null) {
      setIsCollapsed(JSON.parse(storedState));
    }
    const timer = setTimeout(() => {
      setTransitionEnabled(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleToggle = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("sidebar-collapsed", JSON.stringify(nextState));
  };

  const navItems = [
    { icon: GraduationCap, label: 'KonTeksto', href: '/' },
    { icon: BookOpen, label: 'Tuklas', href: '/bayanquest' },
    { icon: Star, label: 'LokalBank', href: '#' },
  ];

  return (
    <aside className={`
      ${isCollapsed ? 'md:w-24' : 'md:w-[260px]'} 
      w-full h-auto md:h-full 
      bg-aralkada-sidebar flex flex-row md:flex-col text-aralkada-main shrink-0 relative z-50 
      ${transitionEnabled ? 'transition-all duration-300' : 'transition-none [&_*]:!transition-none'}
      order-last md:order-first pb-2 md:pb-0 pt-2 md:pt-0 border-t-2 md:border-t-0 border-aralkada-border
    `}>
      
      {/* Toggle Button (Hidden on Mobile) */}
      <button
        onClick={handleToggle}
        className="hidden md:block absolute -right-3 top-16 z-50 bg-aralkada-sidebar border-2 border-aralkada-border rounded-full p-1 shadow-md text-aralkada-cream-pill hover:bg-aralkada-main hover:text-aralkada-sidebar transition-all"
      >
        {isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
      </button>

      {/* Logo Placeholder (Hidden on Mobile) */}
      <Link href="/" className="hidden md:flex px-6 pt-12 pb-6 items-center cursor-pointer overflow-hidden h-[120px]">
        <div className="w-12 h-12 flex items-center justify-center shrink-0 overflow-hidden">
          <img src={KonLogo.src} alt="Kon Mascot Logo" className="w-full h-full object-contain" />
        </div>
        <div className={`overflow-hidden transition-all duration-300 flex items-center ${isCollapsed ? 'w-0 opacity-0 pointer-events-none ml-0' : 'w-48 opacity-100 ml-4'}`}>
          <span className="font-extrabold text-2xl tracking-tighter text-aralkada-cream-pill whitespace-nowrap mt-1">KonTeksto</span>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 flex flex-row md:flex-col justify-around md:justify-center px-2 md:px-4 space-x-1 md:space-x-0 space-y-0 md:space-y-2 mt-0 md:mt-0 overflow-x-auto md:overflow-y-auto items-center md:items-stretch md:-translate-y-8">
        {navItems.map((item, i) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
          
          return (
            <Link
              key={i}
              href={item.href}
              title={isCollapsed ? item.label : ""}
              className={`flex flex-col md:flex-row items-center justify-center px-4 py-2 md:py-4 rounded-xl md:rounded-full font-bold cursor-pointer transition-colors flex-1 md:flex-none max-w-[120px] md:max-w-none ${
                isActive 
                  ? 'bg-aralkada-cream-pill text-aralkada-sidebar' 
                  : 'text-aralkada-main/70 hover:text-aralkada-main md:hover:bg-white/5'
              }`}
            >
              <div className="shrink-0 w-6 flex items-center justify-center mb-1 md:mb-0">
                <Icon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <div className={`
                md:overflow-hidden md:transition-all md:duration-300 
                ${isCollapsed ? 'md:w-0 md:opacity-0 md:ml-0' : 'md:w-44 md:opacity-100 md:ml-4'}
                text-[10px] md:text-base leading-none md:leading-normal
                ${isActive ? 'opacity-100' : 'opacity-70 md:opacity-100'}
              `}>
                <span className="truncate whitespace-nowrap">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
