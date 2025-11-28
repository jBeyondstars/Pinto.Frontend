import {
  MousePointer2,
  Hand,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Pencil,
  Type,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCanvasStore, type Tool } from "@/lib/canvas";
import { Button } from "@/components/ui/button";

const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
  { id: "select", icon: <MousePointer2 className="h-4 w-4" />, label: "Select" },
  { id: "pan", icon: <Hand className="h-4 w-4" />, label: "Pan" },
  { id: "rectangle", icon: <Square className="h-4 w-4" />, label: "Rectangle" },
  { id: "ellipse", icon: <Circle className="h-4 w-4" />, label: "Ellipse" },
  { id: "line", icon: <Minus className="h-4 w-4" />, label: "Line" },
  { id: "arrow", icon: <ArrowRight className="h-4 w-4" />, label: "Arrow" },
  { id: "freehand", icon: <Pencil className="h-4 w-4" />, label: "Freehand" },
  { id: "text", icon: <Type className="h-4 w-4" />, label: "Text" },
];

export function Toolbar() {
  const tool = useCanvasStore((s) => s.tool);
  const setTool = useCanvasStore((s) => s.setTool);
  const strokeColor = useCanvasStore((s) => s.strokeColor);
  const setStrokeColor = useCanvasStore((s) => s.setStrokeColor);
  const fillColor = useCanvasStore((s) => s.fillColor);
  const setFillColor = useCanvasStore((s) => s.setFillColor);
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const deleteSelectedShapes = useCanvasStore((s) => s.deleteSelectedShapes);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 bg-background border rounded-lg shadow-lg z-10">
      {tools.map((t) => (
        <Button
          key={t.id}
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8",
            tool === t.id && "bg-accent text-accent-foreground"
          )}
          onClick={() => setTool(t.id)}
          title={t.label}
        >
          {t.icon}
        </Button>
      ))}

      <div className="w-px h-6 bg-border mx-1" />

      <div className="flex items-center gap-2 px-2">
        <label className="flex items-center gap-1 text-xs">
          <span className="text-muted-foreground">Stroke</span>
          <input
            type="color"
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
            className="w-6 h-6 rounded cursor-pointer border-0"
          />
        </label>

        <label className="flex items-center gap-1 text-xs">
          <span className="text-muted-foreground">Fill</span>
          <input
            type="color"
            value={fillColor === "transparent" ? "#ffffff" : fillColor}
            onChange={(e) => setFillColor(e.target.value)}
            className="w-6 h-6 rounded cursor-pointer border-0"
          />
        </label>
      </div>

      {selectedIds.length > 0 && (
        <>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={deleteSelectedShapes}
            title="Delete selected"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}
