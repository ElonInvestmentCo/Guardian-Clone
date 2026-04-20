import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoadingProvider } from "@/context/LoadingContext";
import { PageLoader } from "@/components/PageLoader";
import { NavigationLoader } from "@/components/NavigationLoader";
import { OnboardingProvider } from "@/lib/onboarding/OnboardingContext";
import { OnboardingGuard } from "@/lib/onboarding/OnboardingGuard";
import { ThemeProvider } from "@/context/ThemeContext";
import AntiScrape from "@/components/AntiScrape";
import NeedHelpCard from "@/components/NeedHelpCard";
import { ScrollAndFormReset } from "@/components/ScrollAndFormReset";

import Home from "@/pages/Home";
import About from "@/pages/About";
import Platforms from "@/pages/Platforms";
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
import FinancialSituation from "@/pages/FinancialSituation";
import InvestmentExperience from "@/pages/InvestmentExperience";
import IdProofUpload from "@/pages/IdProofUpload";
import FundingDetails from "@/pages/FundingDetails";
import Disclosures from "@/pages/Disclosures";
import Signatures from "@/pages/Signatures";
import ApplicationSubmitted from "@/pages/ApplicationSubmitted";
import ApplicationPending from "@/pages/ApplicationPending";
import AccountVerified from "@/pages/AccountVerified";
import DashboardOverview from "@/pages/dashboard/Overview";
import DashboardMarkets from "@/pages/dashboard/Markets";
import DashboardPositions from "@/pages/dashboard/Positions";
import DashboardOrders from "@/pages/dashboard/Orders";
import DashboardPortfolio from "@/pages/dashboard/Portfolio";
import DashboardStatements from "@/pages/dashboard/Statements";
import DashboardNotifications from "@/pages/dashboard/Notifications";
import DashboardSettings from "@/pages/dashboard/Settings";
import KycResubmit from "@/pages/KycResubmit";
import KycReviewing from "@/pages/KycReviewing";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/analytics/Dashboard";
import Projects from "@/pages/analytics/Projects";
import Campaigns from "@/pages/analytics/Campaigns";
import Heatmap from "@/pages/analytics/Heatmap";
import Sessions from "@/pages/analytics/Sessions";
import Insights from "@/pages/analytics/Insights";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* ── Public routes ─────────────────────────────────────────────── */}
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/platforms" component={Platforms} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/email-verification" component={EmailVerification} />

      {/* ── Onboarding — sequential, guarded ──────────────────────────── */}
      <Route path="/general-details">
        {() => <OnboardingGuard step={0}><GeneralDetails /></OnboardingGuard>}
      </Route>
      <Route path="/personal-details">
        {() => <OnboardingGuard step={1}><PersonalDetails /></OnboardingGuard>}
      </Route>
      <Route path="/professional-details">
        {() => <OnboardingGuard step={2}><ProfessionalDetails /></OnboardingGuard>}
      </Route>
      <Route path="/id-information">
        {() => <OnboardingGuard step={3}><IdInformation /></OnboardingGuard>}
      </Route>
      <Route path="/income-details">
        {() => <OnboardingGuard step={4}><IncomeDetails /></OnboardingGuard>}
      </Route>
      <Route path="/risk-tolerance">
        {() => <OnboardingGuard step={5}><RiskTolerance /></OnboardingGuard>}
      </Route>
      <Route path="/financial-situation">
        {() => <OnboardingGuard step={6}><FinancialSituation /></OnboardingGuard>}
      </Route>
      <Route path="/investment-experience">
        {() => <OnboardingGuard step={7}><InvestmentExperience /></OnboardingGuard>}
      </Route>
      <Route path="/id-proof-upload">
        {() => <OnboardingGuard step={8}><IdProofUpload /></OnboardingGuard>}
      </Route>
      <Route path="/funding-details">
        {() => <OnboardingGuard step={9}><FundingDetails /></OnboardingGuard>}
      </Route>
      <Route path="/disclosures">
        {() => <OnboardingGuard step={10}><Disclosures /></OnboardingGuard>}
      </Route>
      <Route path="/signatures">
        {() => <OnboardingGuard step={11}><Signatures /></OnboardingGuard>}
      </Route>

      {/* ── Post-onboarding ───────────────────────────────────────────── */}
      <Route path="/application-submitted" component={ApplicationSubmitted} />
      <Route path="/application-pending" component={ApplicationPending} />
      <Route path="/account-verified" component={AccountVerified} />

      {/* ── KYC lifecycle ──────────────────────────────────────────────── */}
      <Route path="/kyc/resubmit" component={KycResubmit} />
      <Route path="/kyc/reviewing" component={KycReviewing} />

      {/* ── Dashboard ─────────────────────────────────────────────────── */}
      <Route path="/dashboard" component={DashboardOverview} />
      <Route path="/markets" component={DashboardMarkets} />
      <Route path="/positions" component={DashboardPositions} />
      <Route path="/orders" component={DashboardOrders} />
      <Route path="/portfolio" component={DashboardPortfolio} />
      <Route path="/statements" component={DashboardStatements} />
      <Route path="/notifications" component={DashboardNotifications} />
      <Route path="/settings" component={DashboardSettings} />

      {/* ── Analytics ─────────────────────────────────────────────────── */}
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
      <TooltipProvider>
        <LoadingProvider>
          <ThemeProvider>
            <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "/"}>
              <OnboardingProvider>
                <ScrollAndFormReset />
                <NavigationLoader />
                <Router />
              </OnboardingProvider>
            </WouterRouter>
            <NeedHelpCard />
            <AntiScrape />
            <PageLoader />
            <Toaster />

          </ThemeProvider>
        </LoadingProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
