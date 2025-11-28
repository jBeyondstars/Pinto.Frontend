import type { Shape, Point, CanvasState } from "./types";
import { getShapeBounds } from "./utils";

export function renderCanvas(
  ctx: CanvasRenderingContext2D,
  state: CanvasState,
  width: number,
  height: number
): void {
  const { shapes, selectedIds, camera } = state;

  // White background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.save();

  // Apply camera transform
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);

  // Draw shapes
  for (const shape of shapes) {
    drawShape(ctx, shape);
  }

  // Draw selection
  for (const id of selectedIds) {
    const shape = shapes.find((s) => s.id === id);
    if (shape) {
      drawSelectionBox(ctx, shape);
    }
  }

  ctx.restore();
}

function drawShape(ctx: CanvasRenderingContext2D, shape: Shape): void {
  ctx.save();
  ctx.translate(shape.x, shape.y);
  ctx.rotate(shape.rotation);
  ctx.globalAlpha = shape.opacity;
  ctx.strokeStyle = shape.stroke;
  ctx.fillStyle = shape.fill;
  ctx.lineWidth = shape.strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  switch (shape.type) {
    case "rectangle":
      drawRectangle(ctx, shape.width, shape.height, shape.cornerRadius);
      break;
    case "ellipse":
      drawEllipse(ctx, shape.width, shape.height);
      break;
    case "line":
      drawLine(ctx, shape.points);
      break;
    case "arrow":
      drawArrow(ctx, shape.points, shape.startArrow, shape.endArrow);
      break;
    case "freehand":
      drawFreehand(ctx, shape.points);
      break;
    case "text":
      drawText(ctx, shape.text, shape.fontSize, shape.fontFamily, shape.width);
      break;
  }

  ctx.restore();
}

function drawRectangle(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cornerRadius: number
): void {
  ctx.beginPath();
  if (cornerRadius > 0) {
    ctx.roundRect(0, 0, width, height, cornerRadius);
  } else {
    ctx.rect(0, 0, width, height);
  }
  if (ctx.fillStyle !== "transparent") ctx.fill();
  ctx.stroke();
}

function drawEllipse(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  ctx.beginPath();
  ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
  if (ctx.fillStyle !== "transparent") ctx.fill();
  ctx.stroke();
}

function drawLine(ctx: CanvasRenderingContext2D, points: Point[]): void {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  startArrow: boolean,
  endArrow: boolean
): void {
  if (points.length < 2) return;

  drawLine(ctx, points);

  const arrowSize = 10;

  if (endArrow && points.length >= 2) {
    const end = points[points.length - 1];
    const prev = points[points.length - 2];
    const angle = Math.atan2(end.y - prev.y, end.x - prev.x);
    drawArrowHead(ctx, end, angle, arrowSize);
  }

  if (startArrow && points.length >= 2) {
    const start = points[0];
    const next = points[1];
    const angle = Math.atan2(start.y - next.y, start.x - next.x);
    drawArrowHead(ctx, start, angle, arrowSize);
  }
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  point: Point,
  angle: number,
  size: number
): void {
  ctx.beginPath();
  ctx.moveTo(point.x, point.y);
  ctx.lineTo(
    point.x - size * Math.cos(angle - Math.PI / 6),
    point.y - size * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(point.x, point.y);
  ctx.lineTo(
    point.x - size * Math.cos(angle + Math.PI / 6),
    point.y - size * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
}

function drawFreehand(ctx: CanvasRenderingContext2D, points: Point[]): void {
  if (points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y);
  } else {
    for (let i = 1; i < points.length - 1; i++) {
      const midX = (points[i].x + points[i + 1].x) / 2;
      const midY = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
  }

  ctx.stroke();
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
  fontFamily: string,
  maxWidth: number
): void {
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textBaseline = "top";

  const lines = text.split("\n");
  let y = 0;

  for (const line of lines) {
    ctx.fillText(line, 0, y, maxWidth);
    y += fontSize * 1.2;
  }
}

function drawSelectionBox(ctx: CanvasRenderingContext2D, shape: Shape): void {
  const bounds = getShapeBounds(shape);
  const padding = 4;

  ctx.strokeStyle = "#0066ff";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(
    bounds.x - padding,
    bounds.y - padding,
    bounds.width + padding * 2,
    bounds.height + padding * 2
  );
  ctx.setLineDash([]);

  // Draw resize handles
  const handleSize = 8;
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#0066ff";

  const handles = [
    { x: bounds.x - padding, y: bounds.y - padding },
    { x: bounds.x + bounds.width / 2, y: bounds.y - padding },
    { x: bounds.x + bounds.width + padding, y: bounds.y - padding },
    { x: bounds.x + bounds.width + padding, y: bounds.y + bounds.height / 2 },
    { x: bounds.x + bounds.width + padding, y: bounds.y + bounds.height + padding },
    { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height + padding },
    { x: bounds.x - padding, y: bounds.y + bounds.height + padding },
    { x: bounds.x - padding, y: bounds.y + bounds.height / 2 },
  ];

  for (const handle of handles) {
    ctx.fillRect(
      handle.x - handleSize / 2,
      handle.y - handleSize / 2,
      handleSize,
      handleSize
    );
    ctx.strokeRect(
      handle.x - handleSize / 2,
      handle.y - handleSize / 2,
      handleSize,
      handleSize
    );
  }
}
