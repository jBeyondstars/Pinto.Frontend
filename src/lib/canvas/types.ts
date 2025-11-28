export type Tool = "select" | "pan" | "rectangle" | "ellipse" | "line" | "arrow" | "freehand" | "text";

export type ShapeType = "rectangle" | "ellipse" | "line" | "arrow" | "freehand" | "text";

export interface Point {
  x: number;
  y: number;
}

export interface Connection {
  shapeId: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BaseShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  rotation: number;
  stroke: string;
  strokeWidth: number;
  fill: string;
  opacity: number;
}

export interface RectangleShape extends BaseShape {
  type: "rectangle";
  width: number;
  height: number;
  cornerRadius: number;
}

export interface EllipseShape extends BaseShape {
  type: "ellipse";
  width: number;
  height: number;
}

export interface LineShape extends BaseShape {
  type: "line";
  points: Point[];
  startConnection?: Connection;
  endConnection?: Connection;
}

export interface ArrowShape extends BaseShape {
  type: "arrow";
  points: Point[];
  startArrow: boolean;
  endArrow: boolean;
  startConnection?: Connection;
  endConnection?: Connection;
}

export interface FreehandShape extends BaseShape {
  type: "freehand";
  points: Point[];
}

export interface TextShape extends BaseShape {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  width: number;
  height: number;
}

export type Shape = RectangleShape | EllipseShape | LineShape | ArrowShape | FreehandShape | TextShape;

export interface CanvasState {
  shapes: Shape[];
  selectedIds: string[];
  camera: {
    x: number;
    y: number;
    zoom: number;
  };
}

export interface CanvasSnapshot {
  version: number;
  state: CanvasState;
}
