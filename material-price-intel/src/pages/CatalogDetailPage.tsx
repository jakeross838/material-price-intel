import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Building2, Phone, Loader2, ArrowLeft, Tag, MessageSquare } from "lucide-react";
import { useCatalogMaterialDetail } from "@/hooks/useCatalog";
import { MaterialImageGallery } from "@/components/catalog/MaterialImageGallery";
import { MaterialDocumentList } from "@/components/catalog/MaterialDocumentList";
import { getPrioritizedSpecs } from "@/lib/categorySpecTemplates";
import { Button } from "@/components/ui/button";

// ===========================================
// CatalogDetailPage - Material detail (public)
// ===========================================
// Accessible at /catalog/:id without auth.
// Shows full image gallery, specs, and documents
// for a single material. Two-column layout on
// desktop, single column on mobile.
// ===========================================

export function CatalogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: material, isLoading, error } = useCatalogMaterialDetail(id);

  useEffect(() => {
    if (material) {
      document.title = `${material.canonical_name} | Ross Built Catalog`;
    } else {
      document.title = "Material Catalog | Ross Built Custom Homes";
    }
    return () => { document.title = "Material Price Intel"; };
  }, [material]);

  // Build specs from category_attributes
  const specs = material
    ? getPrioritizedSpecs(
        (material.category_attributes ?? {}) as Record<string, string>,
        material.material_categories?.name ?? null
      )
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-brand-50/60 via-white to-brand-50/40">
      {/* Header - smaller version */}
      <header className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 text-white py-4 px-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center">
              <Building2 className="h-4 w-4 text-brand-300" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                Ross Built Custom Homes
              </h1>
              <p className="text-brand-300/70 text-[10px] tracking-wide">
                Bradenton &amp; Sarasota, FL
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <a
              href="tel:+19417787600"
              className="flex items-center gap-1.5 text-xs text-brand-300/80 hover:text-white transition-colors"
            >
              <Phone className="h-3.5 w-3.5" />
              (941) 778-7600
            </a>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {/* Back link */}
        <button
          onClick={() => navigate("/catalog")}
          className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-800 font-medium mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Catalog
        </button>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading material details...
          </div>
        )}

        {/* Not found */}
        {!isLoading && (error || !material) && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p className="text-lg font-medium mb-2">Material not found</p>
            <p className="text-sm mb-4">
              This material may have been removed or the link may be incorrect.
            </p>
            <Button variant="outline" onClick={() => navigate("/catalog")}>
              Back to Catalog
            </Button>
          </div>
        )}

        {/* Material detail */}
        {material && (
          <div className="space-y-8">
            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Left column: Gallery (60%) */}
              <div className="lg:col-span-3">
                <MaterialImageGallery
                  images={material.material_images ?? []}
                  materialName={material.canonical_name}
                />
              </div>

              {/* Right column: Info (40%) */}
              <div className="lg:col-span-2 space-y-5">
                {/* Name */}
                <h2 className="text-2xl font-bold text-foreground">
                  {material.canonical_name}
                </h2>

                {/* Category badge */}
                {material.material_categories && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
                    <Tag className="h-3 w-3" />
                    {material.material_categories.display_name}
                  </span>
                )}

                {/* Key details */}
                <div className="space-y-2">
                  {material.species && (
                    <DetailRow label="Species" value={material.species} />
                  )}
                  {material.dimensions && (
                    <DetailRow label="Dimensions" value={material.dimensions} />
                  )}
                  {material.grade && (
                    <DetailRow label="Grade" value={material.grade} />
                  )}
                  {material.treatment && (
                    <DetailRow label="Treatment" value={material.treatment} />
                  )}
                  {material.unit_of_measure && (
                    <DetailRow label="Unit" value={material.unit_of_measure} />
                  )}
                </div>

                {/* Category-specific specs */}
                {specs.length > 0 && (
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Specifications
                    </h3>
                    <div className="space-y-1.5">
                      {specs.map((spec) => (
                        <DetailRow
                          key={spec.key}
                          label={spec.label}
                          value={spec.value}
                          highlighted={spec.isHighlighted}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Price - placeholder */}
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm font-medium text-foreground">Contact for pricing</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pricing varies based on quantity, delivery, and project scope.
                  </p>
                </div>

                {/* CTA */}
                <Button
                  onClick={() => navigate("/estimate")}
                  className="w-full bg-brand-700 hover:bg-brand-800 text-white"
                  size="lg"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Get a Free Estimate
                </Button>
              </div>
            </div>

            {/* Documents section (full width) */}
            {material.material_documents && material.material_documents.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Documents & Resources</h3>
                <MaterialDocumentList documents={material.material_documents} />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-brand-950 text-brand-300/60 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center space-y-2">
          <p className="text-xs">
            Browse our materials to plan your dream home. Contact us for pricing and availability.
          </p>
          <div className="flex items-center justify-center gap-2 pt-3">
            <Building2 className="h-3.5 w-3.5 text-brand-500/50" />
            <p className="text-xs text-brand-400/40">
              &copy; {new Date().getFullYear()} Ross Built Custom Homes &mdash;
              Licensed &amp; Insured &mdash; EST. 2006
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ===========================================
// DetailRow - label:value pair
// ===========================================

function DetailRow({
  label,
  value,
  highlighted = false,
}: {
  label: string;
  value: string;
  highlighted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={`text-sm font-medium ${
          highlighted ? "text-brand-700" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
