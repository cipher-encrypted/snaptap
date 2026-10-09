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
  duration: string;
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
  const id = String(
    item.video_id ||
    item.id ||
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
    item.duration_string ||
    item.duration ||
    (item.duration_seconds
      ? `${Math.floor(item.duration_seconds / 60)}:${String(
          Math.floor(item.duration_seconds % 60)
        ).padStart(2, "0")}`
      : "") ||
    "00:00";

  // Discover best video stream URL
  let bestVideoUrl =
    item.best_video_url ||
    item.video_url ||
    item.videoUrl ||
    item.download_url ||
    item.downloadUrl ||
    item.direct_url ||
    item.media_url ||
    item.public_url ||
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
          (f?.ext === "mp4" || f?.vcodec !== "none" || f?.protocol?.includes("http"))
      );
    if (videoFormat?.url) {
      bestVideoUrl = videoFormat.url;
    }
  }

  // Check formats_available array if present
  if (!bestVideoUrl && Array.isArray(item.formats_available)) {
    const videoFormat = item.formats_available
      .slice()
      .reverse()
      .find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (f: any) => f?.url && (f?.ext === "mp4" || f?.vcodec !== "none")
      );
    if (videoFormat?.url) {
      bestVideoUrl = videoFormat.url;
    }
  }

  // Check medias array
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
  let bestAudioUrl =
    item.best_audio_url ||
    item.audio_url ||
    item.audioUrl ||
    item.sound_url ||
    item.music?.play_url ||
    item.music_url ||
    "";

  if (!bestAudioUrl && Array.isArray(item.formats)) {
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
      bestAudioUrl = audioFormat.url;
    }
  }

  if (!bestVideoUrl && !bestAudioUrl) {
    return null;
  }

  const finalVideoUrl = bestVideoUrl || bestAudioUrl;
  const finalAudioUrl = bestAudioUrl || bestVideoUrl;

  return {
    id,
    title: String(title).slice(0, 200),
    uploader: String(uploader),
    thumbnail: String(thumbnail),
    duration: String(duration),
    platform,
    downloadOptions: [
      {
        label: "Best Quality MP4",
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
    ],
  };
}

// Fallback: Directly query public Cobalt instances
async function queryCobaltFallback(
  targetUrl: string,
  platform: SupportedPlatform
): Promise<ExtractedMediaData | null> {
  const cobaltEndpoints = [
    "https://co.wuk.sh/api/json",
    "https://api.cobalt.tools/api/json",
    "https://cobalt-api.kwiatekm.tokyo/api/json",
    "https://cobalt.tools/api/json",
  ];

  for (const endpoint of cobaltEndpoints) {
    try {
      console.log(`[Snaptap /api/extract] Trying Cobalt fallback instance: ${endpoint}`);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Snaptap/1.0",
        },
        body: JSON.stringify({
          url: targetUrl,
          videoQuality: "max",
        }),
        signal: AbortSignal.timeout(6000),
      });

      const data = await res.json().catch(() => null);
      console.log(`[Snaptap /api/extract] Cobalt response from ${endpoint}:`, JSON.stringify(data));

      if (
        data &&
        (data.url ||
          data.status === "redirect" ||
          data.status === "tunnel" ||
          data.status === "success")
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const streamUrl = data.url || (data.picker && (data.picker as any[])[0]?.url);
        if (streamUrl) {
          let title = `Media from ${platform.toUpperCase()}`;
          let uploader = "@creator";
          let thumbnail = "";

          // Fetch oEmbed for rich title and thumbnail if YouTube
          if (platform === "youtube") {
            try {
              const oembedRes = await fetch(
                `https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`,
                { signal: AbortSignal.timeout(3000) }
              );
              const oembed = await oembedRes.json().catch(() => null);
              if (oembed) {
                title = oembed.title || title;
                uploader = oembed.author_name || uploader;
                thumbnail = oembed.thumbnail_url || "";
              }
            } catch {
              // Ignore oembed error
            }
          }

          return {
            id: String(Date.now()),
            title,
            uploader,
            thumbnail,
            duration: "HD",
            platform,
            downloadOptions: [
              {
                label: "Best Quality MP4",
                url: streamUrl,
                type: "video",
                extension: "mp4",
              },
              {
                label: "Audio Only MP3",
                url: data.audio || streamUrl,
                type: "audio",
                extension: "mp3",
              },
            ],
          };
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`[Snaptap /api/extract] Cobalt instance ${endpoint} failed:`, msg);
    }
  }

  return null;
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    // 1. Verbose Logging: Log incoming user URL
    console.log("[Snaptap /api/extract] ================================");
    console.log("[Snaptap /api/extract] Incoming user URL:", body?.url);

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

    console.log("[Snaptap /api/extract] Detected platform:", platform);

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

    // 1. Verbose Logging: Log whether process.env.APIFY_API_TOKEN is detected (first 6 chars only)
    const token = process.env.APIFY_API_TOKEN;
    console.log(
      "[Snaptap /api/extract] APIFY_API_TOKEN detected:",
      token ? `${token.slice(0, 6)}... (${token.length} chars)` : "NOT DETECTED"
    );

    // Primary: Call Apify Actor
    if (token) {
      const client = new ApifyClient({ token });

      const actorsToTry = [
        {
          id: "scrapepilot/download-from-any-website-youtube-tiktok-ig-1000",
          input: {
            url: inputUrl,
            videoQuality: "max",
          },
        },
        {
          id: "moving_beacon-owner1/my-actor-58",
          input: {
            urls: [inputUrl],
            url: inputUrl,
            mode: "best_video",
            videoQuality: "max",
          },
        },
      ];

      for (const actorConfig of actorsToTry) {
        try {
          console.log(`[Snaptap /api/extract] Calling Apify actor: ${actorConfig.id}`);
          console.log(
            `[Snaptap /api/extract] Actor input:`,
            JSON.stringify(actorConfig.input)
          );

          const run = await client.actor(actorConfig.id).call(actorConfig.input, {
            timeout: 40,
          });

          console.log(
            `[Snaptap /api/extract] Actor ${actorConfig.id} finished with status: ${run.status}, datasetId: ${run.defaultDatasetId}`
          );

          if (run.defaultDatasetId) {
            const dataset = await client.dataset(run.defaultDatasetId).listItems();
            const items = dataset.items || [];

            console.log(
              `[Snaptap /api/extract] Dataset items count: ${items.length}`
            );
            if (items.length > 0) {
              console.log(
                `[Snaptap /api/extract] Raw first item:`,
                JSON.stringify(items[0], null, 2)
              );

              // Normalize item
              const normalized = normalizeActorItem(items[0], inputUrl, platform);
              if (normalized) {
                console.log(
                  "[Snaptap /api/extract] Successfully parsed normalized media payload!"
                );
                return NextResponse.json({
                  success: true,
                  data: normalized,
                });
              } else {
                console.warn(
                  `[Snaptap /api/extract] Actor item contained no direct stream URL:`,
                  items[0]
                );
              }
            }
          }
        } catch (actorErr: unknown) {
          const msg = actorErr instanceof Error ? actorErr.message : String(actorErr);
          console.error(
            `[Snaptap /api/extract] Actor ${actorConfig.id} failed:`,
            msg
          );
        }
      }
    }

    // 2. Fallback: Query public Cobalt extractor instances
    console.log("[Snaptap /api/extract] Initiating Cobalt fallback pipeline...");
    const cobaltData = await queryCobaltFallback(inputUrl, platform);
    if (cobaltData) {
      console.log("[Snaptap /api/extract] Cobalt fallback succeeded!");
      return NextResponse.json({
        success: true,
        data: cobaltData,
      });
    }


    // If all pipelines failed
    console.error("[Snaptap /api/extract] All extraction pipelines failed for URL:", inputUrl);
    return NextResponse.json(
      {
        success: false,
        error:
          "Could not extract video stream. The media host may be blocking requests or the video is private.",
      },
      { status: 404 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal extraction error occurred.";
    console.error("[Snaptap /api/extract] Uncaught server error:", message);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
