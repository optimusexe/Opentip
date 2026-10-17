const FUND = /\bfund(ing|ed|er|ers)?\b/i;
const HERO = "Funding for open source, from the open market";
const COPY_ATTRS = new Set(["alt", "title", "placeholder", "label", "aria-label", "aria-description"]);
const SKIP_ATTRS = new Set(["className", "class", "href", "id", "htmlFor", "key", "src", "rel", "type", "role", "name", "value", "xmlns", "d", "viewBox", "fill", "stroke"]);

export function copyProblems(text, filename) {
  const problems = [];
  const value = text.replace(/\s+/g, " ").trim();
  if (!value) return problems;
  if (FUND.test(value) && !value.includes(HERO) && !HERO.startsWith(value)) {
    problems.push("User-facing copy says tip, tipped, tips, or Supporters. The only fund-word exception is the hero \"Funding for open source, from the open market.\"");
  }
  if (oarScope(filename) && /\bOAR\b/.test(value) && /\btip/i.test(value) && !/coming soon/i.test(value)) {
    problems.push("Marketing names ETH and USDC. When copy mentions OAR and tipping, say OAR is coming soon.");
  }
  return problems;
}

function oarScope(filename) {
  const file = filename.replaceAll("\\", "/");
  return file.includes("/app/docs/")
    || file.includes("/components/home/")
    || file.endsWith("/app/page.tsx")
    || file.endsWith("/app/layout.tsx");
}

function literalText(node) {
  if (node.type === "Literal" && typeof node.value === "string") return node.value;
  if (node.type === "JSXText") return node.value;
  if (node.type === "TemplateLiteral" && node.expressions.length === 0) {
    return node.quasis.map((part) => part.value.cooked ?? "").join("");
  }
  return null;
}

function attrName(node) {
  if (!node || node.type !== "JSXAttribute" || !node.name) return "";
  return node.name.name || "";
}

function isCopyNode(node) {
  if (node.type === "JSXText") return true;
  const parent = node.parent;
  if (!parent) return false;
  if (parent.type === "JSXAttribute") {
    const name = attrName(parent);
    if (SKIP_ATTRS.has(name)) return false;
    if (COPY_ATTRS.has(name)) return true;
    const text = literalText(node) ?? "";
    return /\s/.test(text);
  }
  if (parent.type === "JSXExpressionContainer") {
    const grand = parent.parent;
    if (grand && (grand.type === "JSXElement" || grand.type === "JSXFragment")) return true;
    if (grand && grand.type === "JSXAttribute") {
      const name = attrName(grand);
      if (SKIP_ATTRS.has(name)) return false;
      return true;
    }
  }
  const text = literalText(node) ?? "";
  return /\s/.test(text) && parent.type !== "ImportDeclaration";
}

function memberNamedIcon(node) {
  if (!node) return false;
  if (node.type === "MemberExpression" && node.property && node.property.type === "Identifier" && node.property.name === "icon") return true;
  if (node.type === "ChainExpression") return memberNamedIcon(node.expression);
  for (const key of ["object", "left", "right", "alternate", "consequent", "argument"]) {
    if (node[key] && memberNamedIcon(node[key])) return true;
  }
  return false;
}

const plugin = {
  rules: {
    "ui-copy": {
      create(context) {
        const filename = context.filename || context.getFilename();
        function check(node) {
          if (filename.includes(".test.")) return;
          const text = literalText(node);
          if (text == null || !isCopyNode(node)) return;
          for (const message of copyProblems(text, filename)) {
            context.report({ node, message });
          }
        }
        return { Literal: check, JSXText: check, TemplateLiteral: check };
      },
    },
  },
};

export default plugin;
