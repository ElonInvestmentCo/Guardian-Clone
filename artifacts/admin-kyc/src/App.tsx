import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import KycDashboard from "@/pages/KycDashboard";
import NotFound from "@/pages/not-found";
import AdminKeyModal from "@/components/AdminKeyModal";
import { hasAdminKey } from "@/lib/api";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function AppShell() {
  const [authed, setAuthed] = useState(hasAdminKey());

  if (!authed) {
    return <AdminKeyModal onSaved={() => setAuthed(true)} />;
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
