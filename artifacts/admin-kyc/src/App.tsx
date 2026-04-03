import { useState, useEffect, useCallback, Component, type ReactNode, type ErrorInfo } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import KycDashboard from "@/pages/KycDashboard";
import NotFound from "@/pages/not-found";
import AdminLoginModal from "@/components/AdminKeyModal";
import { isAuthenticated, clearSession, getSession } from "@/lib/api";
import { LoadingProvider } from "@/context/LoadingContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { PageLoader } from "@/components/PageLoader";
import AntiScrape from "@/components/AntiScrape";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[AdminKYC] Error boundary caught:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'Inter', system-ui, sans-serif", background: "#F0F4F8", padding: "20px" }}>
          <div style={{ background: "white", borderRadius: "12px", padding: "32px", maxWidth: "420px", width: "100%", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <span style={{ color: "#DC2626", fontSize: "24px" }}>!</span>
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1F2937", marginBottom: "8px" }}>Something went wrong</h2>
            <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "20px" }}>{this.state.error?.message || "An unexpected error occurred."}</p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); }}
              style={{ padding: "10px 24px", background: "#2563EB", color: "white", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 10_000, refetchInterval: 15_000, refetchOnWindowFocus: true } },
});

function AppShell() {
  const [authed, setAuthed] = useState(isAuthenticated);

  const handleLogout = useCallback(() => {
    clearSession();
    queryClient.clear();
    setAuthed(false);
  }, []);

  // Listen for session-expired events fired by the API client
  useEffect(() => {
    const handler = () => handleLogout();
    window.addEventListener("admin:session-expired", handler);
    return () => window.removeEventListener("admin:session-expired", handler);
  }, [handleLogout]);

  // Poll every minute to auto-logout when the token expires
  useEffect(() => {
    if (!authed) return;
    const id = setInterval(() => {
      if (!isAuthenticated()) handleLogout();
    }, 60_000);
    return () => clearInterval(id);
  }, [authed, handleLogout]);

  // Auto-logout exactly when the token expires
  useEffect(() => {
    if (!authed) return undefined;
    const session = getSession();
    if (!session) return undefined;
    const msLeft = session.expiresAt - Date.now();
    if (msLeft <= 0) { handleLogout(); return undefined; }
    const id = setTimeout(() => handleLogout(), msLeft);
    return () => clearTimeout(id);
  }, [authed, handleLogout]);

  if (!authed) {
    return <AdminLoginModal onSuccess={() => setAuthed(true)} />;
  }

  return (
    <Switch>
      <Route path="/" component={KycDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <LoadingProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AppShell />
            </WouterRouter>
            <AntiScrape />
            <PageLoader />
          </LoadingProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
