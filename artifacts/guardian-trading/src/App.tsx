import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoadingProvider } from "@/context/LoadingContext";
import { PageLoader } from "@/components/PageLoader";
import { NavigationLoader } from "@/components/NavigationLoader";
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
import FinancialSituation from "@/pages/FinancialSituation";
import InvestmentExperience from "@/pages/InvestmentExperience";
import IdProofUpload from "@/pages/IdProofUpload";
import FundingDetails from "@/pages/FundingDetails";
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
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/platforms" component={Platforms} />
      <Route path="/contact" component={Contact} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/email-verification" component={EmailVerification} />
      <Route path="/general-details" component={GeneralDetails} />
      <Route path="/personal-details" component={PersonalDetails} />
      <Route path="/professional-details" component={ProfessionalDetails} />
      <Route path="/id-information" component={IdInformation} />
      <Route path="/income-details" component={IncomeDetails} />
      <Route path="/risk-tolerance" component={RiskTolerance} />
      <Route path="/financial-situation" component={FinancialSituation} />
      <Route path="/investment-experience" component={InvestmentExperience} />
      <Route path="/id-proof-upload" component={IdProofUpload} />
      <Route path="/funding-details" component={FundingDetails} />
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
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <NavigationLoader />
            <Router />
          </WouterRouter>
          <PageLoader />
          <Toaster />
        </LoadingProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
