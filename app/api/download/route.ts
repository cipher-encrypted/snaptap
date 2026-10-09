import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  url.pathname = "/api/proxy-download";
  return NextResponse.redirect(url.toString(), { status: 308 });
}
