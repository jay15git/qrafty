let confirmedSupport = false

function isJsdomEnvironment() {
  return (
    typeof navigator !== "undefined" &&
    navigator.userAgent.toLowerCase().includes("jsdom")
  )
}

function hasLivePaperShaderCanvas() {
  if (typeof document === "undefined") {
    return false
  }

  return Boolean(document.querySelector("[data-shader-canvas-host] canvas"))
}

function releaseProbeContext(gl: WebGLRenderingContext | WebGL2RenderingContext) {
  gl.getExtension("WEBGL_lose_context")?.loseContext()
}

export function hasPaperShaderWebGlSupport() {
  if (confirmedSupport) {
    return true
  }

  if (typeof document === "undefined" || isJsdomEnvironment()) {
    return false
  }

  if (hasLivePaperShaderCanvas()) {
    confirmedSupport = true
    return true
  }

  const canvas = document.createElement("canvas")

  try {
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl")
    if (!gl) {
      return false
    }

    releaseProbeContext(gl)
    confirmedSupport = true
    return true
  } catch {
    return false
  }
}

export function resetPaperShaderWebGlSupportCache() {
  confirmedSupport = false
}
