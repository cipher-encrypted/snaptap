import { NextRequest, NextResponse } from "next/server";
import { ApifyClient } from "apify-client";

export const maxDuration = 60;

export type SupportedPlatform = "instagram" | "tiktok" | "youtube" | "twitter" | "unknown";

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
  platform: SupportedPlatform;
  downloadOptions: DownloadOption[];
}

function detectPlatform(urlStr: string): SupportedPlatform | null {
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase();
    if (host.includes("instagram.com") || host.includes("instagr.am")) return "instagram";
    if (host.includes("tiktok.com")) return "tiktok";
    if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
    if (host.includes("twitter.com") || host.includes("x.com")) return "twitter";
    return null;
  } catch {
    return null;
  }
}

function normalizeActorItem(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: Record<string, any>,
  rawUrl: string,
  platform: SupportedPlatform
): ExtractedMediaData | null {
  if (!item || typeof item !== "object") return null;

  // Extract ID
  const id =
    String(
      item.id ||
      item.video_id ||
      item.videoId ||
      item.code ||
      Date.now()
    );

  // Extract Title / Caption
  const title =
    item.title ||
    item.video_title ||
    item.caption ||
    item.description ||
    item.text ||
    `Media from ${platform.toUpperCase()}`;

  // Extract Uploader / Channel
  const uploader =
    item.uploader ||
    item.author?.name ||
    item.author?.uniqueId ||
    item.author ||
    item.channel_title ||
    item.channel ||
    item.username ||
    item.owner?.username ||
    "@creator";

  // Extract Thumbnail
  const thumbnail =
    item.thumbnail ||
    item.thumbnail_url ||
    item.thumbnailUrl ||
    item.cover ||
    item.cover_url ||
    item.image ||
    item.display_url ||
    "";

  // Extract Duration
  const duration =
    item.duration ||
    item.duration_string ||
    item.durationSeconds ||
    item.length_seconds ||
    "00:00";

  // Discover best video URL
  let bestVideoUrl =
    item.video_url ||
    item.videoUrl ||
    item.download_url ||
    item.downloadUrl ||
    item.direct_url ||
    item.media_url ||
    item.url ||
    "";

  // Check formats array if video URL not found directly
  if (!bestVideoUrl && Array.isArray(item.formats)) {
    const videoFormat = item.formats
      .slice()
      .reverse()
      .find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (f: any) =>
          f?.url &&
          (f?.ext === "mp4" ||
            f?.vcodec !== "none" ||
            f?.protocol?.includes("http"))
      );
    if (videoFormat?.url) {
      bestVideoUrl = videoFormat.url;
    }
  }

  // Check medias array (some scrapers return medias array)
  if (!bestVideoUrl && Array.isArray(item.medias)) {
    const mediaItem = item.medias.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (m: any) => m?.url && (m?.type === "video" || m?.extension === "mp4")
    );
    if (mediaItem?.url) {
      bestVideoUrl = mediaItem.url;
    }
  }

  // Discover audio URL
  let audioUrl =
    item.audio_url ||
    item.audioUrl ||
    item.sound_url ||
    item.music?.play_url ||
    item.music_url ||
    "";

  if (!audioUrl && Array.isArray(item.formats)) {
    const audioFormat = item.formats.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (f: any) =>
        f?.url &&
        (f?.ext === "m4a" ||
          f?.ext === "mp3" ||
          f?.vcodec === "none" ||
          f?.acodec !== "none")
    );
    if (audioFormat?.url) {
      audioUrl = audioFormat.url;
    }
  }

  if (!bestVideoUrl && !audioUrl) {
    return null;
  }

  const finalVideoUrl = bestVideoUrl || audioUrl;
  const finalAudioUrl = audioUrl || bestVideoUrl;

  const downloadOptions: DownloadOption[] = [
    {
      label: "1080p / Best Quality MP4",
      url: finalVideoUrl,
      type: "video",
      extension: "mp4",
    },
    {
      label: "Audio Only MP3",
      url: finalAudioUrl,
      type: "audio",
      extension: "mp3",
    },
  ];

  return {
    id,
    title: String(title).slice(0, 200),
    uploader: String(uploader),
    thumbnail: String(thumbnail),
    duration,
    platform,
    downloadOptions,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body.url !== "string" || !body.url.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request. Please provide a valid media URL in { url: string }.",
        },
        { status: 400 }
      );
    }

    const inputUrl = body.url.trim();
    const platform = detectPlatform(inputUrl);

    if (!platform) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unsupported platform. Please provide a valid video link from Instagram, TikTok, YouTube, or X (Twitter).",
        },
        { status: 400 }
      );
    }

    const token = process.env.APIFY_API_TOKEN;
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error: APIFY_API_TOKEN is missing.",
        },
        { status: 500 }
      );
    }

    const client = new ApifyClient({ token });

    const primaryActor = "moving_beacon-owner1/my-actor-58";
    const fallbackActor = "scrapepilot/download-from-any-website-youtube-tiktok-ig-1000";

    const actorInput = {
      urls: [inputUrl],
      mode: "best_video",
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let items: any[] = [];

    // Attempt run on primary actor
    try {
      const run = await client.actor(primaryActor).call(actorInput, {
        timeout: 45,
      });

      if (run.defaultDatasetId) {
        const dataset = await client.dataset(run.defaultDatasetId).listItems();
        items = dataset.items || [];
      }
    } catch (primaryErr) {
      console.warn(`Primary actor (${primaryActor}) call failed:`, primaryErr);

      // Attempt fallback actor
      try {
        const fallbackRun = await client.actor(fallbackActor).call(actorInput, {
          timeout: 45,
        });

        if (fallbackRun.defaultDatasetId) {
          const dataset = await client
            .dataset(fallbackRun.defaultDatasetId)
            .listItems();
          items = dataset.items || [];
        }
      } catch (fallbackErr) {
        console.error(`Fallback actor (${fallbackActor}) also failed:`, fallbackErr);
        return NextResponse.json(
          {
            success: false,
            error:
              "Extraction service currently unavailable. The media host may be rate-limiting or down.",
          },
          { status: 500 }
        );
      }
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No downloadable media found for this link. The post may be private, expired, or deleted.",
        },
        { status: 404 }
      );
    }

    // Normalize output from dataset
    const normalizedData = normalizeActorItem(items[0], inputUrl, platform);

    if (!normalizedData) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Could not parse a direct media stream from the provided link. It might be private or region-restricted.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: normalizedData,
    });
  } catch (error: unknown) {
    console.error("Unhandled error in /api/extract:", error);
    const message =
      error instanceof Error ? error.message : "Internal extraction error occurred.";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
