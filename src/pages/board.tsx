import { Link, useParams } from "react-router";
import { ArrowLeft, Code, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Whiteboard } from "@/components/canvas/whiteboard";
import { CodePanel } from "@/components/editor/code-panel";
import { useBoard, useUpdateCanvas } from "@/hooks/use-boards";
import type { CanvasState } from "@/lib/canvas";

export function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const { data: board, isLoading, error } = useBoard(id!);
  const updateCanvas = useUpdateCanvas();
  const [showCode, setShowCode] = useState(false);

  const initialData = useMemo(() => {
    if (!board?.canvasData) return undefined;
    try {
      return JSON.parse(board.canvasData) as CanvasState;
    } catch {
      return undefined;
    }
  }, [board?.canvasData]);

  const handleSave = useCallback(
    (state: CanvasState) => {
      if (!id) return;
      updateCanvas.mutate({
        id,
        data: { canvasData: JSON.stringify(state) },
      });
    },
    [id, updateCanvas]
  );

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
    <div className="h-screen bg-background flex flex-col">
      <header className="border-b shrink-0">
        <div className="container mx-auto px-4 py-2 flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link to="/boards">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="font-medium">{board.name}</h1>
            {board.description && (
              <p className="text-xs text-muted-foreground">{board.description}</p>
            )}
          </div>
          <Button
            variant={showCode ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowCode(!showCode)}
          >
            {showCode ? <X className="h-4 w-4 mr-1" /> : <Code className="h-4 w-4 mr-1" />}
            {showCode ? "Close" : "Code"}
          </Button>
          {updateCanvas.isPending && (
            <span className="text-xs text-muted-foreground">Saving...</span>
          )}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {showCode && (
          <div className="w-80 shrink-0">
            <CodePanel />
          </div>
        )}
        <div className="flex-1 relative">
          <Whiteboard
            key={board.id}
            initialData={initialData}
            onSave={handleSave}
            autoSaveInterval={3000}
          />
        </div>
      </main>
    </div>
  );
}
