import type { Shape, ArrowShape, LineShape } from "../canvas/types";
import type { ArrowTypeAST, ShapeTypeAST } from "./ast";

interface DecompiledNode {
  id: string;
  shape: ShapeTypeAST;
  label?: string;
  style?: { fill?: string; stroke?: string };
  centerX: number;
  centerY: number;
}

interface DecompiledEdge {
  from: string;
  to: string;
  arrowType: ArrowTypeAST;
  label?: string;
}

function generateNodeId(index: number): string {
  if (index < 26) {
    return String.fromCharCode(97 + index); // a-z
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

function getShapeCenter(shape: Shape): { x: number; y: number } {
  if (shape.type === "rectangle" || shape.type === "ellipse") {
    return {
      x: shape.x + shape.width / 2,
      y: shape.y + shape.height / 2,
    };
  }
  return { x: shape.x, y: shape.y };
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

function findConnectedNode(
  point: { x: number; y: number },
  nodes: Map<string, DecompiledNode>,
  threshold: number = 50
): string | null {
  let closest: string | null = null;
  let minDist = threshold;

  for (const [id, node] of nodes) {
    const dx = point.x - node.centerX;
    const dy = point.y - node.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) {
      minDist = dist;
      closest = id;
    }
  }

  return closest;
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

export function decompile(shapes: Shape[]): string {
  const nodes = new Map<string, DecompiledNode>();
  const edges: DecompiledEdge[] = [];
  const shapeToNodeId = new Map<string, string>();

  // First pass: identify nodes (rectangles, ellipses)
  let nodeIndex = 0;
  for (const shape of shapes) {
    const nodeType = shapeToNodeType(shape);
    if (nodeType) {
      const nodeId = generateNodeId(nodeIndex++);
      const center = getShapeCenter(shape);

      const node: DecompiledNode = {
        id: nodeId,
        shape: nodeType,
        centerX: center.x,
        centerY: center.y,
      };

      // Extract style if non-default
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

      const startPoint = points[0];
      const endPoint = points[points.length - 1];

      const fromNode = findConnectedNode(startPoint, nodes);
      const toNode = findConnectedNode(endPoint, nodes);

      if (fromNode && toNode && fromNode !== toNode) {
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

  // Output node definitions
  for (const [id, node] of nodes) {
    let line = id;

    // Add shape spec
    const styleStr = node.style ? formatStyleProps(node.style) : "";
    if (styleStr) {
      line += `(${node.shape}, ${styleStr})`;
    } else {
      line += `(${node.shape})`;
    }

    // Add label if present
    if (node.label) {
      line += `: "${node.label}"`;
    }

    lines.push(line);
  }

  // Add blank line between nodes and edges
  if (nodes.size > 0 && edges.length > 0) {
    lines.push("");
  }

  // Output edges
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
