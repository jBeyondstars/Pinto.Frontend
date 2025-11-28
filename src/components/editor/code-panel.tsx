import { useState, useCallback } from "react";
import { Play, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseAndCompile, decompile } from "@/lib/dsl";
import { useCanvasStore } from "@/lib/canvas";

const EXAMPLE_CODE = `# Simple flowchart
start(circle): "Start"
process(rect): "Process Data"
decision(diamond): "Valid?"
success(rect): "Success"
failure(rect): "Retry"

start -> process
process -> decision
decision -> success: "Yes"
decision -> failure: "No"
failure -> process`;

export function CodePanel() {
  const [code, setCode] = useState(EXAMPLE_CODE);
  const [errors, setErrors] = useState<string[]>([]);
  const [isCompiling, setIsCompiling] = useState(false);

  const shapes = useCanvasStore((s) => s.shapes);
  const addShape = useCanvasStore((s) => s.addShape);
  const clear = useCanvasStore((s) => s.clear);

  const handleRun = useCallback(async () => {
    setIsCompiling(true);
    setErrors([]);

    try {
      const result = await parseAndCompile(code, {
        algorithm: "layered",
        direction: "DOWN",
        nodeSpacing: 60,
      });

      if (result.errors.length > 0) {
        setErrors(result.errors.map((e) => e.message));
      } else {
        clear();
        for (const shape of result.shapes) {
          addShape(shape);
        }
      }
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Unknown error"]);
    } finally {
      setIsCompiling(false);
    }
  }, [code, addShape, clear]);

  const handleSync = useCallback(() => {
    const generatedCode = decompile(shapes);
    setCode(generatedCode || "# Empty canvas");
    setErrors([]);
  }, [shapes]);

  return (
    <div className="flex flex-col h-full bg-background border-r">
      <div className="flex items-center justify-between p-2 border-b gap-1">
        <span className="text-sm font-medium">Code</span>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            title="Sync from canvas"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={handleRun}
            disabled={isCompiling}
          >
            <Play className="h-4 w-4 mr-1" />
            {isCompiling ? "..." : "Run"}
          </Button>
        </div>
      </div>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="flex-1 p-3 font-mono text-sm bg-muted/30 resize-none focus:outline-none"
        placeholder="Enter Pinto DSL code..."
        spellCheck={false}
      />

      {errors.length > 0 && (
        <div className="p-2 border-t bg-destructive/10">
          {errors.map((err, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
