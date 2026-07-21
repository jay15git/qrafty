export interface QRExternalSVGAdapterOptions {
  moduleColor: string;
  positionRingColor: string;
  positionCenterColor: string;
  squares: boolean;
}

export interface QRExternalSVGAdapterResult {
  svg: string;
  moduleCount: number;
  margin: number;
  hasFinderPatterns: boolean;
}

interface QRPathRun {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface QRModuleCell {
  column: number;
  row: number;
}

export function adaptExternalQRCodeSVG(
  externalSvg: string,
  options: QRExternalSVGAdapterOptions
): QRExternalSVGAdapterResult | undefined {
  const svg = parseSVG(externalSvg);
  if (!svg) return undefined;

  const passedThrough = passThroughAnimatableSVG(svg);
  if (passedThrough) return passedThrough;

  const path = findForegroundPath(svg);
  if (!path) return undefined;

  const runs = parseHorizontalPathRuns(path.getAttribute('d') || '');
  if (runs.length === 0) return undefined;

  return renderPathRunsAsAnimatableSVG(svg, runs, options);
}

function parseSVG(markup: string) {
  if (!markup || markup.trim() === '') {
    return undefined;
  }
  if (typeof DOMParser !== 'undefined') {
    const document = new DOMParser().parseFromString(markup, 'image/svg+xml');
    if (document.querySelector('parsererror')) return undefined;
    const svg = document.querySelector('svg');
    return svg || undefined;
  }
  if (typeof document === 'undefined') return undefined;
  const container = document.createElement('div');
  container.innerHTML = markup;
  const svg = container.querySelector('svg');
  return svg || undefined;
}

function serializeSVG(svg: SVGSVGElement) {
  if (typeof XMLSerializer !== 'undefined') {
    return new XMLSerializer().serializeToString(svg);
  }
  return svg.outerHTML;
}

function passThroughAnimatableSVG(svg: SVGSVGElement) {
  const modules = Array.from(svg.querySelectorAll('.module')) as SVGElement[];
  const hasAnimatableModules = modules.some(
    (module) =>
      module.getAttribute('data-column') !== null &&
      module.getAttribute('data-row') !== null
  );
  if (!hasAnimatableModules) return undefined;

  const positions = modules
    .map((module) => ({
      column: parseFloat(module.getAttribute('data-column') || ''),
      row: parseFloat(module.getAttribute('data-row') || ''),
    }))
    .filter((position) => isFinite(position.column) && isFinite(position.row));
  if (positions.length === 0) return undefined;

  const maxCoordinate = positions.reduce(
    (max, position) => Math.max(max, position.column, position.row),
    0
  );
  normalizeSVGRoot(svg);
  return {
    svg: serializeSVG(svg),
    moduleCount: maxCoordinate + 1,
    margin: 4,
    hasFinderPatterns:
      svg.querySelector('.position-ring') !== null ||
      svg.querySelector('.position-center') !== null,
  };
}

function normalizeSVGRoot(svg: SVGSVGElement) {
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  if (!svg.getAttribute('preserveAspectRatio')) {
    svg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
  }
}

function findForegroundPath(svg: SVGSVGElement) {
  const paths = Array.from(svg.querySelectorAll('path')) as SVGPathElement[];
  const candidates = paths.filter((path) => {
    const fill = (path.getAttribute('fill') || '').toLowerCase();
    const d = path.getAttribute('d') || '';
    return d.indexOf('h') !== -1 && fill !== '#ffffff' && fill !== 'white';
  });
  return candidates.length > 0 ? candidates[candidates.length - 1] : undefined;
}

export function parseHorizontalPathRuns(pathData: string): QRPathRun[] {
  const runs: QRPathRun[] = [];
  const runExpression =
    /M\s*(-?\d+(?:\.\d+)?)\s*,?\s*(-?\d+(?:\.\d+)?)\s*h\s*(-?\d+(?:\.\d+)?)\s*v\s*(-?\d+(?:\.\d+)?)\s*H\s*(-?\d+(?:\.\d+)?)\s*z/gi;
  let match: RegExpExecArray | null;
  while ((match = runExpression.exec(pathData)) !== null) {
    const x = Number(match[1]);
    const y = Number(match[2]);
    const width = Number(match[3]);
    const height = Number(match[4]);
    const closingX = Number(match[5]);
    if (
      !isFinite(x) ||
      !isFinite(y) ||
      !isFinite(width) ||
      !isFinite(height) ||
      !isFinite(closingX) ||
      width <= 0 ||
      height <= 0 ||
      Math.abs(closingX - x) > 0.0001
    ) {
      continue;
    }
    runs.push({ x, y, width, height });
  }
  return runs;
}

function renderPathRunsAsAnimatableSVG(
  sourceSvg: SVGSVGElement,
  runs: QRPathRun[],
  options: QRExternalSVGAdapterOptions
) {
  const cells = expandRunsToCells(runs);
  if (cells.length === 0) return undefined;

  const minColumn = cells.reduce((min, cell) => Math.min(min, cell.column), Infinity);
  const minRow = cells.reduce((min, cell) => Math.min(min, cell.row), Infinity);
  const maxColumn = cells.reduce((max, cell) => Math.max(max, cell.column), -Infinity);
  const maxRow = cells.reduce((max, cell) => Math.max(max, cell.row), -Infinity);
  const margin = Math.min(minColumn, minRow);
  const moduleCount = Math.max(maxColumn - margin, maxRow - margin) + 1;
  const viewBox = sourceSvg.getAttribute('viewBox') || `0 0 ${moduleCount + margin * 2} ${moduleCount + margin * 2}`;

  const modules = cells
    .map((cell) =>
      renderModuleCell(
        cell.column,
        cell.row,
        margin,
        moduleCount,
        options.moduleColor,
        options.positionRingColor,
        options.positionCenterColor,
        options.squares
      )
    )
    .join('');
  const preservedImages = serializePreservedImages(sourceSvg);

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="${escapeAttribute(
      viewBox
    )}" preserveAspectRatio="xMinYMin meet"><rect width="100%" height="100%" fill="white" fill-opacity="0"/>${modules}${preservedImages}</svg>`,
    moduleCount,
    margin,
    hasFinderPatterns: true,
  };
}

function serializePreservedImages(svg: SVGSVGElement) {
  return Array.from(svg.querySelectorAll('image'))
    .map((image) => serializeSVG(image as any))
    .join('');
}

function expandRunsToCells(runs: QRPathRun[]) {
  const cells: QRModuleCell[] = [];
  runs.forEach((run) => {
    const width = Math.round(run.width);
    const height = Math.round(run.height);
    for (let x = 0; x < width; x += 1) {
      for (let y = 0; y < height; y += 1) {
        cells.push({ column: run.x + x, row: run.y + y });
      }
    }
  });
  return cells;
}

function renderModuleCell(
  sourceColumn: number,
  sourceRow: number,
  margin: number,
  moduleCount: number,
  moduleColor: string,
  ringColor: string,
  centerColor: string,
  squares: boolean
) {
  const column = sourceColumn - margin;
  const row = sourceRow - margin;
  const entity = classifyFinderEntity(column, row, moduleCount);
  if (entity === 'ring') {
    return renderSquareModule(
      sourceColumn,
      sourceRow,
      column,
      row,
      'position-ring',
      ringColor
    );
  }
  if (entity === 'center') {
    return renderSquareModule(
      sourceColumn,
      sourceRow,
      column,
      row,
      'position-center',
      centerColor
    );
  }
  if (squares) {
    return renderSquareModule(sourceColumn, sourceRow, column, row, 'module', moduleColor);
  }
  return `<circle class="module" fill="${escapeAttribute(moduleColor)}" cx="${
    sourceColumn + 0.5
  }" cy="${sourceRow + 0.5}" data-column="${column}" data-row="${row}" r="0.5"/>`;
}

function renderSquareModule(
  sourceColumn: number,
  sourceRow: number,
  column: number,
  row: number,
  className: string,
  fill: string
) {
  return `<rect class="${className}" fill="${escapeAttribute(fill)}" x="${sourceColumn}" y="${sourceRow}" width="1" height="1" data-column="${column}" data-row="${row}"/>`;
}

function classifyFinderEntity(column: number, row: number, moduleCount: number) {
  const inTopLeft = column >= 0 && column <= 6 && row >= 0 && row <= 6;
  const inTopRight =
    column >= moduleCount - 7 && column <= moduleCount - 1 && row >= 0 && row <= 6;
  const inBottomLeft =
    column >= 0 && column <= 6 && row >= moduleCount - 7 && row <= moduleCount - 1;
  if (!inTopLeft && !inTopRight && !inBottomLeft) return 'module';

  const localColumn = inTopRight ? column - (moduleCount - 7) : column;
  const localRow = inBottomLeft ? row - (moduleCount - 7) : row;
  if (localColumn >= 2 && localColumn <= 4 && localRow >= 2 && localRow <= 4) {
    return 'center';
  }
  return 'ring';
}

function escapeAttribute(value: string) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
