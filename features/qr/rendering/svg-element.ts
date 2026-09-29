// Pure in-memory SVG element used by the QR markup pipeline in place of a
// DOMParser-produced DOM. Implements `QrSvgElementLike` from `@qrafty/qr`
// core so extension code runs unchanged on both the IR and real DOM
// (real elements are cast at the boundary).

import type { QrSvgDocumentLike, QrSvgElementLike } from "@qrafty/qr-internal/core";

export type { QrSvgDocumentLike, QrSvgElementLike };

type SimpleSelector = {
  tag?: string;
  attributes: Array<{ name: string; operator?: "=" | "^="; value?: string }>;
};

type SelectorSegment = {
  combinator?: " " | ">";
  simple: SimpleSelector;
};

const parseSimpleSelector = (token: string): SimpleSelector => {
  const simple: SimpleSelector = { attributes: [] };
  const tagMatch = token.match(/^([a-zA-Z*][\w-]*)/);
  let rest = token;

  if (tagMatch) {
    rest = token.slice(tagMatch[0].length);

    if (tagMatch[1] !== "*") {
      simple.tag = tagMatch[1];
    }
  }

  const idMatch = rest.match(/^#([\w-]+)/);

  if (idMatch) {
    simple.attributes.push({ name: "id", operator: "=", value: idMatch[1] });
    rest = rest.slice(idMatch[0].length);
  }

  const attrPattern = /\[([\w:-]+)(?:(=|\^=)"([^"]*)")?\]/g;
  let attrMatch: RegExpExecArray | null;

  while ((attrMatch = attrPattern.exec(rest)) !== null) {
    simple.attributes.push({
      name: attrMatch[1],
      operator: attrMatch[2] as "=" | "^=" | undefined,
      value: attrMatch[3],
    });
  }

  return simple;
};

const parseSelector = (selector: string): SelectorSegment[] => {
  const segments: SelectorSegment[] = [];
  let combinator: " " | ">" | undefined;
  let index = 0;

  while (index < selector.length) {
    while (index < selector.length && /\s/.test(selector[index])) {
      if (segments.length > 0 && combinator === undefined) {
        combinator = " ";
      }
      index += 1;
    }

    if (index >= selector.length) {
      break;
    }

    if (selector[index] === ">") {
      combinator = ">";
      index += 1;
      continue;
    }

    let end = index;
    while (end < selector.length && !/\s|>/.test(selector[end])) {
      end += 1;
    }

    segments.push({
      combinator: segments.length === 0 ? undefined : (combinator ?? " "),
      simple: parseSimpleSelector(selector.slice(index, end)),
    });
    combinator = undefined;
    index = end;
  }

  return segments;
};

const matchesSimple = (node: QrSvgElementLike, simple: SimpleSelector) => {
  if (simple.tag && node.tagName.toLowerCase() !== simple.tag.toLowerCase()) {
    return false;
  }

  for (const attribute of simple.attributes) {
    const value = node.getAttribute(attribute.name);

    if (attribute.operator === undefined) {
      if (value === null) {
        return false;
      }
    } else if (attribute.operator === "^=") {
      if (value === null || !value.startsWith(attribute.value ?? "")) {
        return false;
      }
    } else if (value !== attribute.value) {
      return false;
    }
  }

  return true;
};

const matchesSelector = (node: QrSvgElementLike, segments: SelectorSegment[]) => {
  const last = segments[segments.length - 1];

  if (!last || !matchesSimple(node, last.simple)) {
    return false;
  }

  let current: QrSvgElementLike | null | undefined = node;

  for (let index = segments.length - 2; index >= 0; index -= 1) {
    const { combinator } = segments[index + 1];

    if (combinator === ">") {
      current = current.parentNode;
      if (!current || !matchesSimple(current, segments[index].simple)) {
        return false;
      }
    } else {
      current = current.parentNode;
      while (current && !matchesSimple(current, segments[index].simple)) {
        current = current.parentNode;
      }
      if (!current) {
        return false;
      }
    }
  }

  return true;
};

const svgIrDocument = {
  createElementNS(_namespace: string, tagName: string) {
    return new SvgIrElement(tagName);
  },
};

class SvgIrElement implements QrSvgElementLike {
  readonly tagName: string;
  readonly children: SvgIrElement[] = [];
  parentNode: SvgIrElement | null = null;
  textContent: string | null = null;
  readonly ownerDocument: QrSvgDocumentLike = svgIrDocument;
  private readonly attributes = new Map<string, string>();

  constructor(tagName: string) {
    this.tagName = tagName;
  }

  get firstChild(): SvgIrElement | null {
    return this.children[0] ?? null;
  }

  get nextSibling(): SvgIrElement | null {
    const parent = this.parentNode;

    if (!parent) {
      return null;
    }

    return parent.children[parent.children.indexOf(this) + 1] ?? null;
  }

  getAttribute(name: string) {
    return this.attributes.get(name) ?? null;
  }

  hasAttribute(name: string) {
    return this.attributes.has(name);
  }

  setAttribute(name: string, value: string) {
    this.attributes.set(name, String(value));
  }

  removeAttribute(name: string) {
    this.attributes.delete(name);
  }

  getAttributeNS(namespace: string, localName: string) {
    if (namespace === "http://www.w3.org/1999/xlink") {
      return (
        this.getAttribute(`xlink:${localName}`) ??
        this.getAttribute(`ns1:${localName}`) ??
        this.getAttribute(localName)
      );
    }

    return this.getAttribute(localName);
  }

  // XMLSerializer emits an auto `ns1:` prefix plus an `xmlns:ns1` declaration
  // for namespaced attributes set without one — mirror that so output matches.
  setAttributeNS(namespace: string, name: string, value: string) {
    if (namespace === "http://www.w3.org/1999/xlink" && !name.includes(":")) {
      this.attributes.set("xmlns:ns1", namespace);
      this.attributes.set(`ns1:${name}`, String(value));
      return;
    }

    this.attributes.set(name, String(value));
  }

  appendChild(child: QrSvgElementLike) {
    child.remove();
    this.children.push(child as SvgIrElement);
    (child as SvgIrElement).parentNode = this;
    return child;
  }

  insertBefore(child: QrSvgElementLike, referenceNode: QrSvgElementLike | null) {
    if (!referenceNode) {
      return this.appendChild(child);
    }

    const referenceIndex = this.children.indexOf(referenceNode as SvgIrElement);
    child.remove();
    (child as SvgIrElement).parentNode = this;

    if (referenceIndex === -1) {
      this.children.push(child as SvgIrElement);
    } else {
      this.children.splice(referenceIndex, 0, child as SvgIrElement);
    }

    return child;
  }

  removeChild(child: QrSvgElementLike) {
    const index = this.children.indexOf(child as SvgIrElement);

    if (index !== -1) {
      this.children.splice(index, 1);
      (child as SvgIrElement).parentNode = null;
    }

    return child;
  }

  remove() {
    this.parentNode?.removeChild(this);
  }

  cloneNode(deep = false): SvgIrElement {
    const clone = new SvgIrElement(this.tagName);
    clone.textContent = this.textContent;

    for (const [name, value] of this.attributes) {
      clone.attributes.set(name, value);
    }

    if (deep) {
      for (const child of this.children) {
        clone.appendChild(child.cloneNode(true));
      }
    }

    return clone;
  }

  querySelectorAll(selector: string): SvgIrElement[] {
    const segments = parseSelector(selector);
    const matches: SvgIrElement[] = [];
    const queue = [...this.children];

    while (queue.length > 0) {
      const element = queue.shift();

      if (!element) {
        continue;
      }

      if (matchesSelector(element, segments)) {
        matches.push(element);
      }

      queue.push(...element.children);
    }

    return matches;
  }

  querySelector(selector: string): SvgIrElement | null {
    return this.querySelectorAll(selector)[0] ?? null;
  }

  *attrEntries(): IterableIterator<[string, string]> {
    yield* this.attributes;
  }
}

const XML_ATTR_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  '"': "&quot;",
  "<": "&lt;",
  ">": "&gt;",
  "\t": "&#x9;",
  "\n": "&#xA;",
  "\r": "&#xD;",
};

const escapeXmlAttr = (value: string) =>
  value.replace(/[&"<>\t\n\r]/g, (char) => XML_ATTR_ESCAPES[char]);

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

// Parses the well-formed SVG markup this pipeline emits into an IR tree.
// Handles only what we produce: elements, double-quoted attributes,
// self-closing tags, comments, and processing instructions.
export function parseSvgIrMarkup(markup: string): SvgIrElement {
  const root = new SvgIrElement("__root__");
  let current: SvgIrElement = root;
  const tagPattern = /<[^>]*>/g;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(markup)) !== null) {
    const token = match[0];

    if (token.startsWith("<!--")) {
      continue;
    }

    if (token.startsWith("<?") || token.startsWith("<!")) {
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

    const element = new SvgIrElement(tagMatch[0]);
    const attrPattern = /([\w:-]+)="([^"]*)"/g;
    let attrMatch: RegExpExecArray | null;
    const attrSource = inner.slice(tagMatch[0].length);

    while ((attrMatch = attrPattern.exec(attrSource)) !== null) {
      // XML attribute-value normalization: literal tab/newline/CR fold to
      // spaces before entity references are expanded.
      const normalized = attrMatch[2].replace(/[\t\n\r]/g, " ");
      element.setAttribute(attrMatch[1], decodeXmlAttr(normalized));
    }

    current.appendChild(element);

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

// Mirrors XMLSerializer output: elements without children self-close.
export function serializeSvgElement(node: SvgIrElement): string {
  const attrs = [...node.attrEntries()]
    .map(([name, value]) => ` ${name}="${escapeXmlAttr(value)}"`)
    .join("");

  if (node.children.length === 0 && !node.textContent) {
    return `<${node.tagName}${attrs}/>`;
  }

  const children = node.children.map(serializeSvgElement).join("");
  return `<${node.tagName}${attrs}>${node.textContent ?? ""}${children}</${node.tagName}>`;
}
