// Safe arithmetic evaluator for the practice-test calculator tool.
//
// Recursive-descent parser with correct operator precedence and parentheses.
// We do NOT use eval(): it is unsafe on model-supplied strings AND it treats `^`
// as bitwise XOR, not exponentiation, which would silently corrupt every power.
//
// Grammar (low -> high precedence):
//   expression := term (('+' | '-') term)*
//   term       := unary (('*' | '/') unary)*
//   unary      := ('+' | '-') unary | power
//   power      := primary ('^' unary)?     // right-associative; RHS is unary so 2^-3 works
//   primary    := number | '(' expression ')'
//
// This yields conventional results: -2^2 = -(2^2) = -4, and 2^-3 = 0.125. Supports
// decimals, parentheses, and + - * / ^ (incl. negative/fractional exponents).
// Throws on any invalid input or non-finite result.
export function evaluateExpression(input: string): number {
  // Drop currency symbols, thousands separators, and whitespace, then reject
  // anything that is not a number or a supported operator/paren (no eval, no funcs).
  const s = input.replace(/[$,\s]/g, "");
  if (!s) throw new Error("empty expression");
  if (!/^[0-9.+\-*/^()]+$/.test(s)) {
    throw new Error("expression contains unsupported characters");
  }

  let pos = 0;
  const peek = () => s[pos];

  function parseExpression(): number {
    let value = parseTerm();
    while (peek() === "+" || peek() === "-") {
      const op = s[pos++];
      const rhs = parseTerm();
      value = op === "+" ? value + rhs : value - rhs;
    }
    return value;
  }

  function parseTerm(): number {
    let value = parseUnary();
    while (peek() === "*" || peek() === "/") {
      const op = s[pos++];
      const rhs = parseUnary();
      value = op === "*" ? value * rhs : value / rhs;
    }
    return value;
  }

  function parseUnary(): number {
    if (peek() === "+" || peek() === "-") {
      const op = s[pos++];
      const v = parseUnary();
      return op === "-" ? -v : v;
    }
    return parsePower();
  }

  function parsePower(): number {
    const base = parsePrimary();
    if (peek() === "^") {
      pos++;
      const exp = parseUnary(); // right-assoc + allows a signed exponent (2^-3)
      return Math.pow(base, exp);
    }
    return base;
  }

  function parsePrimary(): number {
    if (peek() === "(") {
      pos++;
      const v = parseExpression();
      if (peek() !== ")") throw new Error("missing closing parenthesis");
      pos++;
      return v;
    }
    const start = pos;
    while (pos < s.length && /[0-9.]/.test(s[pos])) pos++;
    const numStr = s.slice(start, pos);
    if (!/^(\d+\.?\d*|\.\d+)$/.test(numStr)) {
      throw new Error(`invalid number near "${s.slice(start, start + 8)}"`);
    }
    const n = Number(numStr);
    if (!Number.isFinite(n)) throw new Error("invalid number");
    return n;
  }

  const result = parseExpression();
  if (pos !== s.length) {
    throw new Error(`unexpected token at "${s.slice(pos, pos + 8)}"`);
  }
  if (!Number.isFinite(result)) throw new Error("result is not a finite number");
  return result;
}
