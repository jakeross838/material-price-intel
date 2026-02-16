import { useState, useCallback, useEffect, useRef } from "react";
import type { SelectedRoom, RoomCategorySelection } from "@/lib/types";

const STORAGE_KEY = "rossbuilt-estimate-draft";

export type EstimateDraft = {
  step: number;
  sqft: number;
  stories: number;
  style: string;
  bedrooms: number;
  bathrooms: number;
  selectedRooms: SelectedRoom[];
  selections: RoomCategorySelection[];
  savedAt: number;
};

function loadDraft(): EstimateDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EstimateDraft;
    // Basic shape validation
    if (typeof parsed.step !== "number" || typeof parsed.savedAt !== "number") {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function useEstimateDraft() {
  const [draft, setDraft] = useState<EstimateDraft | null>(() => loadDraft());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveDraft = useCallback((state: Omit<EstimateDraft, "savedAt">) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const payload: EstimateDraft = { ...state, savedAt: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }, 300);
  }, []);

  const clearDraft = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    localStorage.removeItem(STORAGE_KEY);
    setDraft(null);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { draft, saveDraft, clearDraft };
}
