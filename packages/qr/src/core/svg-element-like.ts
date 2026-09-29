// Structural subset of the DOM `Element` API used by the QR SVG pipeline.
// Implemented by real DOM elements at runtime (cast at call boundaries) and by
// emit-side adapters wrapping ordered EmitNode attribute lists.

export interface QrSvgDocumentLike {
  createElementNS(namespace: string, tagName: string): QrSvgElementLike;
}

export interface QrSvgElementLike {
  readonly tagName: string;
  readonly children: QrSvgElementLike[];
  readonly parentNode?: QrSvgElementLike | null;
  readonly nextSibling?: QrSvgElementLike | null;
  readonly firstChild?: QrSvgElementLike | null;
  textContent?: string | null;
  readonly ownerDocument: QrSvgDocumentLike;
  getAttribute(name: string): string | null;
  getAttributeNS(namespace: string, localName: string): string | null;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
  setAttributeNS(namespace: string, name: string, value: string): void;
  appendChild(child: QrSvgElementLike): QrSvgElementLike;
  insertBefore(child: QrSvgElementLike, referenceNode: QrSvgElementLike | null): QrSvgElementLike;
  remove(): void;
  cloneNode(deep?: boolean): QrSvgElementLike;
  querySelector(selector: string): QrSvgElementLike | null;
  querySelectorAll(selector: string): QrSvgElementLike[];
}
