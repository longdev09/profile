import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { DEFAULT_CATEGORIES } from "@/lib/videoData";

const jsonFilePath = path.join(process.cwd(), "src", "data", "videos.json");
const tmpFilePath = path.join("/tmp", "videos.json");

declare global {
  var __videosCache: any[] | null;
}

if (!globalThis.__videosCache) {
  globalThis.__videosCache = null;
}

// Helper: fetch from Vercel KV or Upstash Redis if env variables are provided
async function getFromKv(): Promise<any[] | null> {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!kvUrl || !kvToken) return null;

  try {
    const res = await fetch(`${kvUrl}/get/slide_cuoi_videos`, {
      headers: { Authorization: `Bearer ${kvToken}` },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (data.result) {
        const parsed = typeof data.result === "string" ? JSON.parse(data.result) : data.result;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
  } catch (e) {
    console.error("KV fetch error:", e);
  }
  return null;
}

// Helper: save to Vercel KV or Upstash Redis if env variables are provided
async function saveToKv(categories: any[]): Promise<boolean> {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!kvUrl || !kvToken) return false;

  try {
    const res = await fetch(`${kvUrl}/set/slide_cuoi_videos`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${kvToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(JSON.stringify(categories)),
    });
    return res.ok;
  } catch (e) {
    console.error("KV save error:", e);
    return false;
  }
}

export async function GET() {
  try {
    // 1. Try KV cloud storage if env vars are present
    const kvData = await getFromKv();
    if (kvData) {
      globalThis.__videosCache = kvData;
      return NextResponse.json(kvData);
    }

    // 2. Return global in-memory cache if available
    if (globalThis.__videosCache && globalThis.__videosCache.length > 0) {
      return NextResponse.json(globalThis.__videosCache);
    }

    // 3. Try reading from /tmp/videos.json (writable on serverless platforms like Vercel)
    try {
      const tmpData = await fs.readFile(tmpFilePath, "utf-8");
      const parsedTmp = JSON.parse(tmpData);
      if (Array.isArray(parsedTmp) && parsedTmp.length > 0) {
        globalThis.__videosCache = parsedTmp;
        return NextResponse.json(parsedTmp);
      }
    } catch {
      // Ignore if /tmp file does not exist yet
    }

    // 4. Fallback to src/data/videos.json file
    const fileData = await fs.readFile(jsonFilePath, "utf-8");
    const categories = JSON.parse(fileData);
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error reading videos.json:", error);
    return NextResponse.json(globalThis.__videosCache || DEFAULT_CATEGORIES);
  }
}

export async function POST(request: Request) {
  try {
    const categories = await request.json();
    if (!Array.isArray(categories)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    // Update in-memory cache immediately
    globalThis.__videosCache = categories;

    // 1. Save to KV Cloud storage if configured
    await saveToKv(categories);

    // 2. Try writing to src/data/videos.json (works in local development)
    let savedToLocalFile = false;
    try {
      const dir = path.dirname(jsonFilePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(jsonFilePath, JSON.stringify(categories, null, 2), "utf-8");
      savedToLocalFile = true;
    } catch (fsErr) {
      console.warn("Notice: Read-only filesystem on production (Vercel):", fsErr);
    }

    // 3. Write to /tmp/videos.json (works on serverless production environment)
    let savedToTmp = false;
    try {
      await fs.writeFile(tmpFilePath, JSON.stringify(categories, null, 2), "utf-8");
      savedToTmp = true;
    } catch (tmpErr) {
      console.warn("Notice: Failed writing to /tmp/videos.json:", tmpErr);
    }

    return NextResponse.json({
      success: true,
      categories,
      savedToLocalFile,
      savedToTmp,
    });
  } catch (error) {
    console.error("Error writing videos.json:", error);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}
