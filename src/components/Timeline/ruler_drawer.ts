/*
Draws the ticks and time labels of a ruler: shared by the main `Ruler` and the `PullRow`s.

A ruler is a list of "runs". Each run covers a stretch of time `from` - `to` (s, relative to where
its labels count from) and says where on the canvas a time is (`x`). The main ruler has one run
(linear in time), a cropped or cut row one per segment (and per stretch of time with its own 0:00).

Which ticks there are depends on the zoom (see `ruler_levels`): small ticks in between, and big ticks with a label.
Labels start at their tick, and are skipped when they would overlap the one before.

Framework free: draws on anything with the few canvas methods of `RulerContext` (Konva's `Context` does).
*/

import { toMMSS } from "../../utils"
import { LEVELS, level_for_scale, MIN_LABEL_SPACING, type RulerLevel } from "./ruler_levels"


/** the canvas methods used (a subset of Konva's `Context`) */
export interface RulerContext {
    setAttr(attr: string, value: any): void
    beginPath(): void
    moveTo(x: number, y: number): void
    lineTo(x: number, y: number): void
    stroke(): void
    fillText(text: string, x: number, y: number): void
}


export interface RulerStyle {
    /** px: where ticks end (their bottom edge) */
    height: number
    color: string
    /** css font of the labels */
    font: string
    /** px: the labels' vertical centre */
    text_y: number
    /** px: height of the ticks with and without a label */
    big_tick: number
    small_tick: number
    /** min. px between the start of two labels (eg. left and right of a cut) */
    min_text_spacing: number
    /** the resolutions to choose from (see `level_for_scale`) */
    levels: RulerLevel[]
    /** min. px between two labels, when picking the resolution */
    min_label_spacing: number
}


export const DEFAULT_STYLE: RulerStyle = {
    height: 28,
    color: "white",
    font: "14px Lato",
    text_y: 11,
    big_tick: 10,
    small_tick: 5,
    min_text_spacing: 40,
    levels: LEVELS,
    min_label_spacing: MIN_LABEL_SPACING,
}


/** a stretch of the ruler */
export interface RulerRun {
    /** time range (s) of its ticks, as counted by the labels. Ticks sit on multiples of the level's `tick`. */
    from: number
    to: number
    /** px of a time (s) */
    x(t: number): number
}


export interface RulerTick {
    /** number of ticks from 0 (negative: before it) */
    i: number
    /** time (s) */
    t: number
    /** a tick with a label */
    big: boolean
}


/** how to write a label. `color` and `font` replace the style's, for this label only. */
export interface RulerLabel {
    text: string
    color?: string
    font?: string
}


/** text of the label at time `t` of a run. Default: "mm:ss" */
export type LabelFunction<R extends RulerRun> = (t: number, run: R) => string | RulerLabel


/** The ticks on [`from`, `to`] (s). Integer indices keep sub-second ticks free of float drift. */
export function get_ticks(from: number, to: number, level: RulerLevel): RulerTick[] {
    const per_label = Math.round(level.label / level.tick)
    const first = Math.ceil(from / level.tick - 1e-9) || 0  // (not -0)
    const last = Math.floor(to / level.tick + 1e-9)

    const ticks: RulerTick[] = []
    for (let i = first; i <= last; i++) {
        ticks.push({ i, t: i * level.tick, big: i % per_label == 0 })
    }
    return ticks
}


export default class RulerDrawer<R extends RulerRun = RulerRun> {

    readonly style: RulerStyle

    constructor(style: Partial<RulerStyle> = {}) {
        this.style = { ...DEFAULT_STYLE, ...style }
    }

    /** the resolution for a zoom (px per second) */
    level(scale: number): RulerLevel {
        return level_for_scale(scale, this.style.levels, this.style.min_label_spacing)
    }

    /** Draw all `runs` (in order of x: labels are spaced against the one before). `scale`: px per second. */
    draw(context: RulerContext, runs: R[], scale: number, label: LabelFunction<R> = t => toMMSS(t)) {
        const { height, color, font, text_y, big_tick, small_tick, min_text_spacing } = this.style
        const level = this.level(scale)

        // ticks: one path
        const labels: { x: number, text: RulerLabel }[] = []
        let last_text_x = -Infinity

        context.setAttr("strokeStyle", color)
        context.setAttr("lineWidth", 1)
        context.beginPath()
        runs.forEach(run => {
            get_ticks(run.from, run.to, level).forEach(({ t, big }) => {
                const x = Math.round(run.x(t)) + 0.5
                context.moveTo(x, height - (big ? big_tick : small_tick))
                context.lineTo(x, height)

                if (big && x - last_text_x >= min_text_spacing) {
                    const text = label(t, run)
                    labels.push({ x, text: typeof text == "string" ? { text } : text })
                    last_text_x = x
                }
            })
        })
        context.stroke()

        // labels: start at their tick
        context.setAttr("fillStyle", color)
        context.setAttr("font", font)
        context.setAttr("textAlign", "left")
        context.setAttr("textBaseline", "middle")
        labels.forEach(({ x, text }) => {
            const styled = !!(text.color || text.font)
            if (styled) {
                context.setAttr("fillStyle", text.color ?? color)
                context.setAttr("font", text.font ?? font)
            }
            context.fillText(text.text, x - 0.5, text_y)
            if (styled) {
                context.setAttr("fillStyle", color)
                context.setAttr("font", font)
            }
        })
    }
}
