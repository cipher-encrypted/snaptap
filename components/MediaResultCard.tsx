"use client";

import React, { useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Download, Music, Play, RefreshCw, CheckCircle2, Film } from "lucide-react";
import confetti from "canvas-confetti";
import { PlatformIcon, type SupportedPlatform } from "@/components/PlatformIcons";

export interface DownloadOption {
  label: string;
  url: string;
  type: "video" | "audio";
  extension: "mp4" | "mp3";
}

export interface ExtractedMediaData {
  id: string;
  title: string;
  uploader: string;
  thumbnail: string;
  duration: number | string;
  platform: "instagram" | "tiktok" | "youtube" | "twitter" | "unknown";
  downloadOptions: DownloadOption[];
}

interface MediaResultCardProps {
  data: ExtractedMediaData;
  onReset: () => void;
}

export function MediaResultCard({ data, onReset }: MediaResultCardProps) {
  const [downloadingType, setDownloadingType] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState(false);

  // 3D Hover tilt for the thumbnail card
  const thumbX = useMotionValue(0);
  const thumbY = useMotionValue(0);
  const springThumbX = useSpring(thumbX, { stiffness: 200, damping: 20 });
  const springThumbY = useSpring(thumbY, { stiffness: 200, damping: 20 });
  const rotateThumbX = useTransform(springThumbY, [-0.5, 0.5], [8, -8]);
  const rotateThumbY = useTransform(springThumbX, [-0.5, 0.5], [-8, 8]);

  const handleThumbMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    thumbX.set((e.clientX - rect.left) / rect.width - 0.5);
    thumbY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleThumbMouseLeave = () => {
    thumbX.set(0);
    thumbY.set(0);
  };

  const handleTriggerDownload = (option: DownloadOption) => {
    setDownloadingType(option.extension);

    // Fire metallic, gold & white luxury confetti
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.65 },
      colors: ["#ffffff", "#fef08a", "#d4d4d8", "#e4e4e7", "#a1a1aa"],
      disableForReducedMotion: true,
    });

    // Generate direct download streaming endpoint URL with clean filename
    const downloadUrl = `/api/download?url=${encodeURIComponent(
      option.url
    )}&title=${encodeURIComponent(data.title)}&ext=${option.extension}`;

    // Invisible anchor technique triggers native download without redirecting or opening blank tab
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = `${data.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.${option.extension}`;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    // Set micro visual feedback
    setTimeout(() => {
      setDownloadingType(null);
      setDownloadSuccess(option.extension);
      setTimeout(() => setDownloadSuccess(null), 3000);
    }, 1200);
  };

  // Find best video and audio download options
  const videoOption =
    data.downloadOptions.find((o) => o.type === "video") ||
    data.downloadOptions[0];
  const audioOption =
    data.downloadOptions.find((o) => o.type === "audio") ||
    data.downloadOptions[1] || {
      label: "Audio Only MP3",
      url: data.downloadOptions[0]?.url || "",
      type: "audio" as const,
      extension: "mp3" as const,
    };

  const platformKey: SupportedPlatform =
    data.platform === "twitter"
      ? "x"
      : (data.platform as SupportedPlatform);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="relative w-full rounded-3xl border border-white/10 bg-zinc-900/80 p-5 sm:p-7 backdrop-blur-2xl shadow-2xl overflow-hidden text-left"
    >
      {/* Specular Ambient Edge Gradient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full bg-white/[0.03] blur-3xl" />

      <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
        {/* Left Side: Video Thumbnail with 3D Hover Tilt & Duration Pill */}
        <div style={{ perspective: 800 }} className="w-full md:w-56 shrink-0">
          <motion.div
            onMouseMove={handleThumbMouseMove}
            onMouseLeave={handleThumbMouseLeave}
            style={{
              rotateX: rotateThumbX,
              rotateY: rotateThumbY,
              transformStyle: "preserve-3d",
            }}
            className="group relative aspect-video md:aspect-[4/5] w-full rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 shadow-xl cursor-pointer"
          >
            {data.thumbnail && !thumbnailError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.thumbnail}
                alt={data.title}
                onError={() => setThumbnailError(true)}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-950/90 text-zinc-600 gap-2 p-4 text-center">
                <Film className="h-8 w-8 stroke-[1.5] text-zinc-500" />
                <span className="text-xs text-zinc-400">Lossless Stream</span>
              </div>
            )}

            {/* Dark vignette overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

            {/* Centered Play overlay glyph */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/60 border border-white/20 backdrop-blur-md shadow-lg transition-transform duration-200 group-hover:scale-110">
                <Play className="h-4 w-4 fill-white text-white ml-0.5" />
              </div>
            </div>

            {/* Duration pill tag on bottom right */}
            {data.duration && (
              <div className="absolute bottom-2.5 right-2.5 rounded-lg border border-white/10 bg-black/75 px-2 py-0.5 text-[11px] font-mono font-medium text-zinc-200 backdrop-blur-md shadow">
                {String(data.duration)}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Side: Media Details & Actions Grid */}
        <div className="flex-1 flex flex-col justify-between w-full min-w-0 space-y-5">
          {/* Top Row: Platform Badge + Creator Handle */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold tracking-wide text-zinc-200 uppercase">
                <PlatformIcon platform={platformKey} className="h-3.5 w-3.5" />
                <span>{data.platform}</span>
              </span>

              <span className="text-zinc-600">&bull;</span>

              <span className="text-xs font-medium text-zinc-400 truncate max-w-[180px] sm:max-w-[240px]">
                {data.uploader}
              </span>
            </div>

            {/* Reset "Download Another" icon button */}
            <button
              type="button"
              onClick={onReset}
              title="Download another video"
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-zinc-400 hover:text-white hover:bg-white/[0.08] hover:border-white/20 transition-all active:scale-95 shrink-0"
            >
              <RefreshCw className="h-3 w-3" />
              <span className="hidden sm:inline">New Link</span>
            </button>
          </div>

          {/* Video Title */}
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug line-clamp-2">
              {data.title}
            </h2>
            <p className="text-xs text-zinc-400 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Lossless stream ready &bull; Zero compression
            </p>
          </div>

          {/* Download Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Primary Action: Download Best Quality MP4 */}
            {videoOption && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => handleTriggerDownload(videoOption)}
                disabled={downloadingType === "mp4"}
                className="group relative flex items-center justify-between rounded-2xl bg-gradient-to-b from-white to-zinc-200 px-4 py-3.5 text-zinc-950 font-semibold shadow-[0_4px_20px_rgba(255,255,255,0.15)] transition-all hover:brightness-105 active:brightness-95 disabled:opacity-75"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900/10 text-zinc-950 transition-transform group-hover:scale-105">
                    {downloadSuccess === "mp4" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 stroke-[2.5]" />
                    ) : (
                      <Download className="h-4 w-4 stroke-[2.2]" />
                    )}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold leading-tight">
                      {downloadSuccess === "mp4"
                        ? "Downloading..."
                        : "Download Best Quality"}
                    </span>
                    <span className="text-[10px] text-zinc-600 font-mono">
                      MP4 &bull; 1080p Lossless
                    </span>
                  </div>
                </div>

                <span className="rounded-lg bg-zinc-950/10 px-2 py-0.5 text-[10px] font-mono font-medium text-zinc-800">
                  HD
                </span>
              </motion.button>
            )}

            {/* Secondary Action: Audio Only MP3 */}
            {audioOption && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => handleTriggerDownload(audioOption)}
                disabled={downloadingType === "mp3"}
                className="group relative flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-white font-medium backdrop-blur-md transition-all hover:bg-white/[0.08] hover:border-white/20 active:scale-[0.98] disabled:opacity-75"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-zinc-300 transition-transform group-hover:scale-105">
                    {downloadSuccess === "mp3" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 stroke-[2.5]" />
                    ) : (
                      <Music className="h-4 w-4 text-zinc-300 stroke-[2]" />
                    )}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-zinc-200 leading-tight">
                      {downloadSuccess === "mp3"
                        ? "Downloading..."
                        : "Download Audio Only"}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      MP3 &bull; 320kbps Audio
                    </span>
                  </div>
                </div>

                <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                  MP3
                </span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
