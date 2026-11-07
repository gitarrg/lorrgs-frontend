/**
 * Available ruler resolutions, from fine to coarse.
 * `label`: seconds between timestamps, `tick`: seconds between ticks.
 * `label` must be a multiple of `tick`.
 */
export const LEVELS = [
    { label: 1, tick: 0.5 },
    { label: 5, tick: 1 },
    { label: 15, tick: 5 },
    { label: 30, tick: 10 },
    { label: 60, tick: 15 },
    { label: 120, tick: 30 },
    { label: 300, tick: 60 },
    { label: 600, tick: 120 },
]

export type RulerLevel = typeof LEVELS[number]

/** Minimum distance between two timestamps in px. At the default zoom (4px/s) this results in 30s steps (120px). */
export const MIN_LABEL_SPACING = 80


/** Pick the finest level whose timestamps are at least `MIN_LABEL_SPACING` apart. */
export function level_for_scale(scale_x: number): RulerLevel {
    return LEVELS.find(level => level.label * scale_x >= MIN_LABEL_SPACING) ?? LEVELS[LEVELS.length - 1]
}
