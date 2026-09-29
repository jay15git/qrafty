// Ordered-attribute emit node for the QR SVG emitter. Replaces the old
// parse→mutate→serialize IR pass: extension logic mutates these nodes during
// emission and the serializer produces markup directly.
//
// `mode` selects serialization parity:
// - "jsx" — matches the historical emitAttrs()/el() output byte-for-byte
//   (escapes ', never self-closes).
// - "xml" — matches the old IR serializer/XMLSerializer round-trip output
//   (parse normalization: \t\n\r→space; escapes &"<>, leaves ' literal;
//   self-closes empty elements). Extensions ran on parsed IR, so any emitted
//   markup that went through them uses this mode.

export type EmitNode = {
  tagName: string;
  parentNode: EmitNode | null;
  children: EmitNode[];
  textContent: string | null;
  /** Ordered [name, value] pairs; first set wins position, later sets update in place. */
  attrs: [string, string][];
};

export function createEmitNode(
  tagName: string,
  attrs: Iterable<[string, string | number | boolean | null | undefined]> = [],
  children: EmitNode[] = [],
): EmitNode {
  const node: EmitNode = {
    tagName,
    parentNode: null,
    children: [],
    textContent: null,
    attrs: [],
  };

  for (const [name, value] of attrs) {
    if (value === undefined || value === null || value === false) {
      continue;
    }

    node.attrs.push([name, String(value)]);
  }

  for (const child of children) {
    appendEmitChild(node, child);
  }

  return node;
}

export function getEmitAttr(node: EmitNode, name: string) {
  return node.attrs.find(([key]) => key === name)?.[1] ?? null;
}

export function setEmitAttr(node: EmitNode, name: string, value: string | number) {
  const existing = node.attrs.find(([key]) => key === name);
  const next = String(value);

  if (existing) {
    existing[1] = next;
    return;
  }

  node.attrs.push([name, next]);
}

export function removeEmitAttr(node: EmitNode, name: string) {
  const index = node.attrs.findIndex(([key]) => key === name);

  if (index !== -1) {
    node.attrs.splice(index, 1);
  }
}

const XLINK_NS = "http://www.w3.org/1999/xlink";

// Mirrors XMLSerializer output for namespaced attrs set without a prefix:
// xlink:href lands as `xmlns:ns1` + `ns1:href`; already-prefixed names
// (e.g. "xlink:href") are stored verbatim. Both behaviors are load-bearing.
export function setEmitAttrNS(node: EmitNode, namespace: string, name: string, value: string) {
  if (namespace === XLINK_NS && !name.includes(":")) {
    setEmitAttr(node, "xmlns:ns1", namespace);
    setEmitAttr(node, `ns1:${name}`, value);
    return;
  }

  setEmitAttr(node, name, value);
}

export function getEmitAttrNS(node: EmitNode, namespace: string, localName: string) {
  if (namespace === XLINK_NS) {
    return (
      getEmitAttr(node, `xlink:${localName}`) ??
      getEmitAttr(node, `ns1:${localName}`) ??
      getEmitAttr(node, localName)
    );
  }

  return getEmitAttr(node, localName);
}

export function appendEmitChild(parent: EmitNode, child: EmitNode) {
  removeEmitNode(child);
  parent.children.push(child);
  child.parentNode = parent;
  return child;
}

export function insertEmitBefore(parent: EmitNode, child: EmitNode, reference: EmitNode | null) {
  const index = reference ? parent.children.indexOf(reference) : -1;
  removeEmitNode(child);
  child.parentNode = parent;

  if (index === -1) {
    parent.children.push(child);
  } else {
    parent.children.splice(index, 0, child);
  }

  return child;
}

export function removeEmitNode(node: EmitNode) {
  const parent = node.parentNode;

  if (parent) {
    const index = parent.children.indexOf(node);

    if (index !== -1) {
      parent.children.splice(index, 1);
    }

    node.parentNode = null;
  }
}

export function cloneEmitNode(node: EmitNode, deep = false): EmitNode {
  const clone = createEmitNode(node.tagName, node.attrs);
  clone.textContent = node.textContent;

  if (deep) {
    for (const child of node.children) {
      appendEmitChild(clone, cloneEmitNode(child, true));
    }
  }

  return clone;
}

export function getEmitAttrNormalized(node: EmitNode, name: string) {
  const value = getEmitAttr(node, name);

  if (value === null) {
    return null;
  }

  const numericValue = Number.parseFloat(value);

  return Number.isFinite(numericValue) ? numericValue : null;
}

const escapeJsxAttr = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const XML_ATTR_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  '"': "&quot;",
  "<": "&lt;",
  ">": "&gt;",
};

const escapeXmlAttr = (value: string) =>
  // Attribute-value normalization (literal tab/newline/CR fold to spaces)
  // happens at parse time; the serializer re-escapes the remaining specials.
  value.replace(/[\t\n\r]/g, " ").replace(/[&"<>]/g, (char) => XML_ATTR_ESCAPES[char]);

export function serializeEmitNode(node: EmitNode, mode: "jsx" | "xml"): string {
  const escape = mode === "xml" ? escapeXmlAttr : escapeJsxAttr;
  const attrs = node.attrs.map(([name, value]) => ` ${name}="${escape(value)}"`).join("");
  const children = node.children.map((child) => serializeEmitNode(child, mode)).join("");

  if (mode === "xml" && node.children.length === 0 && !node.textContent) {
    return `<${node.tagName}${attrs}/>`;
  }

  return `<${node.tagName}${attrs}>${node.textContent ?? ""}${children}</${node.tagName}>`;
}

export function serializeEmitNodes(nodes: EmitNode[], mode: "jsx" | "xml"): string {
  return nodes.map((node) => serializeEmitNode(node, mode)).join("");
}

const decodeXmlAttr = (value: string) =>
  value
    .replace(/&#x([0-9a-fA-F]+);/g, (_match, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_match, dec: string) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

// Parses the well-formed SVG markup this pipeline emits into an EmitNode tree.
// Handles only what we produce: elements, double-quoted attributes,
// self-closing tags, comments, and processing instructions.
export function parseEmitSvgMarkup(markup: string): EmitNode {
  const root = createEmitNode("__root__");
  let current = root;
  const tagPattern = /<[^>]*>/g;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(markup)) !== null) {
    const token = match[0];

    if (token.startsWith("<!--") || token.startsWith("<?") || token.startsWith("<!")) {
      continue;
    }

    if (token.startsWith("</")) {
      if (current.parentNode) {
        current = current.parentNode;
      }
      continue;
    }

    const selfClosing = token.endsWith("/>");
    const inner = token.slice(1, selfClosing ? -2 : -1);
    const tagMatch = inner.match(/^[\w:-]+/);

    if (!tagMatch) {
      continue;
    }

    const element = createEmitNode(tagMatch[0]);
    const attrPattern = /([\w:-]+)="([^"]*)"/g;
    const attrSource = inner.slice(tagMatch[0].length);
    let attrMatch: RegExpExecArray | null;

    while ((attrMatch = attrPattern.exec(attrSource)) !== null) {
      // XML attribute-value normalization: literal tab/newline/CR fold to
      // spaces before entity references are expanded.
      const normalized = attrMatch[2].replace(/[\t\n\r]/g, " ");
      setEmitAttr(element, attrMatch[1], decodeXmlAttr(normalized));
    }

    appendEmitChild(current, element);

    if (!selfClosing) {
      current = element;
    }
  }

  const firstElement = root.children[0];

  if (!firstElement) {
    throw new Error("QR SVG data is unavailable.");
  }

  return firstElement;
}

export function* emitDescendants(node: EmitNode): Generator<EmitNode> {
  for (const child of node.children) {
    yield child;
    yield* emitDescendants(child);
  }
}
