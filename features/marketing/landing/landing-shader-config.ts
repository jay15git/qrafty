/** Matches carousel wheel radius (`--R` in landing-card-wheel). */
export const LANDING_SHADER_ARC_RADIUS = "max(780px, 64vw)";

/** Matches carousel wheel inset (`top: calc(12vh + var(--R))`). */
const LANDING_SHADER_WHEEL_OFFSET = "12vh";

/**
 * Mirror of the card-wheel hub. Wheel hub sits `12vh + R` below the carousel
 * top; this hub sits `12vh + R` above the hero bottom so both arcs share R
 * and face each other across the join.
 */
export const LANDING_SHADER_ARC_CENTER_Y = `calc(100% - ${LANDING_SHADER_WHEEL_OFFSET} - ${LANDING_SHADER_ARC_RADIUS})`;

/**
 * Alpha mask on the shader host — true falloff, not a page-colored wash.
 * Opaque to 60% of R, fades to transparent at the rim.
 * Widen/shrink the fade by moving the 60% stop.
 */
export const LANDING_SHADER_EDGE_FADE = `radial-gradient(circle ${LANDING_SHADER_ARC_RADIUS} at 50% ${LANDING_SHADER_ARC_CENTER_Y}, #000 0%, #000 60%, transparent 100%)`;
