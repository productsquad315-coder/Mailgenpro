import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { usePageTracking } from "./hooks/usePageTracking";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CreateCampaign from "./pages/CreateCampaign";
import Onboarding from "./pages/Onboarding";
import AnalyzingCampaign from "./pages/AnalyzingCampaign";
import CampaignView from "./pages/CampaignView";
import Profile from "./pages/Profile";
import Billing from "./pages/Billing";
import Usage from "./pages/Usage";
import Support from "./pages/Support";
import Updates from "./pages/Updates";
import NotFound from "./pages/NotFound";
import RecoveryRedirect from "./components/auth/RecoveryRedirect";
import ChoosePlan from "./pages/ChoosePlan";
import SharedCampaignView from "./pages/SharedCampaignView";
import HowItWorks from "./pages/HowItWorks";
import GuestCampaignFlow from "./pages/GuestCampaignFlow";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Admin from "./pages/Admin";
import Help from "./pages/Help";
import Contacts from "./pages/Contacts";
import SendingProgress from "./pages/SendingProgress";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import UseCaseFounders from "./pages/use-cases/Founders";
import MailGenProVsChatGPT from "./pages/comparisons/MailGenProVsChatGPT";
import MailGenProVsCopyAI from "./pages/comparisons/MailGenProVsCopyAI";

const queryClient = new QueryClient();

const AppRoutes = () => {
  usePageTracking();

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/choose-plan" element={<ProtectedRoute><ChoosePlan /></ProtectedRoute>} />
      <Route path="/guest-flow" element={<GuestCampaignFlow />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
      <Route path="/create-campaign" element={<ProtectedRoute><CreateCampaign /></ProtectedRoute>} />
      <Route path="/campaign/:id/analyzing" element={<ProtectedRoute allowGuest><AnalyzingCampaign /></ProtectedRoute>} />
      <Route path="/campaign/:id/sending" element={<ProtectedRoute><SendingProgress /></ProtectedRoute>} />
      <Route path="/campaign/:id" element={<ProtectedRoute allowGuest><CampaignView /></ProtectedRoute>} />
      <Route path="/shared/:shareToken" element={<SharedCampaignView />} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      <Route path="/help" element={<Help />} />
      <Route path="/usage" element={<ProtectedRoute><Usage /></ProtectedRoute>} />
      <Route path="/support" element={<Support />} />
      <Route path="/updates" element={<Updates />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/about" element={<About />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/use-cases/founders" element={<UseCaseFounders />} />
      <Route path="/comparisons/chatgpt" element={<MailGenProVsChatGPT />} />
      <Route path="/comparisons/copy-ai" element={<MailGenProVsCopyAI />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RecoveryRedirect />
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
