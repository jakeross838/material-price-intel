import { useState, useCallback } from 'react';
import type { EstimatorV2Input } from '@/lib/estimatorV2/types';

const STORAGE_KEY = 'rossbuilt-saved-estimates';
const MAX_SAVED = 10;

export type SavedEstimate = {
  id: string;
  label: string;
  input: EstimatorV2Input;
  savedAt: string;
};

function loadFromStorage(): SavedEstimate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedEstimate[];
  } catch {
    return [];
  }
}

function saveToStorage(estimates: SavedEstimate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(estimates));
}

export function useSavedEstimates() {
  const [estimates, setEstimates] = useState<SavedEstimate[]>(loadFromStorage);

  const saveEstimate = useCallback((input: EstimatorV2Input, label?: string) => {
    setEstimates((prev) => {
      const id = crypto.randomUUID();
      const defaultLabel = `Estimate ${prev.length + 1}`;
      const entry: SavedEstimate = {
        id,
        label: label || defaultLabel,
        input,
        savedAt: new Date().toISOString(),
      };
      const next = [entry, ...prev].slice(0, MAX_SAVED);
      saveToStorage(next);
      return next;
    });
  }, []);

  const renameEstimate = useCallback((id: string, label: string) => {
    setEstimates((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, label } : e));
      saveToStorage(next);
      return next;
    });
  }, []);

  const deleteEstimate = useCallback((id: string) => {
    setEstimates((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveToStorage(next);
      return next;
    });
  }, []);

  return { estimates, saveEstimate, renameEstimate, deleteEstimate };
}
