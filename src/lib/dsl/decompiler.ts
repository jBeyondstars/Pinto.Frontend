import type { Shape, ArrowShape, LineShape } from "../canvas/types";
import type { ArrowTypeAST, ShapeTypeAST } from "./ast";

interface DecompiledNode {
  id: string;
  shape: ShapeTypeAST;
  label?: string;
  fill?: string;
  stroke?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DecompiledEdge {
  from: string;
  to: string;
  arrowType: ArrowTypeAST;
  label?: string;
}

function generateNodeId(index: number): string {
  if (index < 26) {
    return String.fromCharCode(97 + index);
  }
  return `node${index + 1}`;
}

function shapeToNodeType(shape: Shape): ShapeTypeAST | null {
  switch (shape.type) {
    case "rectangle":
      return "rect";
    case "ellipse":
      return "circle";
    default:
      return null;
  }
}

function arrowTypeToAST(shape: ArrowShape | LineShape): ArrowTypeAST {
  if (shape.type === "line") {
    return "line";
  }
  if (shape.startArrow && shape.endArrow) {
    return "both";
  }
  if (shape.startArrow) {
    return "left";
  }
  return "right";
}

function distanceToShapeBorder(
  point: { x: number; y: number },
  node: DecompiledNode
): number {
  // Calculate distance to the nearest edge of the bounding box
  const left = node.x;
  const right = node.x + node.width;
  const top = node.y;
  const bottom = node.y + node.height;

  // If point is inside the shape, distance is 0
  if (point.x >= left && point.x <= right && point.y >= top && point.y <= bottom) {
    return 0;
  }

  // Calculate distance to nearest edge
  const dx = Math.max(left - point.x, 0, point.x - right);
  const dy = Math.max(top - point.y, 0, point.y - bottom);
  return Math.sqrt(dx * dx + dy * dy);
}

function findClosestNodes(
  point: { x: number; y: number },
  nodes: Map<string, DecompiledNode>
): Array<{ id: string; dist: number }> {
  const results: Array<{ id: string; dist: number }> = [];

  for (const [id, node] of nodes) {
    const dist = distanceToShapeBorder(point, node);
    results.push({ id, dist });
  }

  return results.sort((a, b) => a.dist - b.dist);
}

const CONNECTION_THRESHOLD = 50; // Max distance to consider arrow connected to a shape

function findEdgeNodes(
  startPoint: { x: number; y: number },
  endPoint: { x: number; y: number },
  nodes: Map<string, DecompiledNode>
): { from: string; to: string } | null {
  if (nodes.size === 0) return null;

  const startClosest = findClosestNodes(startPoint, nodes);
  const endClosest = findClosestNodes(endPoint, nodes);

  if (startClosest.length === 0 || endClosest.length === 0) return null;

  // Check if endpoints are actually close enough to shapes
  const startNearShape = startClosest[0].dist <= CONNECTION_THRESHOLD;
  const endNearShape = endClosest[0].dist <= CONNECTION_THRESHOLD;

  // If neither endpoint is near a shape, this arrow is not connected
  if (!startNearShape && !endNearShape) return null;

  // Get the closest nodes within threshold
  const from = startNearShape ? startClosest[0].id : null;
  let to = endNearShape ? endClosest[0].id : null;

  // Need both endpoints connected
  if (!from || !to) return null;

  // If both ends point to the same node, try to find alternatives
  if (from === to) {
    // Try alternative for end point
    if (endClosest.length > 1 && endClosest[1].dist <= CONNECTION_THRESHOLD) {
      to = endClosest[1].id;
    }
    // Still same? Try alternative for start point
    if (from === to && startClosest.length > 1 && startClosest[1].dist <= CONNECTION_THRESHOLD) {
      const altFrom = startClosest[1].id;
      if (altFrom !== to) {
        return { from: altFrom, to };
      }
    }
  }

  return { from, to };
}

function arrowTypeToSymbol(arrowType: ArrowTypeAST): string {
  switch (arrowType) {
    case "left": return "<-";
    case "both": return "<->";
    case "dotted": return "-->";
    case "thick": return "==>";
    case "line": return "--";
    case "right":
    default: return "->";
  }
}

function getAbsolutePoint(
  shape: Shape,
  point: { x: number; y: number }
): { x: number; y: number } {
  return {
    x: shape.x + point.x,
    y: shape.y + point.y,
  };
}

export function decompile(shapes: Shape[]): string {
  const nodes = new Map<string, DecompiledNode>();
  const edges: DecompiledEdge[] = [];
  const shapeToNodeId = new Map<string, string>();

  // First pass: identify nodes (rectangles, ellipses)
  let nodeIndex = 0;
  for (const shape of shapes) {
    const nodeType = shapeToNodeType(shape);
    if (nodeType && (shape.type === "rectangle" || shape.type === "ellipse")) {
      const nodeId = generateNodeId(nodeIndex++);

      const node: DecompiledNode = {
        id: nodeId,
        shape: nodeType,
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
      };

      if (shape.fill !== "#ffffff" && shape.fill !== "transparent") {
        node.fill = shape.fill;
      }
      if (shape.stroke !== "#000000") {
        node.stroke = shape.stroke;
      }

      nodes.set(nodeId, node);
      shapeToNodeId.set(shape.id, nodeId);
    }
  }

  // Second pass: identify edges (arrows, lines)
  for (const shape of shapes) {
    if (shape.type === "arrow" || shape.type === "line") {
      const points = shape.points;
      if (points.length < 2) continue;

      const startPoint = getAbsolutePoint(shape, points[0]);
      const endPoint = getAbsolutePoint(shape, points[points.length - 1]);

      const edgeNodes = findEdgeNodes(startPoint, endPoint, nodes);

      if (edgeNodes) {
        edges.push({
          from: edgeNodes.from,
          to: edgeNodes.to,
          arrowType: arrowTypeToAST(shape),
        });
      }
    }
  }

  // Generate DSL code
  const lines: string[] = [];

  for (const [id, node] of nodes) {
    let line = id;

    // Build props: shape type, position, dimensions, and style
    const props: string[] = [];
    props.push(`x: ${Math.round(node.x)}`);
    props.push(`y: ${Math.round(node.y)}`);
    props.push(`width: ${Math.round(node.width)}`);
    props.push(`height: ${Math.round(node.height)}`);

    if (node.fill) {
      props.push(`fill: ${node.fill}`);
    }
    if (node.stroke) {
      props.push(`stroke: ${node.stroke}`);
    }

    line += `(${node.shape}, ${props.join(", ")})`;

    if (node.label) {
      line += `: "${node.label}"`;
    }

    lines.push(line);
  }

  if (nodes.size > 0 && edges.length > 0) {
    lines.push("");
  }

  for (const edge of edges) {
    const arrow = arrowTypeToSymbol(edge.arrowType);
    let line = `${edge.from} ${arrow} ${edge.to}`;
    if (edge.label) {
      line += `: "${edge.label}"`;
    }
    lines.push(line);
  }

  return lines.join("\n");
}
