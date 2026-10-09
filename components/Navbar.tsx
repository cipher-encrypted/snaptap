"use client";

import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

function GithubIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-5 z-50 w-full px-4 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <nav
          aria-label="Main Navigation"
          className="glass-pill flex items-center justify-between px-4 sm:px-6 py-3 rounded-2xl transition-all duration-300"
        >
          {/* Brand Mark & Typography */}
          <Link
            href="/"
            className="group flex items-center gap-2.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40 rounded-lg p-1 -m-1"
          >
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-b from-zinc-700/60 to-zinc-900/90 border border-white/15 shadow-[0_2px_10px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-105">
              {/* Geometric Shutter / Stream Icon */}
              <div className="relative flex items-center justify-center">
                <div className="h-3 w-3 rounded-[3px] rotate-45 border border-white/80 bg-white/10" />
                <div className="absolute h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-white transition-colors group-hover:text-zinc-200">
                Snaptap
              </span>
              <span className="hidden sm:inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium tracking-wide text-zinc-400">
                v1.0
              </span>
            </div>
          </Link>

          {/* Center: Live System Status Pill */}
          <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3.5 py-1.5 text-xs text-zinc-300 shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/75 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
            </span>
            <span className="text-[11px] font-medium tracking-wide text-zinc-300">
              Snaptap Engine Ready
            </span>
            <span className="text-zinc-600">|</span>
            <span className="flex items-center gap-1 text-[11px] text-zinc-400">
              <Sparkles className="h-3 w-3 text-zinc-400" />
              Lossless Media
            </span>
          </div>

          {/* Right Actions: Mobile indicator + GitHub Link */}
          <div className="flex items-center gap-3">
            <div className="flex md:hidden items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Ready</span>
            </div>

            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View Snaptap on GitHub"
              className="group relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-zinc-900/60 text-zinc-400 transition-all duration-200 hover:border-white/25 hover:bg-zinc-800/80 hover:text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
            >
              <GithubIcon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
