import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import NoIndex from "@/components/NoIndex";

const BRAND = "#0bb87a";

export default function BrandPreviewPage() {
  return (
    <div className="container py-12">
      <NoIndex />
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">Brand Color Preview</h1>
          <p className="text-muted-foreground">
            Verify the brand color <code className="rounded bg-muted px-1.5 py-0.5">{BRAND}</code> across UI elements.
          </p>
        </header>

        {/* Swatches */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Swatches</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="overflow-hidden rounded-lg border">
              <div className="h-24 bg-primary" />
              <div className="p-3 text-sm">
                <div className="font-medium">Primary (token)</div>
                <div className="text-muted-foreground">bg-primary</div>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border">
              <div className="h-24" style={{ backgroundColor: BRAND }} />
              <div className="p-3 text-sm">
                <div className="font-medium">Raw hex</div>
                <div className="text-muted-foreground">{BRAND}</div>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border">
              <div className="h-24 bg-accent" />
              <div className="p-3 text-sm">
                <div className="font-medium">Accent</div>
                <div className="text-muted-foreground">bg-accent</div>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border">
              <div className="h-24 bg-secondary" />
              <div className="p-3 text-sm">
                <div className="font-medium">Secondary</div>
                <div className="text-muted-foreground">bg-secondary</div>
              </div>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Buttons</h2>
          <div className="flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="sm">Small</Button>
            <Button>Default</Button>
            <Button size="lg">Large</Button>
          </div>
        </section>

        {/* Links */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Links</h2>
          <p className="text-foreground">
            This paragraph contains a{" "}
            <Link to="/" className="text-primary underline-offset-4 hover:underline">
              primary link to the homepage
            </Link>{" "}
            and another{" "}
            <a href="#" className="text-primary underline-offset-4 hover:underline">
              inline anchor link
            </a>{" "}
            for comparison.
          </p>
        </section>

        {/* Cards */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Cards</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Standard card</CardTitle>
                <CardDescription>Default surface with brand CTA</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Cards use the card surface with primary buttons and accent badges.
                </p>
                <div className="flex items-center gap-2">
                  <Badge>Primary</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
                <Button size="sm">Find My System</Button>
              </CardContent>
            </Card>
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-primary">Brand-bordered card</CardTitle>
                <CardDescription>Uses border-primary for emphasis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Useful for highlighting recommended options.
                </p>
                <Button variant="outline" size="sm">Learn more</Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Focus rings & inputs */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Focus rings & inputs</h2>
          <p className="text-sm text-muted-foreground">
            Tab through the controls below to see the brand-colored focus ring.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Focus me to see the ring" />
            <Input placeholder="Another input" />
            <Button variant="outline">Focusable button</Button>
            <a
              href="#"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Focusable link
            </a>
          </div>
        </section>

        {/* Text on brand */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Text on brand surface</h2>
          <div className="rounded-lg bg-primary p-6 text-primary-foreground">
            <h3 className="text-lg font-semibold">Primary surface</h3>
            <p className="mt-1 text-sm opacity-90">
              Verify contrast of foreground text against the brand background.
            </p>
            <Button variant="secondary" size="sm" className="mt-3">
              Secondary action
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
