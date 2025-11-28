import type { Point, Shape, BoundingBox } from "./types";

export function generateId(): string {
  return crypto.randomUUID();
}

export function screenToCanvas(
  screenPoint: Point,
  camera: { x: number; y: number; zoom: number }
): Point {
  return {
    x: (screenPoint.x - camera.x) / camera.zoom,
    y: (screenPoint.y - camera.y) / camera.zoom,
  };
}

export function canvasToScreen(
  canvasPoint: Point,
  camera: { x: number; y: number; zoom: number }
): Point {
  return {
    x: canvasPoint.x * camera.zoom + camera.x,
    y: canvasPoint.y * camera.zoom + camera.y,
  };
}

export function getShapeBounds(shape: Shape): BoundingBox {
  switch (shape.type) {
    case "rectangle":
    case "ellipse":
    case "text":
      return {
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
      };
    case "line":
    case "arrow":
    case "freehand": {
      if (shape.points.length === 0) {
        return { x: shape.x, y: shape.y, width: 0, height: 0 };
      }
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      for (const p of shape.points) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }
      return {
        x: shape.x + minX,
        y: shape.y + minY,
        width: maxX - minX,
        height: maxY - minY,
      };
    }
  }
}

export function pointInBounds(point: Point, bounds: BoundingBox): boolean {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

export function pointInShape(point: Point, shape: Shape): boolean {
  const bounds = getShapeBounds(shape);
  const padding = shape.strokeWidth / 2 + 4;
  return (
    point.x >= bounds.x - padding &&
    point.x <= bounds.x + bounds.width + padding &&
    point.y >= bounds.y - padding &&
    point.y <= bounds.y + bounds.height + padding
  );
}

export function getShapeAtPoint(point: Point, shapes: Shape[]): Shape | null {
  for (let i = shapes.length - 1; i >= 0; i--) {
    if (pointInShape(point, shapes[i])) {
      return shapes[i];
    }
  }
  return null;
}

export function distance(p1: Point, p2: Point): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

export function simplifyPath(points: Point[], tolerance: number = 2): Point[] {
  if (points.length <= 2) return points;

  const result: Point[] = [points[0]];
  let lastPoint = points[0];

  for (let i = 1; i < points.length - 1; i++) {
    if (distance(lastPoint, points[i]) >= tolerance) {
      result.push(points[i]);
      lastPoint = points[i];
    }
  }

  result.push(points[points.length - 1]);
  return result;
}

const CONNECTION_THRESHOLD = 30;

export function distanceToShapeBorder(point: Point, shape: Shape): number {
  if (shape.type === "line" || shape.type === "arrow" || shape.type === "freehand") {
    return Infinity;
  }

  const bounds = getShapeBounds(shape);
  const left = bounds.x;
  const right = bounds.x + bounds.width;
  const top = bounds.y;
  const bottom = bounds.y + bounds.height;

  if (point.x >= left && point.x <= right && point.y >= top && point.y <= bottom) {
    return 0;
  }

  const dx = Math.max(left - point.x, 0, point.x - right);
  const dy = Math.max(top - point.y, 0, point.y - bottom);
  return Math.sqrt(dx * dx + dy * dy);
}

export function findConnectableShapeNearPoint(
  point: Point,
  shapes: Shape[],
  excludeId?: string
): Shape | null {
  let closest: Shape | null = null;
  let minDist = CONNECTION_THRESHOLD;

  for (const shape of shapes) {
    if (shape.id === excludeId) continue;
    if (shape.type === "line" || shape.type === "arrow" || shape.type === "freehand") continue;

    const dist = distanceToShapeBorder(point, shape);
    if (dist < minDist) {
      minDist = dist;
      closest = shape;
    }
  }

  return closest;
}
