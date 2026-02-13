import { useState } from "react";
import { Package, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

// ===========================================
// MaterialImageGallery - Presentational
// ===========================================
// Image gallery for material catalog detail.
// Main image + thumbnail strip with selection.
// Receives pre-resolved image URLs via props.
// ===========================================

type MaterialImageGalleryProps = {
  images: Array<{
    id: string;
    image_url: string;
    thumbnail_url: string | null;
    caption: string | null;
    source: string | null;
  }>;
  materialName: string; // for alt text
};

export function MaterialImageGallery({
  images,
  materialName,
}: MaterialImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Empty state
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/30 rounded-lg">
        <Package className="h-12 w-12 mb-3 opacity-40" />
        <p className="text-sm">No images available</p>
      </div>
    );
  }

  const selected = images[selectedIndex];
  if (!selected) return null;

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative group rounded-lg overflow-hidden bg-muted">
        <img
          src={selected.image_url}
          alt={`${materialName} - image ${selectedIndex + 1}`}
          className="w-full aspect-[4/3] object-cover"
          loading="lazy"
        />

        {/* Open in new tab overlay */}
        <a
          href={selected.image_url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20"
          title="Open full size"
        >
          <div className="bg-black/60 text-white rounded-full p-2">
            <ExternalLink className="h-4 w-4" />
          </div>
        </a>
      </div>

      {/* Caption */}
      {selected.caption && (
        <p className="text-xs text-muted-foreground">{selected.caption}</p>
      )}

      {/* Source attribution */}
      {selected.source && (
        <p className="text-[10px] text-muted-foreground/70">
          Source: {selected.source}
        </p>
      )}

      {/* Thumbnail strip -- hidden if only one image */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setSelectedIndex(idx)}
              className={cn(
                "shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all",
                idx === selectedIndex
                  ? "border-primary ring-1 ring-primary/30"
                  : "border-transparent hover:border-muted-foreground/30"
              )}
            >
              <img
                src={img.thumbnail_url ?? img.image_url}
                alt={`${materialName} - thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
