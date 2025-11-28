export type ShapeTypeAST = "rect" | "circle" | "diamond" | "cylinder";

export type ArrowTypeAST =
  | "right"      // ->
  | "left"       // <-
  | "both"       // <->
  | "dotted"     // -->
  | "thick"      // ==>
  | "line";      // --

export interface Location {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface BaseAST {
  location?: Location;
}

export interface StyleProps {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}

export interface NodeAST extends BaseAST {
  type: "node";
  id: string;
  label?: string;
  shape?: ShapeTypeAST;
  style?: StyleProps;
}

export interface EdgeAST extends BaseAST {
  type: "edge";
  from: string;
  to: string;
  label?: string;
  arrowType: ArrowTypeAST;
}

export interface GroupAST extends BaseAST {
  type: "group";
  id: string;
  label?: string;
  style?: StyleProps;
  children: StatementAST[];
}

export interface LayoutAST extends BaseAST {
  type: "layout";
  algorithm: string;
  options?: Record<string, string | number>;
}

export interface FreeArrowAST extends BaseAST {
  type: "freeArrow";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  arrowType: ArrowTypeAST;
}

export type StatementAST = NodeAST | EdgeAST | GroupAST | LayoutAST | FreeArrowAST;

export interface DocumentAST {
  statements: StatementAST[];
  errors: ParseError[];
}

export interface ParseError {
  message: string;
  location?: Location;
}
