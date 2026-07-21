import { renderNewQrSvg } from "../core/render-svg"
import type { NewQrCodeProps } from "../types"

const BOOLEAN_ATTRS = new Set(["excavate"])

function serializeAttributeValue(key: string, value: unknown) {
  if (typeof value === "boolean") {
    return value ? "" : null
  }

  if (value === undefined || value === null) {
    return null
  }

  if (key === "palette" && Array.isArray(value)) {
    return value.join(",")
  }

  if (typeof value === "object") {
    return JSON.stringify(value)
  }

  return String(value)
}

function readPortablePropsFromElement(element: HTMLElement): NewQrCodeProps {
  const props: Record<string, unknown> = {
    value: element.getAttribute("value") ?? "",
  }

  for (const attr of element.attributes) {
    if (attr.name === "value" || attr.name === "class" || attr.name === "style") {
      continue
    }

    const camelKey = attr.name.replace(/-([a-z])/g, (_match, char: string) => char.toUpperCase())

    if (camelKey === "palette") {
      props.palette = attr.value.split(",").map((entry) => entry.trim()).filter(Boolean)
      continue
    }

    if (attr.value === "" && BOOLEAN_ATTRS.has(camelKey)) {
      props[camelKey] = true
      continue
    }

    if (attr.value.startsWith("{") || attr.value.startsWith("[")) {
      try {
        props[camelKey] = JSON.parse(attr.value)
        continue
      } catch {
        props[camelKey] = attr.value
        continue
      }
    }

    props[camelKey] = attr.value
  }

  return props as NewQrCodeProps
}

let registered = false

function ensureCustomElement() {
  if (typeof HTMLElement === "undefined" || typeof customElements === "undefined") {
    return
  }

  if (customElements.get("new-qr-code")) {
    return
  }

  class NewQrCodeElement extends HTMLElement {
    static observedAttributes = [
      "value",
      "module",
      "finder-inner",
      "finder-outer",
      "foreground",
      "background",
      "margin",
      "size",
      "color-mode",
      "palette",
      "motion",
      "motion-preset",
      "gradient",
      "logo",
    ]

    connectedCallback() {
      this.render()
    }

    attributeChangedCallback() {
      this.render()
    }

    render() {
      const props = readPortablePropsFromElement(this)
      this.innerHTML = renderNewQrSvg(props)
    }
  }

  customElements.define("new-qr-code", NewQrCodeElement)
}

export function registerNewQrCodeElement() {
  if (registered) {
    return
  }

  ensureCustomElement()
  registered = true
}

export function emitNewQrCodeAttributes(props: NewQrCodeProps) {
  const attributes: string[] = []

  const entries: Array<[string, unknown]> = [
    ["value", props.value],
    ["level", props.level],
    ["min-version", props.minVersion],
    ["boost-level", props.boostLevel],
    ["aria-label", props.ariaLabel],
    ["module", props.module],
    ["module-size", props.moduleSize],
    ["module-line-width", props.moduleLineWidth],
    ["finder-inner", props.finderInner],
    ["finder-outer", props.finderOuter],
    ["finder-inner-color", props.finderInnerColor],
    ["finder-outer-color", props.finderOuterColor],
    ["finder-inner-gradient", props.finderInnerGradient],
    ["finder-outer-gradient", props.finderOuterGradient],
    ["foreground", props.foreground],
    ["background", props.background],
    ["background-gradient", props.backgroundGradient],
    ["margin", props.margin],
    ["size", props.size],
    ["color-mode", props.colorMode],
    ["palette", props.palette],
    ["motion", props.motion],
    ["motion-preset", props.motionPreset],
    ["gradient", props.gradient],
    ["logo", props.logo],
    ["module-round-size", props.moduleRoundSize],
  ]

  for (const [key, value] of entries) {
    const serialized = serializeAttributeValue(key, value)
    if (serialized === null || serialized === "") {
      continue
    }

    attributes.push(`${key}="${serialized.replaceAll('"', "&quot;")}"`)
  }

  return attributes.join(" ")
}
