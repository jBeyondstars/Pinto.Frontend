import type { ElkNode, ElkExtendedEdge } from "elkjs";
import type { DocumentAST, NodeAST, EdgeAST, GroupAST, ShapeTypeAST } from "./ast";
import type { Shape, RectangleShape, EllipseShape, LineShape, ArrowShape } from "../canvas/types";
import { generateId } from "../canvas/utils";

// Lazy load ELK for code splitting
let elkInstance: any = null;
async function getELK() {
  if (!elkInstance) {
    const ELK = (await import("elkjs/lib/elk.bundled.js")).default;
    elkInstance = new ELK();
  }
  return elkInstance;
}

// Default dimensions for shapes
const SHAPE_DIMENSIONS: Record<ShapeTypeAST, { width: number; height: number }> = {
  rect: { width: 120, height: 60 },
  circle: { width: 80, height: 80 },
  diamond: { width: 100, height: 100 },
  cylinder: { width: 80, height: 100 },
};

const DEFAULT_SHAPE: ShapeTypeAST = "rect";

interface CompileOptions {
  algorithm?: "layered" | "force" | "stress" | "radial" | "box";
  direction?: "DOWN" | "RIGHT" | "UP" | "LEFT";
  nodeSpacing?: number;
  edgeSpacing?: number;
}


export async function compile(
  ast: DocumentAST,
  options: CompileOptions = {}
): Promise<Shape[]> {
  const {
    algorithm = "layered",
    direction = "DOWN",
    nodeSpacing = 50,
    edgeSpacing = 20,
  } = options;

  // Extract nodes and edges from AST
  const nodesMap = new Map<string, NodeAST>();
  const edges: EdgeAST[] = [];
  const groups: GroupAST[] = [];

  for (const stmt of ast.statements) {
    if (stmt.type === "node") {
      nodesMap.set(stmt.id, stmt);
    } else if (stmt.type === "edge") {
      edges.push(stmt);
      if (!nodesMap.has(stmt.from)) {
        nodesMap.set(stmt.from, { type: "node", id: stmt.from });
      }
      if (!nodesMap.has(stmt.to)) {
        nodesMap.set(stmt.to, { type: "node", id: stmt.to });
      }
    } else if (stmt.type === "group") {
      groups.push(stmt);
    }
  }

  // Check if all nodes have explicit positions
  const allHavePositions = Array.from(nodesMap.values()).every(
    (node) => node.style?.x !== undefined && node.style?.y !== undefined
  );

  const shapes: Shape[] = [];

  if (allHavePositions) {
    // Use explicit positions - no ELK layout needed
    for (const [id, node] of nodesMap) {
      const shapeType = node.shape || DEFAULT_SHAPE;
      const dims = SHAPE_DIMENSIONS[shapeType];
      const shape = createNodeShape(
        id,
        node.style!.x!,
        node.style!.y!,
        node.style?.width || dims.width,
        node.style?.height || dims.height,
        node
      );
      shapes.push(shape);
    }

    // Create edges as direct lines between node centers
    for (const edge of edges) {
      const fromNode = nodesMap.get(edge.from);
      const toNode = nodesMap.get(edge.to);
      if (!fromNode || !toNode) continue;

      const fromDims = SHAPE_DIMENSIONS[fromNode.shape || DEFAULT_SHAPE];
      const toDims = SHAPE_DIMENSIONS[toNode.shape || DEFAULT_SHAPE];

      const fromX = fromNode.style!.x! + (fromNode.style?.width || fromDims.width) / 2;
      const fromY = fromNode.style!.y! + (fromNode.style?.height || fromDims.height) / 2;
      const toX = toNode.style!.x! + (toNode.style?.width || toDims.width) / 2;
      const toY = toNode.style!.y! + (toNode.style?.height || toDims.height) / 2;

      const edgeShape = createArrowFromPoints(
        [{ x: fromX, y: fromY }, { x: toX, y: toY }],
        edge
      );
      shapes.push(edgeShape);
    }
  } else {
    // Use ELK for automatic layout
    const elkGraph: ElkNode = {
      id: "root",
      layoutOptions: {
        "elk.algorithm": algorithm,
        "elk.direction": direction,
        "elk.spacing.nodeNode": String(nodeSpacing),
        "elk.spacing.edgeEdge": String(edgeSpacing),
        "elk.layered.spacing.nodeNodeBetweenLayers": String(nodeSpacing),
      },
      children: [],
      edges: [],
    };

    for (const [id, node] of nodesMap) {
      const shape = node.shape || DEFAULT_SHAPE;
      const dims = SHAPE_DIMENSIONS[shape];
      elkGraph.children!.push({
        id,
        width: dims.width,
        height: dims.height,
        labels: node.label ? [{ text: node.label }] : [],
      });
    }

    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      elkGraph.edges!.push({
        id: `e${i}`,
        sources: [edge.from],
        targets: [edge.to],
        labels: edge.label ? [{ text: edge.label }] : [],
      });
    }

    const elk = await getELK();
    const layoutedGraph = await elk.layout(elkGraph);

    if (layoutedGraph.children) {
      for (const elkNode of layoutedGraph.children) {
        const astNode = nodesMap.get(elkNode.id);
        if (!astNode) continue;

        const shape = createNodeShape(
          elkNode.id,
          elkNode.x || 0,
          elkNode.y || 0,
          elkNode.width || 120,
          elkNode.height || 60,
          astNode
        );
        shapes.push(shape);
      }
    }

    if (layoutedGraph.edges) {
      for (let i = 0; i < layoutedGraph.edges.length; i++) {
        const elkEdge = layoutedGraph.edges[i] as ElkExtendedEdge;
        const astEdge = edges[i];

        const edgeShape = createEdgeShape(elkEdge, astEdge, layoutedGraph);
        if (edgeShape) {
          shapes.push(edgeShape);
        }
      }
    }
  }

  return shapes;
}

function createNodeShape(
  _id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  astNode: NodeAST
): Shape {
  const shapeType = astNode.shape || DEFAULT_SHAPE;
  const baseProps = {
    id: generateId(),
    x,
    y,
    rotation: 0,
    stroke: astNode.style?.stroke || "#000000",
    strokeWidth: astNode.style?.strokeWidth || 2,
    fill: astNode.style?.fill || "#ffffff",
    opacity: 1,
  };

  switch (shapeType) {
    case "circle":
      return {
        ...baseProps,
        type: "ellipse",
        width,
        height,
      } as EllipseShape;

    case "diamond":
      // For now, represent as rectangle (TODO: add diamond shape)
      return {
        ...baseProps,
        type: "rectangle",
        width,
        height,
        cornerRadius: 0,
      } as RectangleShape;

    case "cylinder":
      // For now, represent as rectangle (TODO: add cylinder shape)
      return {
        ...baseProps,
        type: "rectangle",
        width,
        height,
        cornerRadius: 8,
      } as RectangleShape;

    case "rect":
    default:
      return {
        ...baseProps,
        type: "rectangle",
        width,
        height,
        cornerRadius: 4,
      } as RectangleShape;
  }
}

function createEdgeShape(
  elkEdge: ElkExtendedEdge,
  astEdge: EdgeAST,
  graph: ElkNode
): ArrowShape | LineShape | null {
  // Get edge sections (routing points)
  const sections = elkEdge.sections;
  if (!sections || sections.length === 0) {
    // Fallback: direct line between nodes
    const sourceNode = graph.children?.find((n) => n.id === astEdge.from);
    const targetNode = graph.children?.find((n) => n.id === astEdge.to);

    if (!sourceNode || !targetNode) return null;

    const startX = (sourceNode.x || 0) + (sourceNode.width || 0) / 2;
    const startY = (sourceNode.y || 0) + (sourceNode.height || 0) / 2;
    const endX = (targetNode.x || 0) + (targetNode.width || 0) / 2;
    const endY = (targetNode.y || 0) + (targetNode.height || 0) / 2;

    return createArrowFromPoints(
      [{ x: startX, y: startY }, { x: endX, y: endY }],
      astEdge
    );
  }

  // Build points from sections
  const points: Array<{ x: number; y: number }> = [];

  for (const section of sections) {
    points.push({ x: section.startPoint.x, y: section.startPoint.y });

    if (section.bendPoints) {
      for (const bend of section.bendPoints) {
        points.push({ x: bend.x, y: bend.y });
      }
    }

    points.push({ x: section.endPoint.x, y: section.endPoint.y });
  }

  return createArrowFromPoints(points, astEdge);
}

function createArrowFromPoints(
  points: Array<{ x: number; y: number }>,
  astEdge: EdgeAST
): ArrowShape | LineShape {
  const baseProps = {
    id: generateId(),
    x: 0,
    y: 0,
    rotation: 0,
    stroke: "#000000",
    strokeWidth: 2,
    fill: "transparent",
    opacity: 1,
    points,
  };

  const arrowType = astEdge.arrowType;

  if (arrowType === "line") {
    return {
      ...baseProps,
      type: "line",
    } as LineShape;
  }

  return {
    ...baseProps,
    type: "arrow",
    startArrow: arrowType === "left" || arrowType === "both",
    endArrow: arrowType !== "left",
  } as ArrowShape;
}

// Convenience function to parse and compile in one step
export async function parseAndCompile(
  code: string,
  options?: CompileOptions
): Promise<{ shapes: Shape[]; errors: Array<{ message: string }> }> {
  const { parse } = await import("./parser");
  const ast = parse(code);

  if (ast.errors.length > 0) {
    return { shapes: [], errors: ast.errors };
  }

  const shapes = await compile(ast, options);
  return { shapes, errors: [] };
}
