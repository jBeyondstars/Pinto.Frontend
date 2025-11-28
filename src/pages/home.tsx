import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export function HomePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">Pinto</h1>
        <p className="text-muted-foreground">
          Interactive whiteboard with AI-powered schema-as-code
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link to="/boards">Get Started</Link>
          </Button>
          <Button variant="outline">Learn More</Button>
        </div>
      </div>
    </div>
  );
}
