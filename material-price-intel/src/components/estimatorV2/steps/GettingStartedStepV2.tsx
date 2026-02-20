import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FileUp, PenLine, ArrowRight, Upload, X, FileText,
  Image as ImageIcon, Loader2, CheckCircle2, AlertCircle,
  Home, BedDouble, Bath, Layers, RotateCcw,
} from 'lucide-react';
import { useFloorPlanExtraction } from '@/hooks/useFloorPlanExtraction';
import type { FloorPlanExtractionResult } from '@/lib/floorPlanTypes';

type Props = {
  onStartFromScratch: () => void;
  onFloorPlanExtracted: (result: FloorPlanExtractionResult) => void;
};

type UploadState = 'choice' | 'upload' | 'analyzing' | 'success' | 'error';

// Supported media types for Claude vision API
const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
]);
const SUPPORTED_DOC_TYPES = new Set(['application/pdf']);

function resolveMediaType(file: File): string {
  if (file.type && (SUPPORTED_IMAGE_TYPES.has(file.type) || SUPPORTED_DOC_TYPES.has(file.type))) {
    return file.type;
  }
  // Infer from extension when browser doesn't set type
  const ext = file.name.split('.').pop()?.toLowerCase();
  const extMap: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    gif: 'image/gif', webp: 'image/webp', pdf: 'application/pdf',
  };
  return extMap[ext ?? ''] ?? 'image/png'; // default to png so Claude still tries
}

function readFileAsBase64(
  file: File,
): Promise<{ data: string; media_type: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Strip "data:<mime>;base64," prefix
      const base64 = dataUrl.split(',')[1] ?? '';
      resolve({ data: base64, media_type: resolveMediaType(file) });
    };
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export function GettingStartedStepV2({ onStartFromScratch, onFloorPlanExtracted }: Props) {
  const [state, setState] = useState<UploadState>('choice');
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<FloorPlanExtractionResult | null>(null);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const extraction = useFloorPlanExtraction();

  function addFiles(newFiles: FileList | File[]) {
    setFiles((prev) => [...prev, ...Array.from(newFiles)]);
    setErrorMsg('');
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (dragCounter.current === 1) setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAnalyze() {
    if (files.length === 0) return;
    setState('analyzing');
    setErrorMsg('');
    try {
      const payloads = await Promise.all(files.map(readFileAsBase64));
      const data = await extraction.mutateAsync(payloads);
      const normalized: FloorPlanExtractionResult = {
        total_sqft: data.total_sqft ?? 2500,
        stories: data.stories ?? 1,
        bedrooms: data.bedrooms ?? 3,
        bathrooms: data.bathrooms ?? 2,
        style: data.style ?? null,
        rooms: Array.isArray(data.rooms) ? data.rooms : [],
        material_notes: Array.isArray(data.material_notes) ? data.material_notes : [],
        confidence: data.confidence ?? 0.5,
        extraction_notes: data.extraction_notes ?? null,
      };
      setResult(normalized);
      setState('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to analyze floor plans');
      setState('error');
    }
  }

  // Choice screen
  if (state === 'choice') {
    return (
      <div className="space-y-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[var(--ev2-gold)]/10 flex items-center justify-center mx-auto mb-4">
            <Home className="h-8 w-8 text-[var(--ev2-gold)]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--ev2-text)] mb-2">
            How would you like to start?
          </h2>
          <p className="text-[var(--ev2-text-muted)] mt-2 text-sm sm:text-base max-w-lg mx-auto">
            Upload existing floor plans for an AI-powered estimate, or design your dream home from scratch.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {/* Upload Plans */}
          <motion.button
            type="button"
            onClick={() => setState('upload')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group relative flex flex-col items-center text-center p-8 rounded-2xl
              bg-[var(--ev2-surface)] border border-[var(--ev2-border)]
              hover:border-[var(--ev2-gold)]/50 hover:bg-[var(--ev2-surface-hover)]
              ev2-card-hover transition-all duration-200"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--ev2-blue)]/20 to-[var(--ev2-gold)]/10 group-hover:from-[var(--ev2-blue)]/30 group-hover:to-[var(--ev2-gold)]/20 flex items-center justify-center mb-4 transition-colors">
              <FileUp className="h-8 w-8 text-[var(--ev2-gold)]" />
            </div>
            <h3 className="text-lg font-bold text-[var(--ev2-text)] mb-2">
              Upload Floor Plans
            </h3>
            <p className="text-sm text-[var(--ev2-text-muted)] leading-relaxed">
              Have blueprints or photos? Our AI will extract rooms, square footage, and layout automatically.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ev2-gold)]">
              PDF, images, and more
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </motion.button>

          {/* Start from Scratch */}
          <motion.button
            type="button"
            onClick={onStartFromScratch}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group relative flex flex-col items-center text-center p-8 rounded-2xl
              bg-[var(--ev2-surface)] border border-[var(--ev2-border)]
              hover:border-[var(--ev2-gold)]/50 hover:bg-[var(--ev2-surface-hover)]
              ev2-card-hover transition-all duration-200"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--ev2-gold)]/10 to-[var(--ev2-blue)]/20 group-hover:from-[var(--ev2-gold)]/20 group-hover:to-[var(--ev2-blue)]/30 flex items-center justify-center mb-4 transition-colors">
              <PenLine className="h-8 w-8 text-[var(--ev2-gold)]" />
            </div>
            <h3 className="text-lg font-bold text-[var(--ev2-text)] mb-2">
              Start from Scratch
            </h3>
            <p className="text-sm text-[var(--ev2-text-muted)] leading-relaxed">
              No plans yet? No problem. We'll walk you through designing your dream home step by step.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ev2-gold)]">
              Quick 5-step configurator
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </motion.button>
        </div>
      </div>
    );
  }

  // Analyzing
  if (state === 'analyzing') {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-[var(--ev2-gold)]/10 flex items-center justify-center mx-auto mb-6">
          <Loader2 className="h-8 w-8 text-[var(--ev2-gold)] animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--ev2-text)] mb-2">
          AI is reading your floor plans...
        </h2>
        <p className="text-[var(--ev2-text-muted)] text-sm max-w-md mx-auto">
          Extracting rooms, dimensions, and layout details. This usually takes 10-20 seconds.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4 text-xs text-[var(--ev2-text-dim)]">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[var(--ev2-gold)] animate-pulse" />
            Identifying rooms
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[var(--ev2-gold)]/60 animate-pulse" style={{ animationDelay: '300ms' }} />
            Measuring dimensions
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[var(--ev2-gold)]/30 animate-pulse" style={{ animationDelay: '700ms' }} />
            Detecting materials
          </div>
        </div>
      </div>
    );
  }

  // Success
  if (state === 'success' && result) {
    const lowConfidence = result.confidence < 0.5;
    return (
      <div className="space-y-6">
        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-6 w-6 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--ev2-text)]">Floor Plans Analyzed</h2>
          <p className="text-[var(--ev2-text-muted)] mt-1 text-sm">
            Here's what we found. You can adjust everything in the next steps.
          </p>
        </div>

        {lowConfidence && (
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-sm text-amber-300">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Low confidence extraction</p>
              <p className="text-amber-400/70 text-xs mt-0.5">
                The AI had difficulty reading these plans. Please review all values carefully.
              </p>
            </div>
          </div>
        )}

        <div className="bg-[var(--ev2-surface)] rounded-2xl border border-[var(--ev2-border)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--ev2-border)]">
            <p className="text-sm font-semibold text-[var(--ev2-text)]">Extraction Summary</p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { icon: Home, value: result.total_sqft.toLocaleString(), label: 'Sq Ft' },
                { icon: BedDouble, value: result.bedrooms, label: 'Bedrooms' },
                { icon: Bath, value: result.bathrooms, label: 'Bathrooms' },
                { icon: Layers, value: result.stories, label: result.stories === 1 ? 'Story' : 'Stories' },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="text-center p-3 rounded-xl bg-[var(--ev2-navy-900)]">
                  <Icon className="h-5 w-5 text-[var(--ev2-gold)] mx-auto mb-1" />
                  <p className="text-xl font-bold text-[var(--ev2-text)] tabular-nums">{value}</p>
                  <p className="text-[10px] text-[var(--ev2-text-dim)]">{label}</p>
                </div>
              ))}
            </div>
            {result.rooms.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[var(--ev2-text-dim)] uppercase tracking-wider">
                  {result.rooms.length} Rooms Detected
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.rooms.map((room, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--ev2-navy-900)] border border-[var(--ev2-border)]">
                      <span className="text-sm font-medium text-[var(--ev2-text)]">{room.name}</span>
                      {room.estimated_sqft && (
                        <span className="text-xs text-[var(--ev2-text-dim)] tabular-nums">
                          ~{room.estimated_sqft} sqft
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onFloorPlanExtracted(result)}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-lg text-sm font-semibold
              text-[var(--ev2-navy-950)] bg-[var(--ev2-gold)] hover:bg-[var(--ev2-gold-light)] transition-colors"
          >
            Looks Good — Continue
            <ArrowRight className="h-5 w-5" />
          </button>
          <button
            onClick={() => { setState('choice'); setFiles([]); setResult(null); }}
            className="flex items-center justify-center gap-2 h-12 px-6 rounded-lg text-sm font-medium
              text-[var(--ev2-text-muted)] bg-[var(--ev2-surface)] border border-[var(--ev2-border)]
              hover:bg-[var(--ev2-surface-hover)] transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Start Over
          </button>
        </div>
      </div>
    );
  }

  // Error
  if (state === 'error') {
    return (
      <div className="text-center py-12 space-y-6">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-6 w-6 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--ev2-text)]">Something went wrong</h2>
        <p className="text-[var(--ev2-text-muted)] text-sm max-w-md mx-auto">
          We couldn't analyze your floor plans.
        </p>
        {errorMsg && (
          <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-4 py-2 inline-block">{errorMsg}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => { setState('upload'); setResult(null); setErrorMsg(''); }}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold
              text-[var(--ev2-navy-950)] bg-[var(--ev2-gold)] hover:bg-[var(--ev2-gold-light)] transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </button>
          <button
            onClick={onStartFromScratch}
            className="px-6 py-2.5 rounded-lg text-sm font-medium
              text-[var(--ev2-text-muted)] bg-[var(--ev2-surface)] border border-[var(--ev2-border)]
              hover:bg-[var(--ev2-surface-hover)] transition-colors"
          >
            Start from Scratch
          </button>
        </div>
      </div>
    );
  }

  // Upload screen
  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <div className="w-12 h-12 rounded-full bg-[var(--ev2-gold)]/10 flex items-center justify-center mx-auto mb-4">
          <FileUp className="h-6 w-6 text-[var(--ev2-gold)]" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--ev2-text)]">
          Upload Your Floor Plans
        </h2>
        <p className="text-[var(--ev2-text-muted)] mt-2 text-sm">
          Upload any file — PDFs, images, screenshots, sketches. Our AI will extract the details.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
          dragOver
            ? 'border-[var(--ev2-gold)] bg-[var(--ev2-gold)]/5 scale-[1.01]'
            : 'border-[var(--ev2-border)] bg-[var(--ev2-surface)] hover:border-[var(--ev2-gold)]/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="*/*"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = '';
          }}
          className="hidden"
        />
        <Upload className={`h-10 w-10 mb-3 transition-colors ${
          dragOver ? 'text-[var(--ev2-gold)]' : 'text-[var(--ev2-text-dim)]'
        }`} />
        <p className="text-sm font-semibold text-[var(--ev2-text)] mb-1">
          {dragOver ? 'Drop files here' : 'Drag & drop your floor plans'}
        </p>
        <p className="text-xs text-[var(--ev2-text-dim)]">
          or click to browse
        </p>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <pre className="whitespace-pre-wrap font-sans">{errorMsg}</pre>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--ev2-text-dim)] uppercase tracking-wider">
            {files.length} file{files.length > 1 ? 's' : ''} selected
          </p>
          {files.map((file, idx) => (
            <div key={`${file.name}-${idx}`} className="flex items-center gap-3 px-4 py-3 bg-[var(--ev2-surface)] rounded-xl border border-[var(--ev2-border)]">
              {file.type === 'application/pdf' ? (
                <FileText className="h-5 w-5 text-red-400 shrink-0" />
              ) : file.type.startsWith('image/') ? (
                <ImageIcon className="h-5 w-5 text-[var(--ev2-gold)] shrink-0" />
              ) : (
                <FileText className="h-5 w-5 text-[var(--ev2-text-dim)] shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--ev2-text)] truncate">{file.name}</p>
                <p className="text-[11px] text-[var(--ev2-text-dim)]">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                className="p-1.5 rounded-lg hover:bg-[var(--ev2-navy-800)] text-[var(--ev2-text-dim)] hover:text-[var(--ev2-text)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleAnalyze}
          disabled={files.length === 0}
          className="flex-1 flex items-center justify-center gap-2 h-12 rounded-lg text-sm font-semibold
            text-[var(--ev2-navy-950)] bg-[var(--ev2-gold)] hover:bg-[var(--ev2-gold-light)]
            disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Analyze Plans
          <ArrowRight className="h-5 w-5" />
        </button>
        <button
          onClick={() => { setState('choice'); setFiles([]); setErrorMsg(''); }}
          className="h-12 px-6 rounded-lg text-sm font-medium
            text-[var(--ev2-text-muted)] bg-[var(--ev2-surface)] border border-[var(--ev2-border)]
            hover:bg-[var(--ev2-surface-hover)] transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );
}
