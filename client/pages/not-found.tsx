import { Layout } from "@/components/Layout";
import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <Layout title="404 - Page Not Found">
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center p-8 glass-panel rounded-3xl max-w-md w-full mx-4">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-6" />
          <h1 className="text-4xl font-display font-bold mb-4">404</h1>
          <p className="text-muted-foreground mb-8">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <Link href="/" className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl inline-block transition-colors shadow-lg shadow-primary/25">
            Return Home
          </Link>
        </div>
      </div>
    </Layout>
  );
}
