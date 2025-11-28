import type { Shape, ArrowShape, LineShape } from "../canvas/types";
import type { ArrowTypeAST, ShapeTypeAST } from "./ast";

interface DecompiledNode {
  id: string;
  shape: ShapeTypeAST;
  label?: string;
  style?: { fill?: string; stroke?: string };
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

function isPointInOrNearShape(
  point: { x: number; y: number },
  node: DecompiledNode,
  margin: number = 30
): boolean {
  const left = node.x - margin;
  const right = node.x + node.width + margin;
  const top = node.y - margin;
  const bottom = node.y + node.height + margin;

  return point.x >= left && point.x <= right && point.y >= top && point.y <= bottom;
}

function findConnectedNode(
  point: { x: number; y: number },
  nodes: Map<string, DecompiledNode>
): string | null {
  for (const [id, node] of nodes) {
    if (isPointInOrNearShape(point, node)) {
      return id;
    }
  }
  return null;
}

function formatStyleProps(style: { fill?: string; stroke?: string }): string {
  const props: string[] = [];
  if (style.fill && style.fill !== "#ffffff" && style.fill !== "transparent") {
    props.push(`fill: ${style.fill}`);
  }
  if (style.stroke && style.stroke !== "#000000") {
    props.push(`stroke: ${style.stroke}`);
  }
  return props.join(", ");
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
        node.style = { ...node.style, fill: shape.fill };
      }
      if (shape.stroke !== "#000000") {
        node.style = { ...node.style, stroke: shape.stroke };
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

    const styleStr = node.style ? formatStyleProps(node.style) : "";
    if (styleStr) {
      line += `(${node.shape}, ${styleStr})`;
    } else {
      line += `(${node.shape})`;
    }

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
