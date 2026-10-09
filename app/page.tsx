import React from "react";
import { ArrowDownToLine, Layers, ShieldCheck, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="relative flex-1 flex flex-col items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Subtle pill pill badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs text-zinc-300 backdrop-blur-md mb-8 shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
          <span className="flex h-1.5 w-1.5 rounded-full bg-zinc-300" />
          <span className="font-medium tracking-wide">
            Apple Spatial UI &bull; Linear Design System
          </span>
        </div>

        {/* Hero Typography */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-3xl leading-[1.08]">
          Extract media with{" "}
          <span className="bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
            tactile precision.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl leading-relaxed">
          Drop any link from Instagram, TikTok, YouTube, or X. Lossless audio
          and 4K video extraction engineered with zero friction.
        </p>

        {/* Interactive 3D Hero Stage Mount Container (Ready for Step 2) */}
        <div
          id="hero-stage-container"
          className="relative w-full max-w-2xl mt-12 sm:mt-16"
        >
          {/* Glass stage wrapper */}
          <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-[#121216]/80 to-[#0d0d10]/90 p-8 sm:p-10 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
            {/* Subtle inner top glow */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-300 shadow-inner">
                <ArrowDownToLine className="h-6 w-6 stroke-[1.75]" />
              </div>

              <div className="space-y-1.5 max-w-md">
                <h2 className="text-lg font-semibold tracking-tight text-white">
                  Hero Stage Initialized
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 leading-normal">
                  Universal link ingestion bar and 3D card tilt processor ready
                  to mount for Step 2.
                </p>
              </div>

              {/* Supported sources indicator pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {["Instagram", "TikTok", "YouTube", "X / Twitter"].map(
                  (platform) => (
                    <span
                      key={platform}
                      className="inline-flex items-center rounded-lg border border-white/5 bg-white/[0.02] px-3 py-1 text-[11px] font-medium text-zinc-400 transition-colors hover:border-white/15 hover:text-zinc-200"
                    >
                      {platform}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Value Proposition Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mt-12 pt-8 border-t border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <Zap className="h-4 w-4 text-zinc-400 shrink-0" />
            <div className="text-left">
              <div className="text-xs font-medium text-zinc-200">
                Instant Processing
              </div>
              <div className="text-[11px] text-zinc-500">Sub-second link resolution</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <ShieldCheck className="h-4 w-4 text-zinc-400 shrink-0" />
            <div className="text-left">
              <div className="text-xs font-medium text-zinc-200">
                Direct Stream
              </div>
              <div className="text-[11px] text-zinc-500">Zero compressed re-encoding</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <Layers className="h-4 w-4 text-zinc-400 shrink-0" />
            <div className="text-left">
              <div className="text-xs font-medium text-zinc-200">
                Spatial Shell
              </div>
              <div className="text-[11px] text-zinc-500">Fluid 60fps micro-physics</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
