import { useState, useEffect, useCallback } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import KycDashboard from "@/pages/KycDashboard";
import NotFound from "@/pages/not-found";
import AdminLoginModal from "@/components/AdminKeyModal";
import { isAuthenticated, clearSession, getSession } from "@/lib/api";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
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

  // Show time remaining in title bar when close to expiry
  useEffect(() => {
    if (!authed) return;
    const session = getSession();
    if (!session) return;
    const msLeft = session.expiresAt - Date.now();
    if (msLeft > 0) {
      const id = setTimeout(() => handleLogout(), msLeft);
      return () => clearTimeout(id);
    }
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
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AppShell />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
