import { useState, useCallback, useEffect, useRef } from 'react';
import type { EstimatorV2Input } from '@/lib/estimatorV2/types';
import { DEFAULT_V2_INPUT } from '@/lib/estimatorV2/types';

const STORAGE_KEY = 'rossbuilt-estimate-v2-draft';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type V2Draft = {
  step: number;
  input: EstimatorV2Input;
  savedAt: number;
};

function loadDraft(): V2Draft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as V2Draft;
    // Shape validation
    if (typeof parsed.step !== 'number' || typeof parsed.savedAt !== 'number' || !parsed.input) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    // Expire old drafts
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function useEstimateDraftV2() {
  const [draft] = useState<V2Draft | null>(() => loadDraft());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveDraft = useCallback((step: number, input: EstimatorV2Input) => {
    // Don't save if still on step 0 (getting started) or step 5 (results)
    if (step === 0 || step === 5) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const payload: V2Draft = { step, input, savedAt: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }, 500);
  }, []);

  const clearDraft = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { draft, saveDraft, clearDraft };
}
