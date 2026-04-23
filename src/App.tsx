import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HomePage from "@/pages/HomePage";
import AboutPage from "@/pages/AboutPage";
import QuizPage from "@/pages/QuizPage";
import ResultsPage from "@/pages/ResultsPage";
import SystemTypesPage from "@/pages/SystemTypesPage";
import PricingGuidePage from "@/pages/PricingGuidePage";
import LearnPage from "@/pages/LearnPage";
import ArticlePage from "@/pages/ArticlePage";
import HowItWorksPage from "@/pages/HowItWorksPage";
import ContactPage from "@/pages/ContactPage";
import ProviderMatchPage from "@/pages/ProviderMatchPage";
import AdminProvidersPage from "@/pages/AdminProvidersPage";
import AdminLeadsPage from "@/pages/AdminLeadsPage";
import AdminAnalyticsPage from "@/pages/AdminAnalyticsPage";
import AdminInvoicesPage from "@/pages/AdminInvoicesPage";
import AdminLoginPage from "@/pages/AdminLoginPage";
import AdminAccountPage from "@/pages/AdminAccountPage";
import AdminSeoPreviewPage from "@/pages/AdminSeoPreviewPage";
import VendorLoginPage from "@/pages/VendorLoginPage";
import VendorRegisterPage from "@/pages/VendorRegisterPage";
import VendorForgotPasswordPage from "@/pages/VendorForgotPasswordPage";
import VendorResetPasswordPage from "@/pages/VendorResetPasswordPage";
import VendorDashboardPage from "@/pages/VendorDashboardPage";
import VendorSettingsPage from "@/pages/VendorSettingsPage";
import VendorProfilePage from "@/pages/VendorProfilePage";
import VendorBillingPage from "@/pages/VendorBillingPage";
import AdminRoute from "@/components/AdminRoute";
import VendorRoute from "@/components/VendorRoute";
import WaterQualityPage from "@/pages/WaterQualityPage";
import UnsubscribePage from "@/pages/UnsubscribePage";
import DisclaimerPage from "@/pages/DisclaimerPage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import NotFound from "@/pages/NotFound";
import BrandPreviewPage from "@/pages/BrandPreviewPage";
import ScrollToTop from "@/components/ScrollToTop";
import CookieConsent from "@/components/CookieConsent";
import CanonicalDomainGuard from "@/components/CanonicalDomainGuard";
import { checkSystemTypesSync } from "@/lib/checkSystemTypesSync";

const queryClient = new QueryClient();

if (import.meta.env.DEV) {
  void checkSystemTypesSync();
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CanonicalDomainGuard />
        <ScrollToTop />
        <Header />
        <main className="min-h-[calc(100vh-4rem)]">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/system-types" element={<SystemTypesPage />} />
            <Route path="/pricing-guide" element={<PricingGuidePage />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/learn/:slug" element={<ArticlePage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/provider-match" element={<ProviderMatchPage />} />
            <Route path="/water-quality" element={<WaterQualityPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/providers" element={<AdminRoute><AdminProvidersPage /></AdminRoute>} />
            <Route path="/admin/leads" element={<AdminRoute><AdminLeadsPage /></AdminRoute>} />
            <Route path="/admin/analytics" element={<AdminRoute><AdminAnalyticsPage /></AdminRoute>} />
            <Route path="/admin/invoices" element={<AdminRoute><AdminInvoicesPage /></AdminRoute>} />
            <Route path="/admin/account" element={<AdminRoute><AdminAccountPage /></AdminRoute>} />
            <Route path="/admin/seo-preview" element={<AdminRoute><AdminSeoPreviewPage /></AdminRoute>} />
            <Route path="/vendor/login" element={<VendorLoginPage />} />
            <Route path="/vendor/forgot-password" element={<VendorForgotPasswordPage />} />
            <Route path="/vendor/reset-password" element={<VendorResetPasswordPage />} />
            <Route path="/vendor/register" element={<VendorRegisterPage />} />
            <Route path="/vendor/dashboard" element={<VendorRoute><VendorDashboardPage /></VendorRoute>} />
            <Route path="/vendor/settings" element={<VendorRoute><VendorSettingsPage /></VendorRoute>} />
            <Route path="/vendor/profile" element={<VendorRoute><VendorProfilePage /></VendorRoute>} />
            <Route path="/vendor/billing" element={<VendorRoute><VendorBillingPage /></VendorRoute>} />
            <Route path="/unsubscribe" element={<UnsubscribePage />} />
            <Route path="/disclaimer" element={<DisclaimerPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/brand-preview" element={<BrandPreviewPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        <CookieConsent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
