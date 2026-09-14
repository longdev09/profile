import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { DEFAULT_CATEGORIES } from "@/lib/videoData";

const jsonFilePath = path.join(process.cwd(), "src", "data", "videos.json");

export async function GET() {
  try {
    const fileData = await fs.readFile(jsonFilePath, "utf-8");
    const categories = JSON.parse(fileData);
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error reading videos.json:", error);
    // Return default categories if file read fails
    return NextResponse.json(DEFAULT_CATEGORIES);
  }
}

export async function POST(request: Request) {
  try {
    const categories = await request.json();
    if (!Array.isArray(categories)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }
    
    // Ensure directory exists
    const dir = path.dirname(jsonFilePath);
    await fs.mkdir(dir, { recursive: true });

    // Save directly into src/data/videos.json in project folder
    await fs.writeFile(jsonFilePath, JSON.stringify(categories, null, 2), "utf-8");
    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error("Error writing videos.json:", error);
    return NextResponse.json({ error: "Failed to save data to file" }, { status: 500 });
  }
}
