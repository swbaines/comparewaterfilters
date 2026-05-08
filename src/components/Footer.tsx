import { Link } from "react-router-dom";
import logoSrc from "@/assets/logo.png";

export default function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center shrink-0">
              <img
                src={logoSrc}
                alt="Compare Water Filters"
                className="h-9 w-auto md:h-10"
                loading="lazy"
                decoding="async"
                style={{ imageRendering: '-webkit-optimize-contrast' }}
              />
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
            Helping Australian households choose the right water filtration system with clear, independent guidance.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Australian-owned
              <br />
              Compare Water Filters Pty Ltd
              <br />
              ABN - 32 697 405 093
              <br />
              <a
                href="mailto:hello@comparewaterfilters.com.au"
                className="hover:text-foreground"
              >
                hello@comparewaterfilters.com.au
              </a>
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Explore</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/quiz" className="hover:text-foreground">Find My System</Link></li>
              <li><Link to="/system-types" className="hover:text-foreground">System Types</Link></li>
              <li><Link to="/pricing-guide" className="hover:text-foreground">Pricing Guide</Link></li>
              <li><Link to="/water-quality" className="hover:text-foreground">Water Quality Lookup</Link></li>
              <li><Link to="/learn" className="hover:text-foreground">Learn</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground">About Us</Link></li>
              <li><Link to="/how-it-works" className="hover:text-foreground">How Recommendations Work</Link></li>
              <li><Link to="/contact" className="hover:text-foreground">Contact Us</Link></li>
              <li><Link to="/provider-match" className="hover:text-foreground">Request Provider Match</Link></li>
              <li><Link to="/vendor/login" className="hover:text-foreground">Provider Portal</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Get Started</h4>
            <p className="text-sm text-muted-foreground">
              Answer a few simple questions and we'll match you with the right water filtration system for your home.
            </p>
            <Link to="/quiz" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
              Find My System →
            </Link>
          </div>
        </div>
        <div className="mt-10 border-t pt-6 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Compare Water Filters. All rights reserved. Recommendations are educational and not a substitute for professional assessment.</span>
          <div className="flex items-center gap-3">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/disclaimer" className="hover:text-foreground transition-colors">Disclaimer</Link>
            <Link to="/admin/login" className="hover:text-foreground transition-colors">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
