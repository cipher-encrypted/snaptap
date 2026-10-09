import React from "react";
import { SmartInputBar } from "@/components/SmartInputBar";
import { Zap, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="relative flex-1 flex flex-col items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center pt-10 pb-20 sm:pt-16 sm:pb-28">
        {/* Subtle Spatial Status Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs text-zinc-300 backdrop-blur-md mb-8 shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
          <Sparkles className="h-3.5 w-3.5 text-zinc-300" />
          <span className="font-medium tracking-wide">
            Spatial Media Utility &bull; v1.0
          </span>
        </div>

        {/* Hero Section Typography */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-3xl leading-[1.08]">
          <span className="bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Save moments from anywhere.
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-zinc-400 max-w-2xl leading-relaxed">
          Universal media extractor with zero compression. Instant, tactile, and frictionless.
        </p>

        {/* Central 3D Interactive Input Stage */}
        <div className="w-full mt-10 sm:mt-14">
          <SmartInputBar />
        </div>

        {/* Value Proposition Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full max-w-3xl mt-14 pt-8 border-t border-white/5">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900/40 border border-white/5 backdrop-blur-md">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/5 text-zinc-300">
              <Zap className="h-4 w-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold text-zinc-200">
                Sub-Second Ingestion
              </div>
              <div className="text-[11px] text-zinc-400">Zero queue delay resolution</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900/40 border border-white/5 backdrop-blur-md">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/5 text-zinc-300">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold text-zinc-200">
                Direct Stream
              </div>
              <div className="text-[11px] text-zinc-400">Pure lossless media bitrates</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900/40 border border-white/5 backdrop-blur-md">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/5 text-zinc-300">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold text-zinc-200">
                Universal Support
              </div>
              <div className="text-[11px] text-zinc-400">Reels, Shorts, HD & Lossless MP3</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
