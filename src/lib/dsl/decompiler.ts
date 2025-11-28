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

function distanceToShape(
  point: { x: number; y: number },
  node: DecompiledNode
): number {
  const centerX = node.x + node.width / 2;
  const centerY = node.y + node.height / 2;
  const dx = point.x - centerX;
  const dy = point.y - centerY;
  return Math.sqrt(dx * dx + dy * dy);
}

function findConnectedNode(
  point: { x: number; y: number },
  nodes: Map<string, DecompiledNode>,
  maxDistance: number = Infinity
): string | null {
  let closest: string | null = null;
  let minDist = maxDistance;

  for (const [id, node] of nodes) {
    const dist = distanceToShape(point, node);
    if (dist < minDist) {
      minDist = dist;
      closest = id;
    }
  }

  return closest;
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

      const fromNode = findConnectedNode(startPoint, nodes);
      const toNode = findConnectedNode(endPoint, nodes);

      if (fromNode && toNode) {
        edges.push({
          from: fromNode,
          to: toNode,
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
