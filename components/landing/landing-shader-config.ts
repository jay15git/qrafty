/** Matches carousel wheel radius (`--R` in landing-card-wheel). */
export const LANDING_SHADER_ARC_RADIUS = "max(780px, 64vw)"

/** Matches carousel wheel inset (`top: calc(12vh + var(--R))`). */
export const LANDING_SHADER_WHEEL_OFFSET = "12vh"

/**
 * Mirror of the card-wheel hub. Wheel hub sits `12vh + R` below the carousel
 * top; this hub sits `12vh + R` above the hero bottom so both arcs share R
 * and face each other across the join.
 */
export const LANDING_SHADER_ARC_CENTER_Y = `calc(100% - ${LANDING_SHADER_WHEEL_OFFSET} - ${LANDING_SHADER_ARC_RADIUS})`

/** Soft lip only — keep the shader fill, fade the last % of the circle into page ground. */
export const LANDING_SHADER_FADE_OVERLAY = `radial-gradient(circle ${LANDING_SHADER_ARC_RADIUS} at 50% ${LANDING_SHADER_ARC_CENTER_Y}, transparent 0%, transparent 92%, rgba(239, 238, 236, 0.55) 97%, #efeeec 100%)`
