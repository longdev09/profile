import initialVideos from "@/data/videos.json";

export interface YoutubeVideo {
  id: string;
  title: string;
  youtubeId: string;
  duration?: string;
  hot?: boolean;
}

export interface AccordionCategory {
  id: string;
  title: string;
  badge?: string;
  videos: YoutubeVideo[];
}

export const STORAGE_KEY = "slide_cuoi_dep_categories_v1";

export const DEFAULT_CATEGORIES: AccordionCategory[] = initialVideos as AccordionCategory[];

export function extractYoutubeId(input: string): string {
  if (!input) return "";
  const cleanInput = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanInput)) {
    return cleanInput;
  }
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = cleanInput.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return match[2];
  }
  return cleanInput;
}

export function loadCategoriesFromLocalStorage(): AccordionCategory[] {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load categories from localStorage:", e);
  }
  return DEFAULT_CATEGORIES;
}

export function saveCategoriesToLocalStorage(categories: AccordionCategory[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  } catch (e) {
    console.error("Failed to save categories to localStorage:", e);
  }
}

export async function fetchCategoriesApi(): Promise<AccordionCategory[]> {
  // 1. Try to load from LocalStorage first for instant mobile rendering
  const localData = loadCategoriesFromLocalStorage();

  // 2. Try to fetch from server API route (/api/videos -> src/data/videos.json)
  try {
    const res = await fetch("/api/videos", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveCategoriesToLocalStorage(data);
        return data;
      }
    }
  } catch (e) {
    console.error("Failed to fetch categories from API, using fallback:", e);
  }

  return localData.length > 0 ? localData : DEFAULT_CATEGORIES;
}

export function sortVideosHotFirst(videos: YoutubeVideo[]): YoutubeVideo[] {
  return [...videos].sort((a, b) => {
    if (a.hot && !b.hot) return -1;
    if (!a.hot && b.hot) return 1;
    return 0;
  });
}

export async function saveCategoriesApi(categories: AccordionCategory[]): Promise<boolean> {
  // Save to LocalStorage immediately
  saveCategoriesToLocalStorage(categories);

  // Post to API route to update src/data/videos.json on disk
  try {
    const res = await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(categories),
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to save categories to API:", e);
    return false;
  }
}
