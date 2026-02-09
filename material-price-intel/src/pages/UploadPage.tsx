import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, CheckCircle, AlertCircle, FileText, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUploadDocument } from "@/hooks/useUploadDocument";

type DropZoneState = "idle" | "dragover" | "uploading" | "success" | "error";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export function UploadPage() {
  const [zoneState, setZoneState] = useState<DropZoneState>("idle");
  const [fileName, setFileName] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const successTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { uploadDocumentAsync, isPending, isSuccess, isError, error, reset } =
    useUploadDocument();

  // Sync mutation state back to zone state
  useEffect(() => {
    if (isPending) {
      setZoneState("uploading");
    } else if (isSuccess) {
      setZoneState("success");
      successTimeout.current = setTimeout(() => {
        setZoneState("idle");
        setFileName("");
        reset();
      }, 3000);
    } else if (isError) {
      setZoneState("error");
    }
  }, [isPending, isSuccess, isError, reset]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimeout.current) {
        clearTimeout(successTimeout.current);
      }
    };
  }, []);

  function validateFile(file: File): string | null {
    if (file.type !== "application/pdf") {
      return "Only PDF files are supported";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be under 50MB";
    }
    return null;
  }

  async function handleFile(file: File) {
    setValidationError(null);

    const fileError = validateFile(file);
    if (fileError) {
      setValidationError(fileError);
      setZoneState("error");
      return;
    }

    setFileName(file.name);
    setZoneState("uploading");

    try {
      await uploadDocumentAsync(file);
    } catch {
      // Error state is handled by the useEffect above via mutation state
    }
  }

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (dragCounter.current === 1) {
      setZoneState("dragover");
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setZoneState("idle");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uploadDocumentAsync]
  );

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    // Reset input so the same file can be selected again
    e.target.value = "";
  }

  function handleRetry() {
    setZoneState("idle");
    setFileName("");
    setValidationError(null);
    reset();
  }

  function handleZoneClick() {
    if (zoneState === "idle" || zoneState === "dragover") {
      fileInputRef.current?.click();
    }
  }

  const isInteractive = zoneState === "idle" || zoneState === "dragover";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Upload Quote</h2>
        <p className="text-muted-foreground mt-2">
          Drag and drop a PDF quote to extract pricing data
        </p>
      </div>

      <Card className="border-0 shadow-none bg-transparent py-0">
        <CardContent className="px-0">
          <div
            role="button"
            tabIndex={isInteractive ? 0 : undefined}
            onClick={handleZoneClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleZoneClick();
              }
            }}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-colors",
              zoneState === "idle" &&
                "border-muted-foreground/25 hover:border-primary/50 cursor-pointer",
              zoneState === "dragover" &&
                "border-primary bg-primary/5 cursor-pointer",
              zoneState === "uploading" && "border-muted-foreground/25",
              zoneState === "success" && "border-green-500/50 bg-green-500/5",
              zoneState === "error" && "border-destructive/50 bg-destructive/5"
            )}
          >
            {/* Idle state */}
            {zoneState === "idle" && (
              <>
                <Upload className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium text-foreground">
                  Drag and drop your PDF here
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or{" "}
                  <span className="text-primary underline underline-offset-4">
                    click to browse
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-3">
                  PDF files only, up to 50MB
                </p>
              </>
            )}

            {/* Dragover state */}
            {zoneState === "dragover" && (
              <>
                <Upload className="h-12 w-12 text-primary mb-4" />
                <p className="text-lg font-medium text-primary">
                  Drop to upload
                </p>
              </>
            )}

            {/* Uploading state */}
            {zoneState === "uploading" && (
              <>
                <Loader2 className="h-12 w-12 text-primary mb-4 animate-spin" />
                <p className="text-lg font-medium text-foreground">
                  Uploading {fileName}...
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please wait while the file is being uploaded
                </p>
              </>
            )}

            {/* Success state */}
            {zoneState === "success" && (
              <>
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-lg font-medium text-foreground">
                  Uploaded successfully!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Document is queued for processing.
                </p>
                <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{fileName}</span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    pending
                  </span>
                </div>
              </>
            )}

            {/* Error state */}
            {zoneState === "error" && (
              <>
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <p className="text-lg font-medium text-destructive">
                  Upload failed
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {validationError ?? error?.message ?? "An unexpected error occurred"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRetry();
                  }}
                >
                  Try again
                </Button>
              </>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={handleFileSelect}
          />
        </CardContent>
      </Card>
    </div>
  );
}
