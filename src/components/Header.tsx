import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem } from
"@/components/ui/dropdown-menu";

const navLinks = [
{ to: "/", label: "Home" },
{ to: "/how-it-works", label: "How It Works" },
{ to: "/water-quality", label: "Water Quality" }];


const resourceLinks = [
{ to: "/system-types", label: "System Types" },
{ to: "/pricing-guide", label: "Pricing Guide" },
{ to: "/learn", label: "Learn" }];


export default function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <Droplets className="h-6 w-6 text-primary" />
          <span>Compare Water Filters</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((l) =>
          <Link
            key={l.to}
            to={l.to}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
            location.pathname === l.to ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`
            }>
            
              {l.label}
            </Link>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger className={`flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
            resourceLinks.some((r) => location.pathname === r.to) ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`
            }>
              Resources <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {resourceLinks.map((r) =>
              <DropdownMenuItem key={r.to} asChild>
                  <Link to={r.to} className="w-full cursor-pointer">{r.label}</Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link to="/quiz">
            <Button size="sm" className="ml-2">Find My System</Button>
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile nav */}
      {open &&
      <div className="border-t bg-card lg:hidden">
          <nav className="container flex flex-col gap-1 py-4">
            {navLinks.map((l) =>
          <Link
            key={l.to}
            to={l.to}
            onClick={() => setOpen(false)}
            className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent ${
            location.pathname === l.to ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`
            }>
            
                {l.label}
              </Link>
          )}
            <span className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resources</span>
            {resourceLinks.map((r) =>
          <Link
            key={r.to}
            to={r.to}
            onClick={() => setOpen(false)}
            className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent ${
            location.pathname === r.to ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`
            }>
            
                {r.label}
              </Link>
          )}
            <Link to="/quiz" onClick={() => setOpen(false)}>
              <Button className="mt-2 w-full">Find My System</Button>
            </Link>
          </nav>
        </div>
      }
    </header>);

}