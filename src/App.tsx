import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HomePage from "@/pages/HomePage";
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
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
            <Route path="/provider-match" element={<ProviderMatchPage />} />
            <Route path="/admin/providers" element={<AdminProvidersPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
