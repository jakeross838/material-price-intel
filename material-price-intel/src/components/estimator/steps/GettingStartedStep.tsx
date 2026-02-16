import { useState, useRef, useCallback } from "react";
import {
  FileUp,
  PenLine,
  ArrowRight,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Home,
  BedDouble,
  Bath,
  Layers,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFloorPlanExtraction } from "@/hooks/useFloorPlanExtraction";
import type { FloorPlanExtractionResult } from "@/lib/floorPlanTypes";


type Props = {
  onStartFromScratch: () => void;
  onFloorPlanExtracted: (result: FloorPlanExtractionResult) => void;
};

type UploadState = "choice" | "upload" | "analyzing" | "success" | "error";

async function readFileAsBase64(
  file: File
): Promise<{ data: string; media_type: string }> {
  const buffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < uint8.length; i += chunkSize) {
    binary += String.fromCharCode(...uint8.subarray(i, i + chunkSize));
  }
  return { data: btoa(binary), media_type: file.type || "application/octet-stream" };
}

export function GettingStartedStep({
  onStartFromScratch,
  onFloorPlanExtracted,
}: Props) {
  const [state, setState] = useState<UploadState>("choice");
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<FloorPlanExtractionResult | null>(null);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const extraction = useFloorPlanExtraction();

  function addFiles(newFiles: FileList | File[]) {
    const incoming = Array.from(newFiles);
    setFiles((prev) => [...prev, ...incoming]);
    setErrorMsg("");
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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  async function handleAnalyze() {
    if (files.length === 0) return;
    setState("analyzing");
    setErrorMsg("");

    try {
      const payloads = await Promise.all(files.map(readFileAsBase64));
      const data = await extraction.mutateAsync(payloads);
      // Ensure required fields have defaults
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
      setState("success");
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to analyze floor plans"
      );
      setState("error");
    }
  }

  function handleRetry() {
    setState("upload");
    setResult(null);
    setErrorMsg("");
  }

  function handleReset() {
    setState("choice");
    setFiles([]);
    setResult(null);
    setErrorMsg("");
  }

  // ========== Choice screen ==========
  if (state === "choice") {
    return (
      <div className="space-y-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 mb-4">
            <Home className="h-6 w-6 text-brand-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-900">
            How would you like to start?
          </h2>
          <p className="text-brand-600/70 mt-2 text-sm sm:text-base">
            Upload existing plans for an AI-powered estimate, or design from
            scratch.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Upload Plans Card */}
          <button
            type="button"
            onClick={() => setState("upload")}
            className="group relative flex flex-col items-center text-center p-8 rounded-2xl border-2 border-brand-200/60 bg-white hover:border-brand-400 hover:shadow-lg transition-all duration-200"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-100 group-hover:bg-brand-200 transition-colors mb-4">
              <FileUp className="h-8 w-8 text-brand-600" />
            </div>
            <h3 className="text-lg font-bold text-brand-900 mb-2">
              Upload Floor Plans
            </h3>
            <p className="text-sm text-brand-600/70 leading-relaxed">
              Have blueprints or floor plans? Our AI will extract rooms, square
              footage, and layout automatically.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-500 group-hover:text-brand-700 transition-colors">
              Any file type supported
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </button>

          {/* Start from Scratch Card */}
          <button
            type="button"
            onClick={onStartFromScratch}
            className="group relative flex flex-col items-center text-center p-8 rounded-2xl border-2 border-brand-200/60 bg-white hover:border-brand-400 hover:shadow-lg transition-all duration-200"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-100 group-hover:bg-brand-200 transition-colors mb-4">
              <PenLine className="h-8 w-8 text-brand-600" />
            </div>
            <h3 className="text-lg font-bold text-brand-900 mb-2">
              Start from Scratch
            </h3>
            <p className="text-sm text-brand-600/70 leading-relaxed">
              No plans yet? No problem. We'll walk you through designing your
              dream home step by step.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-500 group-hover:text-brand-700 transition-colors">
              Quick 4-step wizard
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ========== Analyzing screen ==========
  if (state === "analyzing") {
    return (
      <div className="space-y-8">
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-100 mb-6">
            <Loader2 className="h-8 w-8 text-brand-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-brand-900 mb-2">
            AI is reading your floor plans...
          </h2>
          <p className="text-brand-600/70 text-sm max-w-md mx-auto">
            Extracting rooms, dimensions, and layout details. This usually takes
            10-20 seconds.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 text-xs text-brand-500">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
              Identifying rooms
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-brand-300 animate-pulse delay-300" />
              Measuring dimensions
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-brand-200 animate-pulse delay-700" />
              Detecting materials
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========== Success screen ==========
  if (state === "success" && result) {
    const lowConfidence = result.confidence < 0.5;

    return (
      <div className="space-y-8">
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-brand-900">
            Floor Plans Analyzed
          </h2>
          <p className="text-brand-600/70 mt-1 text-sm">
            Here's what we found. You can adjust everything in the next steps.
          </p>
        </div>

        {lowConfidence && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Low confidence extraction</p>
              <p className="text-amber-600 text-xs mt-0.5">
                The AI had difficulty reading these plans. Please review all
                values carefully on the next step.
              </p>
            </div>
          </div>
        )}

        {/* Summary card */}
        <div className="bg-white rounded-2xl border border-brand-200/60 overflow-hidden shadow-sm">
          <div className="px-5 py-4 bg-gradient-to-r from-brand-50 to-white border-b border-brand-100">
            <p className="text-sm font-semibold text-brand-800">
              Extraction Summary
            </p>
          </div>
          <div className="p-5">
            {/* Key stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 rounded-xl bg-brand-50/50">
                <Home className="h-5 w-5 text-brand-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-brand-900 tabular-nums">
                  {result.total_sqft.toLocaleString()}
                </p>
                <p className="text-[11px] text-brand-500">Sq Ft</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-brand-50/50">
                <BedDouble className="h-5 w-5 text-brand-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-brand-900">
                  {result.bedrooms}
                </p>
                <p className="text-[11px] text-brand-500">Bedrooms</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-brand-50/50">
                <Bath className="h-5 w-5 text-brand-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-brand-900">
                  {result.bathrooms}
                </p>
                <p className="text-[11px] text-brand-500">Bathrooms</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-brand-50/50">
                <Layers className="h-5 w-5 text-brand-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-brand-900">
                  {result.stories}
                </p>
                <p className="text-[11px] text-brand-500">
                  {result.stories === 1 ? "Story" : "Stories"}
                </p>
              </div>
            </div>

            {/* Room list */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
                {result.rooms.length} Rooms Detected
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.rooms.map((room, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-brand-50/30 border border-brand-100/50"
                  >
                    <span className="text-sm font-medium text-brand-800">
                      {room.name}
                    </span>
                    {room.estimated_sqft && (
                      <span className="text-xs text-brand-500 tabular-nums">
                        ~{room.estimated_sqft} sqft
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Material notes */}
            {result.material_notes.length > 0 && (
              <div className="mt-4 pt-4 border-t border-brand-100">
                <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">
                  Material Notes
                </p>
                <ul className="space-y-1">
                  {result.material_notes.map((note, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-brand-600 flex items-start gap-1.5"
                    >
                      <span className="text-brand-400 mt-0.5">&#8226;</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.style && (
              <p className="text-xs text-brand-500 mt-3">
                Detected style:{" "}
                <span className="font-medium text-brand-700">
                  {result.style}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => onFloorPlanExtracted(result)}
            className="flex-1 h-12 text-base font-semibold"
          >
            Looks Good &mdash; Continue
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            className="h-12"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Start Over
          </Button>
        </div>
      </div>
    );
  }

  // ========== Error screen ==========
  if (state === "error") {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-brand-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-brand-600/70 text-sm max-w-md mx-auto mb-2">
            We couldn't analyze your floor plans. Please try again.
          </p>
          {errorMsg && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-4 py-2 inline-block">
              {errorMsg}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={handleRetry}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button variant="outline" onClick={onStartFromScratch}>
            Start from Scratch Instead
          </Button>
        </div>
      </div>
    );
  }

  // ========== Upload screen (state === "upload") ==========
  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 mb-4">
          <FileUp className="h-6 w-6 text-brand-600" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-brand-900">
          Upload Your Floor Plans
        </h2>
        <p className="text-brand-600/70 mt-2 text-sm">
          Upload PDF blueprints or photos of your floor plans. Our AI will
          extract the details.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
          dragOver
            ? "border-brand-500 bg-brand-50 scale-[1.01]"
            : "border-brand-300 bg-white hover:border-brand-400 hover:bg-brand-50/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="*/*"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
        />
        <Upload
          className={`h-10 w-10 mb-3 transition-colors ${
            dragOver ? "text-brand-600" : "text-brand-400"
          }`}
        />
        <p className="text-sm font-semibold text-brand-800 mb-1">
          {dragOver ? "Drop files here" : "Drag & drop your floor plans"}
        </p>
        <p className="text-xs text-brand-500">
          or click to browse &middot; PDF, images, and more
        </p>
      </div>

      {/* Error message */}
      {errorMsg && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <pre className="whitespace-pre-wrap font-sans">{errorMsg}</pre>
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
            {files.length} file{files.length > 1 ? "s" : ""} selected
          </p>
          {files.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-brand-200/60 shadow-sm"
            >
              {file.type === "application/pdf" ? (
                <FileText className="h-5 w-5 text-red-500 shrink-0" />
              ) : file.type.startsWith("image/") ? (
                <ImageIcon className="h-5 w-5 text-brand-500 shrink-0" />
              ) : (
                <FileText className="h-5 w-5 text-brand-500 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-brand-800 truncate">
                  {file.name}
                </p>
                <p className="text-[11px] text-brand-400">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(idx);
                }}
                className="p-1.5 rounded-lg hover:bg-brand-100 text-brand-400 hover:text-brand-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleAnalyze}
          disabled={files.length === 0}
          className="flex-1 h-12 text-base font-semibold"
        >
          Analyze Plans
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
        <Button variant="outline" onClick={handleReset} className="h-12">
          Back
        </Button>
      </div>
    </div>
  );
}
