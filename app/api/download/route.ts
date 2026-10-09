import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const mediaUrl = searchParams.get("url");
    const rawTitle = searchParams.get("title") || "snaptap-media";
    const extension = searchParams.get("ext") || "mp4";

    if (!mediaUrl) {
      return new NextResponse("Missing 'url' query parameter", { status: 400 });
    }

    // Clean filename
    const safeTitle = rawTitle
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 60)
      .trim() || "snaptap_download";
    const filename = `${safeTitle}.${extension}`;

    // Fetch the upstream media stream
    const upstreamRes = await fetch(mediaUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!upstreamRes.ok || !upstreamRes.body) {
      // Fallback redirect directly to media URL if proxy stream is refused
      return NextResponse.redirect(mediaUrl);
    }

    const contentType =
      upstreamRes.headers.get("content-type") ||
      (extension === "mp3" ? "audio/mpeg" : "video/mp4");

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);

    const contentLength = upstreamRes.headers.get("content-length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    // Return piped readable stream
    return new NextResponse(upstreamRes.body as unknown as BodyInit, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    if (error && typeof error === "object" && error.digest === "NEXT_PRERENDER_INTERRUPTED") {
      throw error;
    }
    console.error("Direct download proxy error:", error);
    // If anything fails, redirect directly to original URL as fallback
    const fallbackUrl = req.nextUrl.searchParams.get("url");
    if (fallbackUrl) {
      return NextResponse.redirect(fallbackUrl);
    }
    return new NextResponse("Failed to stream download", { status: 500 });
  }
}
