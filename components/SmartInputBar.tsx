"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { Clipboard, Check, ArrowRight, Loader2, AlertCircle, X } from "lucide-react";
import { PlatformIcon, type SupportedPlatform } from "@/components/PlatformIcons";
import { MediaResultCard, type ExtractedMediaData } from "@/components/MediaResultCard";

const SAMPLE_URLS: Record<Exclude<SupportedPlatform, null>, string> = {
  instagram: "https://www.instagram.com/reel/C7xPqLrvN8z/",
  tiktok: "https://www.tiktok.com/@creator/video/73829104928173",
  youtube: "https://www.youtube.com/shorts/dQw4w9WgXcQ",
  x: "https://x.com/design/status/1792189402910382910",
};

const PLATFORMS_META = [
  {
    id: "instagram" as const,
    name: "Instagram",
    tagline: "Reels & Stories",
    accent: "hover:border-pink-500/30 hover:bg-pink-500/5",
  },
  {
    id: "tiktok" as const,
    name: "TikTok",
    tagline: "No Watermark HD",
    accent: "hover:border-cyan-500/30 hover:bg-cyan-500/5",
  },
  {
    id: "youtube" as const,
    name: "YouTube",
    tagline: "Shorts & 4K Video",
    accent: "hover:border-red-500/30 hover:bg-red-500/5",
  },
  {
    id: "x" as const,
    name: "X / Twitter",
    tagline: "Lossless MP4",
    accent: "hover:border-zinc-400/30 hover:bg-zinc-400/5",
  },
];

const LOADING_STAGES = [
  "Connecting to stream...",
  "Bypassing compression...",
  "Generating download stream...",
];

export function SmartInputBar() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [detectedPlatform, setDetectedPlatform] = useState<SupportedPlatform>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedState, setCopiedState] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedMediaData | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 3D Tilt Physics for the main Smart Bar
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { damping: 25, stiffness: 200 });
  const springY = useSpring(mouseY, { damping: 25, stiffness: 200 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-6, 6]);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });

  // Detect touch devices to disable heavy tilt for 60fps performance
  useEffect(() => {
    const isTouch =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches;
    setIsTouchDevice(isTouch);
  }, []);

  // Multi-step loading progression timer
  useEffect(() => {
    if (!isLoading) {
      setLoadingStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setLoadingStepIndex((prev) =>
        prev < LOADING_STAGES.length - 1 ? prev + 1 : prev
      );
    }, 1800);

    return () => clearInterval(interval);
  }, [isLoading]);

  const detectPlatform = useCallback((inputUrl: string): SupportedPlatform => {
    const clean = inputUrl.trim().toLowerCase();
    if (!clean) return null;
    if (clean.includes("instagram.com") || clean.includes("instagr.am")) return "instagram";
    if (clean.includes("youtube.com") || clean.includes("youtu.be")) return "youtube";
    if (clean.includes("tiktok.com")) return "tiktok";
    if (clean.includes("twitter.com") || clean.includes("x.com")) return "x";
    return null;
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrl(val);
    setError(null);
    setDetectedPlatform(detectPlatform(val));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);

    setGlarePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setGlarePosition({ x: 50, y: 50 });
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        setError(null);
        const platform = detectPlatform(text);
        setDetectedPlatform(platform);
        setCopiedState(true);
        setTimeout(() => setCopiedState(false), 2000);
      }
    } catch {
      setError("Please allow clipboard access or paste the link manually.");
    }
  };

  const handleExtract = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) {
      setError("Please enter a media URL to extract.");
      inputRef.current?.focus();
      return;
    }

    const platform = detectPlatform(url);
    if (!platform) {
      setError("Invalid or unsupported link. Supported: Instagram, TikTok, YouTube, and X.");
      return;
    }

    setError(null);
    setIsLoading(true);
    setLoadingStepIndex(0);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(
          payload.error || "Failed to extract media. The link may be private or inaccessible."
        );
      }

      setExtractedData(payload.data);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while extracting the media.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSample = (platform: Exclude<SupportedPlatform, null>) => {
    const sample = SAMPLE_URLS[platform];
    setUrl(sample);
    setDetectedPlatform(platform);
    setError(null);
    inputRef.current?.focus();
  };

  const handleReset = () => {
    setUrl("");
    setDetectedPlatform(null);
    setExtractedData(null);
    setError(null);
    inputRef.current?.focus();
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      {/* 3D Perspective Card Wrapper */}
      <div style={{ perspective: 1000 }} className="w-full relative">
        <motion.div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateX: isTouchDevice ? 0 : rotateX,
            rotateY: isTouchDevice ? 0 : rotateY,
            transformStyle: "preserve-3d",
          }}
          className="relative w-full rounded-2xl p-1 transition-shadow duration-300"
        >
          {/* Subtle Dynamic Glare Overlay */}
          {!isTouchDevice && (
            <div
              className="pointer-events-none absolute inset-0 rounded-2xl opacity-40 transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle 320px at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.08), transparent 80%)`,
              }}
            />
          )}

          {/* Smart Bar Main Deck */}
          <form
            onSubmit={handleExtract}
            className="relative flex items-center gap-2 sm:gap-3 rounded-2xl border border-white/10 bg-zinc-900/60 p-2 sm:p-2.5 backdrop-blur-xl shadow-2xl transition-all duration-300 focus-within:border-white/25 focus-within:shadow-[0_0_35px_rgba(255,255,255,0.06)] overflow-hidden"
          >
            {/* Indeterminate Pulsing Progress Bar when loading */}
            {isLoading && (
              <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-transparent via-white to-transparent"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.4,
                    ease: "easeInOut",
                  }}
                />
              </div>
            )}

            {/* Dynamic Platform Indicator Icon */}
            <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-zinc-800/60 transition-transform duration-200">
              <AnimatePresence mode="wait">
                <motion.div
                  key={detectedPlatform || "default"}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center justify-center"
                >
                  <PlatformIcon
                    platform={detectedPlatform}
                    className="h-5 w-5 sm:h-5 sm:w-5"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* URL Input Field */}
            <div className="relative flex-1 min-w-0">
              <input
                ref={inputRef}
                type="url"
                value={url}
                disabled={isLoading}
                onChange={handleInputChange}
                placeholder="Paste video link from Instagram, TikTok, YouTube, or X..."
                className="w-full bg-transparent px-1 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors selection:bg-white/20 disabled:opacity-60"
                autoComplete="off"
                spellCheck="false"
              />

              {/* Clear button when URL is entered and not busy */}
              {url && !isLoading && (
                <button
                  type="button"
                  onClick={() => {
                    setUrl("");
                    setDetectedPlatform(null);
                    setError(null);
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white transition-colors"
                  aria-label="Clear input"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Quick-action Paste Button */}
            {!isLoading && (
              <button
                type="button"
                onClick={handlePaste}
                title="Paste from clipboard"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-800/40 px-3 py-2 text-xs font-medium text-zinc-300 transition-all hover:border-white/20 hover:bg-zinc-800/80 hover:text-white active:scale-95 shrink-0"
              >
                {copiedState ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Pasted</span>
                  </>
                ) : (
                  <>
                    <Clipboard className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Paste</span>
                  </>
                )}
              </button>
            )}

            {/* Tactile Action Button */}
            <motion.button
              type="submit"
              whileTap={{ scale: 0.96 }}
              disabled={isLoading || !url.trim()}
              className="relative flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-white to-zinc-200 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-zinc-950 shadow-[0_4px_16px_rgba(255,255,255,0.15)] transition-all hover:brightness-105 active:brightness-95 disabled:opacity-40 disabled:pointer-events-none shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-900" />
                  <span className="min-w-[120px] text-left text-xs font-medium text-zinc-900">
                    {LOADING_STAGES[loadingStepIndex]}
                  </span>
                </>
              ) : (
                <>
                  <span>Extract</span>
                  <ArrowRight className="h-3.5 w-3.5 stroke-[2.2]" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>

      {/* Smooth Error Banner with Slide-Down Animation */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full mt-3 flex items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-200 backdrop-blur-md shadow-lg"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-200 transition-colors p-0.5"
              aria-label="Dismiss error"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Holographic Media Result Deck (When Media is Extracted) */}
      <AnimatePresence>
        {extractedData && (
          <div className="w-full mt-6">
            <MediaResultCard data={extractedData} onReset={handleReset} />
          </div>
        )}
      </AnimatePresence>

      {/* Platform Pill Badges */}
      <div className="w-full mt-7 flex flex-col items-center">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
          {PLATFORMS_META.map((item) => {
            const isCurrent = detectedPlatform === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectSample(item.id)}
                className={`group relative flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs transition-all duration-200 active:scale-95 ${
                  isCurrent
                    ? "border-white/30 bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.08)]"
                    : "border-white/5 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 " +
                      item.accent
                }`}
              >
                <PlatformIcon
                  platform={item.id}
                  className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110"
                />
                <span className="font-medium">{item.name}</span>
                <span className="hidden sm:inline-block text-[10px] text-zinc-500 transition-colors group-hover:text-zinc-400">
                  &bull; {item.tagline}
                </span>

                {/* Micro spatial glow on hover */}
                <div className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-200 group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-[11px] text-zinc-500 text-center">
          Click any badge to test sample stream &bull; Lossless audio & video resolution
        </p>
      </div>
    </div>
  );
}
