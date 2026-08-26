type PreviewSessionListener = () => void

let isInteracting = false
const listeners = new Set<PreviewSessionListener>()

function notifyPreviewSessionListeners() {
  for (const listener of listeners) {
    listener()
  }
}

export const previewSession = {
  beginInteraction() {
    if (isInteracting) {
      return
    }

    isInteracting = true
    notifyPreviewSessionListeners()
  },
  endInteraction() {
    if (!isInteracting) {
      return
    }

    isInteracting = false
    notifyPreviewSessionListeners()
  },
  getIsInteracting() {
    return isInteracting
  },
  subscribe(listener: PreviewSessionListener) {
    listeners.add(listener)

    return () => {
      listeners.delete(listener)
    }
  },
}
