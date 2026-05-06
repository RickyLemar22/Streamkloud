import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

export function Logo({ className, iconOnly = false }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-x-3 select-none", className)}>
      <div className="relative w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center">
        {/* Logo Background with Gradient */}
        <div className="absolute inset-0 bg-warm-gradient rounded-xl rotate-6 group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-orange-500/20" />
        <div className="absolute inset-0 bg-black rounded-xl -rotate-3 group-hover:-rotate-6 transition-transform duration-300" />
        
        {/* Stylized 'K' Icon */}
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="w-6 h-6 lg:w-7 lg:h-7 text-orange-500 relative z-10"
        >
          <path d="M4 4v16" />
          <path d="m12 12 8-8" />
          <path d="m12 12 8 8" />
          <path d="M4 12h8" />
        </svg>

        {/* Decorative Sound Waves */}
        <div className="absolute -right-1 -top-1 flex gap-0.5">
          <div className="w-1 h-3 bg-orange-500/40 rounded-full animate-pulse" />
          <div className="w-1 h-5 bg-orange-500/60 rounded-full animate-pulse delay-75" />
          <div className="w-1 h-4 bg-orange-500/40 rounded-full animate-pulse delay-150" />
        </div>
      </div>

      {!iconOnly && (
        <span className="text-2xl lg:text-3xl font-black tracking-tighter text-white">
          Stream<span className="text-orange-500">Kloud</span>
        </span>
      )}
    </div>
  );
}
