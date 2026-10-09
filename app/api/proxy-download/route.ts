import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const mediaUrl = searchParams.get("url");
    const rawTitle = searchParams.get("title") || "snaptap_media";
    const extension = searchParams.get("ext") || "mp4";

    if (!mediaUrl) {
      return new NextResponse(
        JSON.stringify({ error: "Missing 'url' query parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Clean & sanitize filename
    const cleanFileName =
      rawTitle
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "_")
        .slice(0, 80) || "snaptap_download";

    // Set request headers to bypass CDN referrer and bot blocks
    let referer = "https://www.google.com";
    try {
      referer = new URL(mediaUrl).origin;
    } catch {
      // ignore URL parse errors
    }

    const upstreamHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "*/*",
      Referer: referer,
    };

    const rangeHeader = req.headers.get("range");
    if (rangeHeader) {
      upstreamHeaders["Range"] = rangeHeader;
    }

    // Request upstream media stream from server side
    const upstreamRes = await fetch(mediaUrl, {
      headers: upstreamHeaders,
      cache: "no-store",
    });

    const upstreamContentType = upstreamRes.headers.get("content-type") || "";

    // If stream is empty, failed, or returned an HTML error page
    if (!upstreamRes.ok || !upstreamRes.body || upstreamContentType.includes("text/html")) {
      console.warn(
        `[Proxy-Download] Upstream fetch failed for ${mediaUrl}: status ${upstreamRes.status}`
      );
      return new NextResponse(
        JSON.stringify({
          error:
            "Media stream is currently inaccessible from the upstream provider. Please try another link.",
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const isAudio =
      extension.toLowerCase() === "mp3" ||
      upstreamContentType.includes("audio") ||
      mediaUrl.includes(".mp3") ||
      mediaUrl.includes(".m4a");

    const finalExt = isAudio ? "mp3" : "mp4";
    const finalContentType = isAudio ? "audio/mpeg" : "video/mp4";

    const responseHeaders = new Headers();
    responseHeaders.set(
      "Content-Disposition",
      `attachment; filename="${cleanFileName}.${finalExt}"`
    );
    responseHeaders.set("Content-Type", finalContentType);

    const contentLength = upstreamRes.headers.get("content-length");
    if (contentLength) {
      responseHeaders.set("Content-Length", contentLength);
    }

    responseHeaders.set("Accept-Ranges", "bytes");
    responseHeaders.set("Cache-Control", "public, max-age=3600");

    // Stream the response directly back to the client using a ReadableStream
    return new NextResponse(upstreamRes.body as unknown as BodyInit, {
      status: upstreamRes.status === 206 ? 206 : 200,
      headers: responseHeaders,
    });
  } catch (error: any) {
    if (error && typeof error === "object" && error.digest === "NEXT_PRERENDER_INTERRUPTED") {
      throw error;
    }
    console.error("[Proxy-Download] Proxy error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to pipe download media stream." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
