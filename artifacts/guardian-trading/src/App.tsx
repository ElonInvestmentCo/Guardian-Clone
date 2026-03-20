import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Platforms from "@/pages/Platforms";
import Contact from "@/pages/Contact";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ForgotPassword from "@/pages/ForgotPassword";
import EmailVerification from "@/pages/EmailVerification";
import GeneralDetails from "@/pages/GeneralDetails";
import PersonalDetails from "@/pages/PersonalDetails";
import ProfessionalDetails from "@/pages/ProfessionalDetails";
import IdInformation from "@/pages/IdInformation";
import IncomeDetails from "@/pages/IncomeDetails";
import RiskTolerance from "@/pages/RiskTolerance";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/analytics/Dashboard";
import Projects from "@/pages/analytics/Projects";
import Campaigns from "@/pages/analytics/Campaigns";
import Heatmap from "@/pages/analytics/Heatmap";
import Sessions from "@/pages/analytics/Sessions";
import Insights from "@/pages/analytics/Insights";

const queryClient = new QueryClient();

function GuestRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Redirect to="/general-details" />;
  return <Component />;
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Redirect to="/login" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/platforms" component={Platforms} />
      <Route path="/contact" component={Contact} />
      <Route path="/login">
        {() => <GuestRoute component={Login} />}
      </Route>
      <Route path="/signup">
        {() => <GuestRoute component={Signup} />}
      </Route>
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/email-verification" component={EmailVerification} />
      <Route path="/general-details">
        {() => <ProtectedRoute component={GeneralDetails} />}
      </Route>
      <Route path="/personal-details">
        {() => <ProtectedRoute component={PersonalDetails} />}
      </Route>
      <Route path="/professional-details">
        {() => <ProtectedRoute component={ProfessionalDetails} />}
      </Route>
      <Route path="/id-information">
        {() => <ProtectedRoute component={IdInformation} />}
      </Route>
      <Route path="/analytics" component={Dashboard} />
      <Route path="/analytics/projects" component={Projects} />
      <Route path="/analytics/campaigns" component={Campaigns} />
      <Route path="/analytics/heatmaps" component={Heatmap} />
      <Route path="/analytics/sessions" component={Sessions} />
      <Route path="/analytics/insights" component={Insights} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
