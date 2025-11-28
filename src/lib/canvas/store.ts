import { create } from "zustand";
import type { Shape, Tool, CanvasState, Point, ArrowShape, LineShape } from "./types";

interface CanvasStore extends CanvasState {
  tool: Tool;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;

  // Actions
  setTool: (tool: Tool) => void;
  setStrokeColor: (color: string) => void;
  setFillColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;

  addShape: (shape: Shape) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  moveShape: (id: string, dx: number, dy: number) => void;
  deleteShape: (id: string) => void;
  deleteSelectedShapes: () => void;

  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;

  setCamera: (camera: Partial<CanvasState["camera"]>) => void;
  pan: (delta: Point) => void;
  zoom: (factor: number, center: Point) => void;

  loadState: (state: CanvasState) => void;
  getSnapshot: () => CanvasState;
  clear: () => void;
}

const initialState: CanvasState = {
  shapes: [],
  selectedIds: [],
  camera: { x: 0, y: 0, zoom: 1 },
};

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  ...initialState,
  tool: "select",
  strokeColor: "#000000",
  fillColor: "transparent",
  strokeWidth: 2,

  setTool: (tool) => set({ tool }),
  setStrokeColor: (color) => set({ strokeColor: color }),
  setFillColor: (color) => set({ fillColor: color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),

  addShape: (shape) =>
    set((state) => ({ shapes: [...state.shapes, shape] })),

  updateShape: (id, updates) =>
    set((state) => ({
      shapes: state.shapes.map((s) =>
        s.id === id ? ({ ...s, ...updates } as Shape) : s
      ),
    })),

  moveShape: (id, dx, dy) =>
    set((state) => ({
      shapes: state.shapes.map((s) => {
        // Move the shape itself
        if (s.id === id) {
          return { ...s, x: s.x + dx, y: s.y + dy } as Shape;
        }
        // Update connected arrows/lines
        if (s.type === "arrow" || s.type === "line") {
          const connectable = s as ArrowShape | LineShape;
          const startConnected = connectable.startConnection?.shapeId === id;
          const endConnected = connectable.endConnection?.shapeId === id;

          if (startConnected || endConnected) {
            const newPoints = connectable.points.map((p, i) => {
              if (i === 0 && startConnected) {
                return { x: p.x + dx, y: p.y + dy };
              }
              if (i === connectable.points.length - 1 && endConnected) {
                return { x: p.x + dx, y: p.y + dy };
              }
              return p;
            });
            return { ...s, points: newPoints } as Shape;
          }
        }
        return s;
      }),
    })),

  deleteShape: (id) =>
    set((state) => ({
      shapes: state.shapes.filter((s) => s.id !== id),
      selectedIds: state.selectedIds.filter((sid) => sid !== id),
    })),

  deleteSelectedShapes: () =>
    set((state) => ({
      shapes: state.shapes.filter((s) => !state.selectedIds.includes(s.id)),
      selectedIds: [],
    })),

  setSelectedIds: (ids) => set({ selectedIds: ids }),
  clearSelection: () => set({ selectedIds: [] }),

  setCamera: (camera) =>
    set((state) => ({ camera: { ...state.camera, ...camera } })),

  pan: (delta) =>
    set((state) => ({
      camera: {
        ...state.camera,
        x: state.camera.x + delta.x,
        y: state.camera.y + delta.y,
      },
    })),

  zoom: (factor, center) =>
    set((state) => {
      const newZoom = Math.min(Math.max(state.camera.zoom * factor, 0.1), 5);
      const zoomRatio = newZoom / state.camera.zoom;
      return {
        camera: {
          zoom: newZoom,
          x: center.x - (center.x - state.camera.x) * zoomRatio,
          y: center.y - (center.y - state.camera.y) * zoomRatio,
        },
      };
    }),

  loadState: (state) =>
    set({
      shapes: state.shapes,
      selectedIds: state.selectedIds,
      camera: state.camera,
    }),

  getSnapshot: () => {
    const { shapes, selectedIds, camera } = get();
    return { shapes, selectedIds, camera };
  },

  clear: () => set(initialState),
}));
