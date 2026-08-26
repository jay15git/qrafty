let activeRunningShaderCount = 0
const MAX_RUNNING_SHADER_SLOTS = 2

export function acquireRunningShaderSlot() {
  if (activeRunningShaderCount >= MAX_RUNNING_SHADER_SLOTS) {
    return null
  }

  activeRunningShaderCount += 1

  return () => {
    activeRunningShaderCount = Math.max(0, activeRunningShaderCount - 1)
  }
}

export function getActiveRunningShaderCount() {
  return activeRunningShaderCount
}
