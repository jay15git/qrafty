import { beforeAll, vi } from "vitest"

function createMockCanvasContext() {
  return {
    canvas: { width: 1, height: 1 },
    arc: vi.fn(),
    beginPath: vi.fn(),
    clearRect: vi.fn(),
    clip: vi.fn(),
    closePath: vi.fn(),
    createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4), height: 1, width: 1 })),
    drawImage: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    fillStyle: "",
    fillText: vi.fn(),
    font: "10px sans-serif",
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4), height: 1, width: 1 })),
    lineTo: vi.fn(),
    measureText: vi.fn(() => ({ width: 10 })),
    moveTo: vi.fn(),
    putImageData: vi.fn(),
    rect: vi.fn(),
    restore: vi.fn(),
    rotate: vi.fn(),
    save: vi.fn(),
    scale: vi.fn(),
    setTransform: vi.fn(),
    stroke: vi.fn(),
    textAlign: "start",
    textBaseline: "alphabetic",
    transform: vi.fn(),
    translate: vi.fn(),
  }
}

beforeAll(() => {
  if (typeof HTMLCanvasElement === "undefined") {
    return
  }

  HTMLCanvasElement.prototype.getContext = vi.fn((type: string) => {
    if (type === "2d") {
      return createMockCanvasContext() as unknown as CanvasRenderingContext2D
    }

    return null
  }) as typeof HTMLCanvasElement.prototype.getContext
})
