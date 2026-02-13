import { useState, useCallback } from "react";

// ===========================================
// Unsplash Image Search
// Client-side (no Edge Function needed).
// Free tier: 50 req/hr.
// ===========================================

export type UnsplashResult = {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  description: string | null;
  user: {
    name: string;
    links: { html: string };
  };
  links: {
    download_location: string;
  };
};

const UNSPLASH_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY as
  | string
  | undefined;

export function useImageSearch() {
  const [results, setResults] = useState<UnsplashResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    if (!UNSPLASH_KEY) {
      setError("Unsplash API key not configured (VITE_UNSPLASH_ACCESS_KEY)");
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        query: query.trim(),
        per_page: "20",
        orientation: "landscape",
      });

      const res = await fetch(
        `https://api.unsplash.com/search/photos?${params}`,
        {
          headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
        }
      );

      if (!res.ok) {
        throw new Error(
          res.status === 403
            ? "Unsplash rate limit exceeded. Try again in a few minutes."
            : `Unsplash search failed (${res.status})`
        );
      }

      const json = await res.json();
      setResults(json.results as UnsplashResult[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, isSearching, error, search, clear };
}

// ===========================================
// Trigger Unsplash download (required by TOS)
// ===========================================

export async function triggerUnsplashDownload(downloadLocation: string) {
  if (!UNSPLASH_KEY) return;
  try {
    await fetch(downloadLocation, {
      headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
    });
  } catch {
    // Best-effort, don't fail if tracking fails
  }
}
