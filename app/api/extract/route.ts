import { NextRequest, NextResponse } from "next/server";
import { ApifyClient } from "apify-client";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const incomingUrl = body?.url?.trim();

    console.log("[Snaptap /api/extract] ================================");
    console.log("[Snaptap /api/extract] Incoming URL:", incomingUrl);

    if (!incomingUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide a valid media URL in { url: string }.",
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

    console.log(
      "[Snaptap /api/extract] APIFY_API_TOKEN detected:",
      `${token.slice(0, 6)}... (${token.length} chars)`
    );

    const client = new ApifyClient({ token });

    // Official abotapi/universal-media-extractor execution settings
    const runInput = {
      url: incomingUrl,
      mode: "download",
      format: "best[height<=1080]",
      storage_type: "apify",
      proxy: {
        useApifyProxy: true,
      },
      geo_bypass: true,
    };

    console.log(
      "[Snaptap /api/extract] Calling actor abotapi/universal-media-extractor with input:",
      JSON.stringify(runInput)
    );

    const run = await client.actor("abotapi/universal-media-extractor").call(runInput, {
      timeout: 120,
    });

    console.log(
      `[Snaptap /api/extract] Run finished: ${run.id}, status: ${run.status}, datasetId: ${run.defaultDatasetId}`
    );

    if (!run.defaultDatasetId) {
      return NextResponse.json(
        {
          success: false,
          error: "Extractor finished without producing a dataset ID.",
        },
        { status: 500 }
      );
    }

    // Retrieve dataset items
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log(`[Snaptap /api/extract] Retrieved ${items.length} dataset item(s).`);

    if (!items || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No media items found for this URL. The post may be private, expired, or deleted.",
        },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item: any = items[0];
    console.log("[Snaptap /api/extract] Dataset item[0]:", JSON.stringify(item, null, 2));

    if (item.error && !item.storage_url && !item.info?.url) {
      return NextResponse.json(
        {
          success: false,
          error: item.error || "Failed to download media stream.",
        },
        { status: 400 }
      );
    }

    // Storage link is provided at item.storage_url or item.info object
    const storageUrl =
      item.storage_url ||
      item.info?.storage_url ||
      item.url ||
      item.info?.url ||
      item.download_url;

    if (!storageUrl) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Direct storage download link was not generated for this media link.",
        },
        { status: 404 }
      );
    }

    // Detect platform for UI icons
    let platform: "youtube" | "instagram" | "tiktok" | "x" | "unknown" = "unknown";
    const lower = incomingUrl.toLowerCase();
    if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
      platform = "youtube";
    } else if (lower.includes("instagram.com")) {
      platform = "instagram";
    } else if (lower.includes("tiktok.com")) {
      platform = "tiktok";
    } else if (lower.includes("twitter.com") || lower.includes("x.com")) {
      platform = "x";
    }

    // Clean response format for app/page.tsx
    const responsePayload = {
      id: String(item.id || item.info?.id || Date.now()),
      title: String(item.title || item.info?.title || "Extracted Video"),
      uploader: String(
        item.uploader || item.channel || item.info?.uploader || item.author || "Creator"
      ),
      thumbnail: String(item.thumbnail || item.info?.thumbnail || ""),
      duration: String(item.duration || item.info?.duration || "HD"),
      platform,
      downloadOptions: [
        {
          label: "Download Best Quality MP4",
          url: storageUrl,
          type: "video" as const,
          extension: "mp4" as const,
        },
        {
          label: "Download Audio Only (MP3)",
          url: item.audio_url || storageUrl,
          type: "audio" as const,
          extension: "mp3" as const,
        },
      ],
    };

    return NextResponse.json({
      success: true,
      data: responsePayload,
    });
  } catch (error: any) {
    console.error("[Snaptap /api/extract] Apify execution error:", error);
    const msg = error?.message || "Internal extraction error occurred.";
    const isLimit =
      msg.toLowerCase().includes("limit exceeded") ||
      msg.toLowerCase().includes("monthly usage");

    return NextResponse.json(
      {
        success: false,
        error: isLimit
          ? "Apify monthly usage hard limit reached on your account. Please add credits at console.apify.com."
          : msg,
      },
      { status: error?.statusCode || 500 }
    );
  }
}
