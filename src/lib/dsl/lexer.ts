import { createToken, Lexer } from "chevrotain";

// Identifier must be defined first for longer_alt to work
export const Identifier = createToken({
  name: "Identifier",
  pattern: /[a-zA-Z_][a-zA-Z0-9_]*/,
});

// Keywords (use longer_alt to prefer Identifier for longer matches)
export const Group = createToken({ name: "Group", pattern: /group/, longer_alt: Identifier });
export const Style = createToken({ name: "Style", pattern: /@style/ });
export const Layout = createToken({ name: "Layout", pattern: /@layout/ });

// Shape keywords (use longer_alt to allow "decision" as identifier)
export const ShapeRect = createToken({ name: "ShapeRect", pattern: /rect/, longer_alt: Identifier });
export const ShapeBox = createToken({ name: "ShapeBox", pattern: /box/, longer_alt: Identifier });
export const ShapeRectangle = createToken({ name: "ShapeRectangle", pattern: /rectangle/, longer_alt: Identifier });
export const ShapeCircle = createToken({ name: "ShapeCircle", pattern: /circle/, longer_alt: Identifier });
export const ShapeOval = createToken({ name: "ShapeOval", pattern: /oval/, longer_alt: Identifier });
export const ShapeEllipse = createToken({ name: "ShapeEllipse", pattern: /ellipse/, longer_alt: Identifier });
export const ShapeDiamond = createToken({ name: "ShapeDiamond", pattern: /diamond/, longer_alt: Identifier });
export const ShapeCylinder = createToken({ name: "ShapeCylinder", pattern: /cylinder/, longer_alt: Identifier });
export const ShapeDatabase = createToken({ name: "ShapeDatabase", pattern: /database/, longer_alt: Identifier });
export const ShapeDb = createToken({ name: "ShapeDb", pattern: /db/, longer_alt: Identifier });

// Free arrow keyword
export const Arrow = createToken({ name: "Arrow", pattern: /arrow/, longer_alt: Identifier });

// Arrows
export const ArrowBiDirectional = createToken({ name: "ArrowBiDirectional", pattern: /<->/ });
export const ArrowLeft = createToken({ name: "ArrowLeft", pattern: /<-/ });
export const ArrowRight = createToken({ name: "ArrowRight", pattern: /->/ });
export const ArrowDottedRight = createToken({ name: "ArrowDottedRight", pattern: /-->/ });
export const ArrowThickRight = createToken({ name: "ArrowThickRight", pattern: /==>/ });
export const Line = createToken({ name: "Line", pattern: /--/ });

// Literals
export const StringLiteral = createToken({
  name: "StringLiteral",
  pattern: /"[^"]*"/,
});

export const NumberLiteral = createToken({
  name: "NumberLiteral",
  pattern: /-?\d+/,
});

export const ColorLiteral = createToken({
  name: "ColorLiteral",
  pattern: /#[a-fA-F0-9]{3,6}/,
});

// Punctuation
export const LCurly = createToken({ name: "LCurly", pattern: /{/ });
export const RCurly = createToken({ name: "RCurly", pattern: /}/ });
export const LParen = createToken({ name: "LParen", pattern: /\(/ });
export const RParen = createToken({ name: "RParen", pattern: /\)/ });
export const Colon = createToken({ name: "Colon", pattern: /:/ });
export const Comma = createToken({ name: "Comma", pattern: /,/ });
export const Dot = createToken({ name: "Dot", pattern: /\./ });

// Whitespace & Comments
export const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});

export const Comment = createToken({
  name: "Comment",
  pattern: /#[^\n]*/,
  group: Lexer.SKIPPED,
});

// Order matters! Keywords before Identifier, longer patterns first
export const allTokens = [
  // Whitespace & comments (skipped)
  WhiteSpace,
  Comment,

  // Arrows (order by length, longest first)
  ArrowBiDirectional,
  ArrowDottedRight,
  ArrowThickRight,
  ArrowLeft,
  ArrowRight,
  Line,

  // Literals
  StringLiteral,
  ColorLiteral,
  NumberLiteral,

  // Special keywords
  Style,
  Layout,

  // Keywords and shape types (before Identifier, but with longer_alt)
  Group,
  Arrow,
  ShapeRectangle,  // longer first
  ShapeRect,
  ShapeBox,
  ShapeEllipse,    // longer first
  ShapeCircle,
  ShapeOval,
  ShapeDiamond,
  ShapeDatabase,   // longer first
  ShapeCylinder,
  ShapeDb,

  // Identifier last among keywords
  Identifier,

  // Punctuation
  LCurly,
  RCurly,
  LParen,
  RParen,
  Colon,
  Comma,
  Dot,
];

export const PintoLexer = new Lexer(allTokens);

export function tokenize(input: string) {
  const result = PintoLexer.tokenize(input);
  return result;
}
