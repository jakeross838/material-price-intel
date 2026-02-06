import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          404 - Page Not Found
        </h1>
        <p className="text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="inline-block text-primary underline underline-offset-4 hover:text-primary/80"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
