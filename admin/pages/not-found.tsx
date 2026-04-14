import { Link } from "wouter";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#F1F2F7",
    }}>
      <div className="card-safee" style={{ maxWidth: 420, width: "100%", margin: "0 16px", textAlign: "center", padding: "40px 32px" }}>
        <i className="bi bi-exclamation-triangle" style={{ fontSize: 40, color: "#DC3545" }} />
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1E293B", margin: "16px 0 8px" }}>404 — Page Not Found</h1>
        <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 20px" }}>
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link href="/" className="btn btn-primary">
          <i className="bi bi-arrow-left me-1" />Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
