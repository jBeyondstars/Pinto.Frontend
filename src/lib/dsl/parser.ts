import { CstParser } from "chevrotain";
import {
  allTokens,
  Identifier,
  StringLiteral,
  Colon,
  ArrowRight,
  ArrowLeft,
  ArrowBiDirectional,
  ArrowDottedRight,
  ArrowThickRight,
  Line,
  LParen,
  RParen,
  LCurly,
  RCurly,
  Group,
  Arrow,
  ShapeRect,
  ShapeBox,
  ShapeRectangle,
  ShapeCircle,
  ShapeOval,
  ShapeEllipse,
  ShapeDiamond,
  ShapeCylinder,
  ShapeDatabase,
  ShapeDb,
  Comma,
  ColorLiteral,
  NumberLiteral,
  Dot,
  Layout,
} from "./lexer";
import type {
  DocumentAST,
  StatementAST,
  NodeAST,
  EdgeAST,
  GroupAST,
  LayoutAST,
  FreeArrowAST,
  ArrowTypeAST,
  ShapeTypeAST,
  StyleProps,
} from "./ast";
import { PintoLexer } from "./lexer";

class PintoParser extends CstParser {
  constructor() {
    super(allTokens, {
      recoveryEnabled: true,
    });
    this.performSelfAnalysis();
  }

  // Document := Statement*
  public document = this.RULE("document", () => {
    this.MANY(() => {
      this.SUBRULE(this.statement);
    });
  });

  // Statement := GroupDef | LayoutDef | FreeArrowDef | EdgeOrNode
  private statement = this.RULE("statement", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.groupDef) },
      { ALT: () => this.SUBRULE(this.layoutDef) },
      { ALT: () => this.SUBRULE(this.freeArrowDef) },
      { ALT: () => this.SUBRULE(this.edgeOrNode) },
    ]);
  });

  // GroupDef := 'group' Identifier StyleSpec? '{' Statement* '}'
  private groupDef = this.RULE("groupDef", () => {
    this.CONSUME(Group);
    this.CONSUME(Identifier);
    this.OPTION(() => {
      this.SUBRULE(this.styleSpec);
    });
    this.CONSUME(LCurly);
    this.MANY(() => {
      this.SUBRULE(this.statement);
    });
    this.CONSUME(RCurly);
  });

  // LayoutDef := '@layout' ':' Identifier
  private layoutDef = this.RULE("layoutDef", () => {
    this.CONSUME(Layout);
    this.CONSUME(Colon);
    this.CONSUME(Identifier);
  });

  // FreeArrowDef := 'arrow' '(' StyleProps ')'
  private freeArrowDef = this.RULE("freeArrowDef", () => {
    this.CONSUME(Arrow);
    this.CONSUME(LParen);
    this.SUBRULE(this.styleProps);
    this.CONSUME(RParen);
  });

  // EdgeOrNode := NodeRef (Arrow NodeRef AnchorSpec? Label?)*
  private edgeOrNode = this.RULE("edgeOrNode", () => {
    this.SUBRULE(this.nodeRef, { LABEL: "left" });
    this.MANY(() => {
      this.SUBRULE(this.arrow);
      this.SUBRULE2(this.nodeRef, { LABEL: "right" });
      this.OPTION(() => {
        this.SUBRULE(this.anchorSpec);
      });
      this.OPTION2(() => {
        this.SUBRULE(this.labelSpec);
      });
    });
  });

  // AnchorSpec := '(' StyleProps ')'
  private anchorSpec = this.RULE("anchorSpec", () => {
    this.CONSUME(LParen);
    this.SUBRULE(this.styleProps);
    this.CONSUME(RParen);
  });

  // NodeRef := Identifier ('.' Identifier)? ShapeSpec? LabelSpec?
  private nodeRef = this.RULE("nodeRef", () => {
    this.CONSUME(Identifier, { LABEL: "nodeId" });
    this.OPTION(() => {
      this.CONSUME(Dot);
      this.CONSUME2(Identifier, { LABEL: "subId" });
    });
    this.OPTION2(() => {
      this.SUBRULE(this.shapeSpec);
    });
    this.OPTION3(() => {
      this.SUBRULE(this.labelSpec);
    });
  });

  // ShapeSpec := '(' ShapeType StyleProps? ')'
  private shapeSpec = this.RULE("shapeSpec", () => {
    this.CONSUME(LParen);
    this.SUBRULE(this.shapeType);
    this.OPTION(() => {
      this.CONSUME(Comma);
      this.SUBRULE(this.styleProps);
    });
    this.CONSUME(RParen);
  });

  // ShapeType := 'rect' | 'box' | 'rectangle' | 'circle' | 'oval' | 'ellipse' | 'diamond' | 'cylinder' | 'database' | 'db'
  private shapeType = this.RULE("shapeType", () => {
    this.OR([
      { ALT: () => this.CONSUME(ShapeRect) },
      { ALT: () => this.CONSUME(ShapeBox) },
      { ALT: () => this.CONSUME(ShapeRectangle) },
      { ALT: () => this.CONSUME(ShapeCircle) },
      { ALT: () => this.CONSUME(ShapeOval) },
      { ALT: () => this.CONSUME(ShapeEllipse) },
      { ALT: () => this.CONSUME(ShapeDiamond) },
      { ALT: () => this.CONSUME(ShapeCylinder) },
      { ALT: () => this.CONSUME(ShapeDatabase) },
      { ALT: () => this.CONSUME(ShapeDb) },
    ]);
  });

  // StyleSpec := '(' StyleProps ')'
  private styleSpec = this.RULE("styleSpec", () => {
    this.CONSUME(LParen);
    this.SUBRULE(this.styleProps);
    this.CONSUME(RParen);
  });

  // StyleProps := StyleProp (',' StyleProp)*
  private styleProps = this.RULE("styleProps", () => {
    this.SUBRULE(this.styleProp);
    this.MANY(() => {
      this.CONSUME(Comma);
      this.SUBRULE2(this.styleProp);
    });
  });

  // StyleProp := Identifier ':' (ColorLiteral | NumberLiteral | Identifier)
  private styleProp = this.RULE("styleProp", () => {
    this.CONSUME(Identifier);
    this.CONSUME(Colon);
    this.OR([
      { ALT: () => this.CONSUME(ColorLiteral) },
      { ALT: () => this.CONSUME(NumberLiteral) },
      { ALT: () => this.CONSUME2(Identifier) },
    ]);
  });

  // LabelSpec := ':' StringLiteral
  private labelSpec = this.RULE("labelSpec", () => {
    this.CONSUME(Colon);
    this.CONSUME(StringLiteral);
  });

  // Arrow := '->' | '<-' | '<->' | '-->' | '==>' | '--'
  private arrow = this.RULE("arrow", () => {
    this.OR([
      { ALT: () => this.CONSUME(ArrowBiDirectional) },
      { ALT: () => this.CONSUME(ArrowDottedRight) },
      { ALT: () => this.CONSUME(ArrowThickRight) },
      { ALT: () => this.CONSUME(ArrowLeft) },
      { ALT: () => this.CONSUME(ArrowRight) },
      { ALT: () => this.CONSUME(Line) },
    ]);
  });
}

// Singleton parser instance
const parserInstance = new PintoParser();

// CST Visitor to build AST
const BaseCstVisitor = parserInstance.getBaseCstVisitorConstructor();

class PintoASTVisitor extends BaseCstVisitor {
  private nodes: Map<string, NodeAST> = new Map();

  constructor() {
    super();
    this.validateVisitor();
  }

  document(ctx: any): DocumentAST {
    this.nodes.clear();
    const statements: StatementAST[] = [];

    if (ctx.statement) {
      for (const stmtCtx of ctx.statement) {
        const result = this.visit(stmtCtx);
        if (Array.isArray(result)) {
          statements.push(...result);
        } else if (result) {
          statements.push(result);
        }
      }
    }

    // Add all nodes that were referenced but not explicitly defined
    const definedNodeIds = new Set(
      statements.filter((s) => s.type === "node").map((s) => (s as NodeAST).id)
    );

    for (const [id, node] of this.nodes) {
      if (!definedNodeIds.has(id)) {
        statements.unshift(node);
      }
    }

    return { statements, errors: [] };
  }

  statement(ctx: any): StatementAST | StatementAST[] | null {
    if (ctx.groupDef) {
      return this.visit(ctx.groupDef);
    }
    if (ctx.layoutDef) {
      return this.visit(ctx.layoutDef);
    }
    if (ctx.freeArrowDef) {
      return this.visit(ctx.freeArrowDef);
    }
    if (ctx.edgeOrNode) {
      return this.visit(ctx.edgeOrNode);
    }
    return null;
  }

  groupDef(ctx: any): GroupAST {
    const id = ctx.Identifier[0].image;
    const children: StatementAST[] = [];

    if (ctx.statement) {
      for (const stmtCtx of ctx.statement) {
        const result = this.visit(stmtCtx);
        if (Array.isArray(result)) {
          children.push(...result);
        } else if (result) {
          children.push(result);
        }
      }
    }

    return {
      type: "group",
      id,
      children,
      style: ctx.styleSpec ? this.visit(ctx.styleSpec) : undefined,
    };
  }

  layoutDef(ctx: any): LayoutAST {
    return {
      type: "layout",
      algorithm: ctx.Identifier[0].image,
    };
  }

  freeArrowDef(ctx: any): FreeArrowAST {
    const props = this.visit(ctx.styleProps) as StyleProps;
    return {
      type: "freeArrow",
      x1: props.x1 || 0,
      y1: props.y1 || 0,
      x2: props.x2 || 0,
      y2: props.y2 || 0,
      arrowType: "right",
    };
  }

  edgeOrNode(ctx: any): StatementAST[] {
    const results: StatementAST[] = [];
    const leftNode = this.visit(ctx.left[0]) as NodeAST;

    // Ensure node exists
    if (!this.nodes.has(leftNode.id)) {
      this.nodes.set(leftNode.id, leftNode);
    } else {
      // Merge properties
      const existing = this.nodes.get(leftNode.id)!;
      if (leftNode.label) existing.label = leftNode.label;
      if (leftNode.shape) existing.shape = leftNode.shape;
      if (leftNode.style) existing.style = { ...existing.style, ...leftNode.style };
    }

    if (ctx.arrow && ctx.right) {
      let prevNode = leftNode;

      for (let i = 0; i < ctx.arrow.length; i++) {
        const arrowType = this.visit(ctx.arrow[i]) as ArrowTypeAST;
        const rightNode = this.visit(ctx.right[i]) as NodeAST;

        // Ensure right node exists
        if (!this.nodes.has(rightNode.id)) {
          this.nodes.set(rightNode.id, rightNode);
        } else {
          const existing = this.nodes.get(rightNode.id)!;
          if (rightNode.label) existing.label = rightNode.label;
          if (rightNode.shape) existing.shape = rightNode.shape;
          if (rightNode.style) existing.style = { ...existing.style, ...rightNode.style };
        }

        const edge: EdgeAST = {
          type: "edge",
          from: prevNode.id,
          to: rightNode.id,
          arrowType,
        };

        // Check for anchor points
        if (ctx.anchorSpec && ctx.anchorSpec[i]) {
          const anchors = this.visit(ctx.anchorSpec[i]) as StyleProps;
          if (anchors.x1 !== undefined) edge.x1 = anchors.x1;
          if (anchors.y1 !== undefined) edge.y1 = anchors.y1;
          if (anchors.x2 !== undefined) edge.x2 = anchors.x2;
          if (anchors.y2 !== undefined) edge.y2 = anchors.y2;
        }

        // Check for label after this edge
        if (ctx.labelSpec && ctx.labelSpec[i]) {
          edge.label = this.visit(ctx.labelSpec[i]);
        }

        results.push(edge);
        prevNode = rightNode;
      }
    }

    return results;
  }

  nodeRef(ctx: any): NodeAST {
    let id = ctx.nodeId[0].image;
    if (ctx.subId) {
      id = `${id}.${ctx.subId[0].image}`;
    }

    const node: NodeAST = { type: "node", id };

    if (ctx.shapeSpec) {
      const shapeResult = this.visit(ctx.shapeSpec);
      node.shape = shapeResult.shape;
      if (shapeResult.style) {
        node.style = shapeResult.style;
      }
    }

    if (ctx.labelSpec) {
      node.label = this.visit(ctx.labelSpec);
    }

    return node;
  }

  shapeSpec(ctx: any): { shape: ShapeTypeAST; style?: StyleProps } {
    const shape = this.visit(ctx.shapeType) as ShapeTypeAST;
    const style = ctx.styleProps ? this.visit(ctx.styleProps) : undefined;
    return { shape, style };
  }

  shapeType(ctx: any): ShapeTypeAST {
    if (ctx.ShapeRect || ctx.ShapeBox || ctx.ShapeRectangle) return "rect";
    if (ctx.ShapeCircle || ctx.ShapeOval || ctx.ShapeEllipse) return "circle";
    if (ctx.ShapeDiamond) return "diamond";
    if (ctx.ShapeCylinder || ctx.ShapeDatabase || ctx.ShapeDb) return "cylinder";
    return "rect";
  }

  styleSpec(ctx: any): StyleProps {
    return this.visit(ctx.styleProps);
  }

  anchorSpec(ctx: any): StyleProps {
    return this.visit(ctx.styleProps);
  }

  styleProps(ctx: any): StyleProps {
    const style: StyleProps = {};
    if (ctx.styleProp) {
      for (const propCtx of ctx.styleProp) {
        const { key, value } = this.visit(propCtx);
        if (key === "fill") style.fill = value;
        if (key === "stroke") style.stroke = value;
        if (key === "strokeWidth") style.strokeWidth = Number(value);
        if (key === "x") style.x = Number(value);
        if (key === "y") style.y = Number(value);
        if (key === "width") style.width = Number(value);
        if (key === "height") style.height = Number(value);
        if (key === "x1") style.x1 = Number(value);
        if (key === "y1") style.y1 = Number(value);
        if (key === "x2") style.x2 = Number(value);
        if (key === "y2") style.y2 = Number(value);
      }
    }
    return style;
  }

  styleProp(ctx: any): { key: string; value: string } {
    const key = ctx.Identifier[0].image;
    let value: string;
    if (ctx.ColorLiteral) {
      value = ctx.ColorLiteral[0].image;
    } else if (ctx.NumberLiteral) {
      value = ctx.NumberLiteral[0].image;
    } else {
      value = ctx.Identifier[1].image;
    }
    return { key, value };
  }

  labelSpec(ctx: any): string {
    const raw = ctx.StringLiteral[0].image;
    return raw.slice(1, -1); // Remove quotes
  }

  arrow(ctx: any): ArrowTypeAST {
    if (ctx.ArrowBiDirectional) return "both";
    if (ctx.ArrowDottedRight) return "dotted";
    if (ctx.ArrowThickRight) return "thick";
    if (ctx.ArrowLeft) return "left";
    if (ctx.ArrowRight) return "right";
    if (ctx.Line) return "line";
    return "right";
  }
}

const astVisitor = new PintoASTVisitor();

export function parse(input: string): DocumentAST {
  const lexingResult = PintoLexer.tokenize(input);

  if (lexingResult.errors.length > 0) {
    return {
      statements: [],
      errors: lexingResult.errors.map((e: any) => ({
        message: e.message,
        location: {
          startLine: e.line,
          startColumn: e.column,
          endLine: e.line,
          endColumn: e.column,
        },
      })),
    };
  }

  parserInstance.input = lexingResult.tokens;
  const cst = parserInstance.document();

  if (parserInstance.errors.length > 0) {
    return {
      statements: [],
      errors: parserInstance.errors.map((e) => ({
        message: e.message,
        location: e.token
          ? {
              startLine: e.token.startLine || 0,
              startColumn: e.token.startColumn || 0,
              endLine: e.token.endLine || 0,
              endColumn: e.token.endColumn || 0,
            }
          : undefined,
      })),
    };
  }

  return astVisitor.visit(cst);
}
