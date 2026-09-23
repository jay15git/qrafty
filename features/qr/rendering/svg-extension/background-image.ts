import { type QrSvgExtensionOptions, type QrSvgExtensionFunction } from "./types";
import { getOrCreateSvgDefs } from "./svg-dom-utils";

export function createBackgroundImageExtension(
  imageHref: string,
  backgroundRound: number,
): QrSvgExtensionFunction {
  return (svg, options) => {
    const document = svg.ownerDocument;

    if (!document) {
      return;
    }

    svg.querySelectorAll('[data-qr-layer="background-image"]').forEach((node) => {
      node.remove();
    });
    svg.querySelectorAll('[data-qr-layer="background-image-clip"]').forEach((node) => {
      node.remove();
    });

    const backgroundImage = document.createElementNS("http://www.w3.org/2000/svg", "image");
    const width = String(options.width ?? 300);
    const height = String(options.height ?? 300);

    backgroundImage.setAttribute("data-qr-layer", "background-image");
    backgroundImage.setAttribute("href", imageHref);
    backgroundImage.setAttribute("x", "0");
    backgroundImage.setAttribute("y", "0");
    backgroundImage.setAttribute("width", width);
    backgroundImage.setAttribute("height", height);
    backgroundImage.setAttribute("preserveAspectRatio", "xMidYMid slice");
    backgroundImage.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", imageHref);

    const clipPathId = addRoundedBackgroundImageClip(svg, backgroundRound, options);

    if (clipPathId) {
      backgroundImage.setAttribute("clip-path", `url('#${clipPathId}')`);
    }

    const insertReference = getBackgroundImageInsertReference(svg);
    svg.insertBefore(backgroundImage, insertReference);
  };
}

function addRoundedBackgroundImageClip(
  svg: SVGElement,
  backgroundRound: number,
  options: QrSvgExtensionOptions,
) {
  if (backgroundRound <= 0) {
    return null;
  }

  const document = svg.ownerDocument;

  if (!document) {
    return null;
  }

  const width = options.width ?? 300;
  const height = options.height ?? 300;
  const size = Math.min(width, height);
  const clipPathId = "clip-path-background-image";
  const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");

  clipPath.setAttribute("id", clipPathId);
  clipPath.setAttribute("data-qr-layer", "background-image-clip");
  rect.setAttribute("x", String((width - size) / 2));
  rect.setAttribute("y", String((height - size) / 2));
  rect.setAttribute("width", String(size));
  rect.setAttribute("height", String(size));
  rect.setAttribute("rx", String((size / 2) * backgroundRound));
  clipPath.appendChild(rect);
  getOrCreateSvgDefs(svg).appendChild(clipPath);

  return clipPathId;
}

function getBackgroundImageInsertReference(svg: SVGElement) {
  const children = Array.from(svg.children);
  const backgroundRectIndex = children.findIndex(
    (child) =>
      child.tagName.toLowerCase() === "rect" ||
      child.getAttribute("data-qr-layer") === "background-surface-stroke",
  );

  if (backgroundRectIndex >= 0) {
    return children[backgroundRectIndex + 1] ?? null;
  }

  return children.find((child) => child.tagName.toLowerCase() !== "defs") ?? null;
}
