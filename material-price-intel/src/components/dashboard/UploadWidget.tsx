import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUploadDocument } from "@/hooks/useUploadDocument";

type DropZoneState = "idle" | "dragover" | "uploading" | "success" | "error";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export function UploadWidget() {
  const [zoneState, setZoneState] = useState<DropZoneState>("idle");
  const [fileName, setFileName] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const successTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { uploadDocumentAsync, isPending, isSuccess, isError, error, reset } =
    useUploadDocument();

  useEffect(() => {
    if (isPending) {
      setZoneState("uploading");
    } else if (isSuccess) {
      setZoneState("success");
      successTimeout.current = setTimeout(() => {
        setZoneState("idle");
        setFileName("");
        reset();
      }, 2500);
    } else if (isError) {
      setZoneState("error");
    }
  }, [isPending, isSuccess, isError, reset]);

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
      // Error state handled by useEffect
    }
  }

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (dragCounter.current === 1) setZoneState("dragover");
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setZoneState("idle");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      const files = e.dataTransfer.files;
      if (files.length > 0) handleFile(files[0]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uploadDocumentAsync]
  );

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) handleFile(files[0]);
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Quick Upload
        </CardTitle>
      </CardHeader>
      <CardContent>
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
            "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors",
            zoneState === "idle" && "border-muted-foreground/25 hover:border-primary/50 cursor-pointer",
            zoneState === "dragover" && "border-primary bg-primary/5 cursor-pointer",
            zoneState === "uploading" && "border-muted-foreground/25",
            zoneState === "success" && "border-green-500/50 bg-green-500/5",
            zoneState === "error" && "border-destructive/50 bg-destructive/5"
          )}
        >
          {zoneState === "idle" && (
            <>
              <Upload className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium">Drop PDF here</p>
              <p className="text-xs text-muted-foreground">or click to browse</p>
            </>
          )}

          {zoneState === "dragover" && (
            <>
              <Upload className="h-8 w-8 text-primary mb-2" />
              <p className="text-sm font-medium text-primary">Drop to upload</p>
            </>
          )}

          {zoneState === "uploading" && (
            <>
              <Loader2 className="h-8 w-8 text-primary mb-2 animate-spin" />
              <p className="text-sm font-medium truncate max-w-full">{fileName}</p>
              <p className="text-xs text-muted-foreground">Uploading...</p>
            </>
          )}

          {zoneState === "success" && (
            <>
              <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
              <p className="text-sm font-medium">Uploaded!</p>
              <p className="text-xs text-muted-foreground">Queued for processing</p>
            </>
          )}

          {zoneState === "error" && (
            <>
              <AlertCircle className="h-8 w-8 text-destructive mb-2" />
              <p className="text-sm font-medium text-destructive">Failed</p>
              <p className="text-xs text-muted-foreground mb-2">
                {validationError ?? error?.message ?? "Error uploading"}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
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

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={handleFileSelect}
        />
      </CardContent>
    </Card>
  );
}
