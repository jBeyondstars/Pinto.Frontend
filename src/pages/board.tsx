import { Link, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBoard } from "@/hooks/use-boards";

export function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const { data: board, isLoading, error } = useBoard(id!);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading board...</p>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Board not found</p>
          <Button asChild variant="outline">
            <Link to="/boards">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Boards
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-2 flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link to="/boards">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-medium">{board.name}</h1>
            {board.description && (
              <p className="text-xs text-muted-foreground">{board.description}</p>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <div className="w-64 h-64 border-2 border-dashed rounded-lg flex items-center justify-center mb-4 mx-auto">
            <p className="text-muted-foreground">Canvas area</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Canvas implementation coming in Phase 3
          </p>
        </div>
      </main>
    </div>
  );
}
