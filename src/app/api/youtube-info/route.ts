import { NextResponse } from "next/server";

function formatSeconds(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds <= 0) return "";
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function parseIsoDuration(durationStr: string): number {
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) {
    return NextResponse.json({ error: "Invalid YouTube ID" }, { status: 400 });
  }

  let title = "";
  let duration = "";

  // 1. Fetch title from YouTube oEmbed API
  try {
    const oembedRes = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`,
      { cache: "no-store" }
    );
    if (oembedRes.ok) {
      const oembedData = await oembedRes.json();
      if (oembedData.title) {
        title = oembedData.title;
      }
    }
  } catch (e) {
    console.error("Failed to fetch YouTube oEmbed:", e);
  }

  // 2. Fetch HTML to parse duration & fallback title
  try {
    const ytPageRes = await fetch(`https://www.youtube.com/watch?v=${id}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      cache: "no-store",
    });

    if (ytPageRes.ok) {
      const html = await ytPageRes.text();

      // Fallback title if oEmbed failed
      if (!title) {
        const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
        if (ogTitleMatch && ogTitleMatch[1]) {
          title = ogTitleMatch[1];
        }
      }

      // Try parsing duration from approxDurationMs or lengthSeconds or ISO duration
      let totalSeconds = 0;

      const approxMsMatch = html.match(/"approxDurationMs"\s*:\s*"(\d+)"/);
      const lengthSecMatch = html.match(/"lengthSeconds"\s*:\s*"(\d+)"/);
      const isoDurationMatch = html.match(/<meta\s+itemprop="duration"\s+content="([^"]+)"/i);

      if (approxMsMatch && approxMsMatch[1]) {
        totalSeconds = Math.round(parseInt(approxMsMatch[1], 10) / 1000);
      } else if (lengthSecMatch && lengthSecMatch[1]) {
        totalSeconds = parseInt(lengthSecMatch[1], 10);
      } else if (isoDurationMatch && isoDurationMatch[1]) {
        totalSeconds = parseIsoDuration(isoDurationMatch[1]);
      }

      if (totalSeconds > 0) {
        duration = formatSeconds(totalSeconds);
      }
    }
  } catch (e) {
    console.error("Failed to fetch YouTube page for duration:", e);
  }

  return NextResponse.json({
    youtubeId: id,
    title: title || "",
    duration: duration || "",
  });
}
