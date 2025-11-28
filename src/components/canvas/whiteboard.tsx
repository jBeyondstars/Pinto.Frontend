import { useRef, useEffect, useCallback, useState } from "react";
import {
  useCanvasStore,
  renderCanvas,
  screenToCanvas,
  getShapeAtPoint,
  generateId,
  simplifyPath,
  findConnectableShapeNearPoint,
  type Point,
  type Shape,
  type ArrowShape,
  type LineShape,
  type CanvasState,
} from "@/lib/canvas";
import { Toolbar } from "./toolbar";

interface WhiteboardProps {
  initialData?: CanvasState;
  onSave?: (state: CanvasState) => void;
  autoSaveInterval?: number;
}

export function Whiteboard({
  initialData,
  onSave,
  autoSaveInterval = 5000,
}: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const lastSaveRef = useRef<string>("");

  const store = useCanvasStore();

  // Load initial data
  useEffect(() => {
    if (initialData) {
      store.loadState(initialData);
    }
  }, [initialData, store.loadState]);

  // Auto-save
  useEffect(() => {
    if (!onSave) return;

    const interval = setInterval(() => {
      const snapshot = store.getSnapshot();
      const snapshotString = JSON.stringify(snapshot);

      if (snapshotString !== lastSaveRef.current) {
        lastSaveRef.current = snapshotString;
        onSave(snapshot);
      }
    }, autoSaveInterval);

    return () => clearInterval(interval);
  }, [onSave, autoSaveInterval, store.getSnapshot]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      const { shapes, selectedIds, camera } = store;
      const allShapes = currentShape ? [...shapes, currentShape] : shapes;
      renderCanvas(ctx, { shapes: allShapes, selectedIds, camera }, canvas.width, canvas.height);
    };

    render();
    const unsubscribe = useCanvasStore.subscribe(render);
    return () => unsubscribe();
  }, [currentShape, store]);

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const getCanvasPoint = useCallback(
    (e: React.MouseEvent): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const screenPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      return screenToCanvas(screenPoint, store.camera);
    },
    [store.camera]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const point = getCanvasPoint(e);
      setIsDrawing(true);
      setStartPoint(point);

      const { tool, strokeColor, fillColor, strokeWidth, shapes } = store;

      if (tool === "select") {
        const shape = getShapeAtPoint(point, shapes);
        if (shape) {
          if (e.shiftKey) {
            store.setSelectedIds([...store.selectedIds, shape.id]);
          } else {
            store.setSelectedIds([shape.id]);
          }
        } else {
          store.clearSelection();
        }
      } else if (tool === "pan") {
        // Pan handled in mouseMove
      } else if (tool === "rectangle") {
        setCurrentShape({
          id: generateId(),
          type: "rectangle",
          x: point.x,
          y: point.y,
          width: 0,
          height: 0,
          rotation: 0,
          stroke: strokeColor,
          fill: fillColor,
          strokeWidth,
          opacity: 1,
          cornerRadius: 0,
        });
      } else if (tool === "ellipse") {
        setCurrentShape({
          id: generateId(),
          type: "ellipse",
          x: point.x,
          y: point.y,
          width: 0,
          height: 0,
          rotation: 0,
          stroke: strokeColor,
          fill: fillColor,
          strokeWidth,
          opacity: 1,
        });
      } else if (tool === "line") {
        setCurrentShape({
          id: generateId(),
          type: "line",
          x: 0,
          y: 0,
          points: [point, point],
          rotation: 0,
          stroke: strokeColor,
          fill: "transparent",
          strokeWidth,
          opacity: 1,
        });
      } else if (tool === "arrow") {
        setCurrentShape({
          id: generateId(),
          type: "arrow",
          x: 0,
          y: 0,
          points: [point, point],
          rotation: 0,
          stroke: strokeColor,
          fill: "transparent",
          strokeWidth,
          opacity: 1,
          startArrow: false,
          endArrow: true,
        });
      } else if (tool === "freehand") {
        setCurrentShape({
          id: generateId(),
          type: "freehand",
          x: 0,
          y: 0,
          points: [point],
          rotation: 0,
          stroke: strokeColor,
          fill: "transparent",
          strokeWidth,
          opacity: 1,
        });
      }
    },
    [getCanvasPoint, store]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing || !startPoint) return;

      const point = getCanvasPoint(e);
      const { tool } = store;

      if (tool === "pan") {
        const dx = e.movementX / store.camera.zoom;
        const dy = e.movementY / store.camera.zoom;
        store.pan({ x: dx * store.camera.zoom, y: dy * store.camera.zoom });
      } else if (tool === "select" && store.selectedIds.length > 0) {
        const dx = point.x - startPoint.x;
        const dy = point.y - startPoint.y;
        for (const id of store.selectedIds) {
          store.moveShape(id, dx, dy);
        }
        setStartPoint(point);
      } else if (currentShape) {
        if (currentShape.type === "rectangle" || currentShape.type === "ellipse") {
          const width = point.x - currentShape.x;
          const height = point.y - currentShape.y;
          setCurrentShape({
            ...currentShape,
            width: Math.abs(width),
            height: Math.abs(height),
            x: width < 0 ? point.x : currentShape.x,
            y: height < 0 ? point.y : currentShape.y,
          } as typeof currentShape);
        } else if (
          currentShape.type === "line" ||
          currentShape.type === "arrow"
        ) {
          setCurrentShape({
            ...currentShape,
            points: [currentShape.points[0], point],
          });
        } else if (currentShape.type === "freehand") {
          setCurrentShape({
            ...currentShape,
            points: [...currentShape.points, point],
          });
        }
      }
    },
    [isDrawing, startPoint, getCanvasPoint, currentShape, store]
  );

  const handleMouseUp = useCallback(() => {
    if (currentShape) {
      if (currentShape.type === "freehand") {
        const simplified = simplifyPath(currentShape.points);
        store.addShape({ ...currentShape, points: simplified });
      } else if (
        currentShape.type === "rectangle" ||
        currentShape.type === "ellipse"
      ) {
        if (currentShape.width > 5 && currentShape.height > 5) {
          store.addShape(currentShape);
        }
      } else if (
        currentShape.type === "line" ||
        currentShape.type === "arrow"
      ) {
        const [p1, p2] = currentShape.points;
        const dist = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
        if (dist > 5) {
          const startShape = findConnectableShapeNearPoint(p1, store.shapes);
          const endShape = findConnectableShapeNearPoint(p2, store.shapes);

          const shapeWithConnections: ArrowShape | LineShape = {
            ...currentShape,
            startConnection: startShape ? { shapeId: startShape.id } : undefined,
            endConnection: endShape ? { shapeId: endShape.id } : undefined,
          };
          store.addShape(shapeWithConnections);
        }
      } else {
        store.addShape(currentShape);
      }
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentShape(null);
  }, [currentShape, store]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const center = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      store.zoom(factor, center);
    },
    [store]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        store.deleteSelectedShapes();
      } else if (e.key === "Escape") {
        store.clearSelection();
        store.setTool("select");
      } else if (e.key === "v") {
        store.setTool("select");
      } else if (e.key === "h") {
        store.setTool("pan");
      } else if (e.key === "r") {
        store.setTool("rectangle");
      } else if (e.key === "e") {
        store.setTool("ellipse");
      } else if (e.key === "l") {
        store.setTool("line");
      } else if (e.key === "a") {
        store.setTool("arrow");
      } else if (e.key === "p") {
        store.setTool("freehand");
      } else if (e.key === "t") {
        store.setTool("text");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [store]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <Toolbar />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
    </div>
  );
}
