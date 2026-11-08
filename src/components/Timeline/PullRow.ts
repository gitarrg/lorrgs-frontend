/*
The row above a dungeon run: its pulls as bands, with a ruler on top.
Each band shows the pull's name ("Pull #n", or the boss) in its top left corner.

Clicking a pull aligns all runs on it (like clicking a boss phase): the same pull (by name) starts
at the same x in every run. Clicking it again resets them all to start at 0.

The phases of a boss fight work the same way (see `get_phase_spans`): the "pulls" are its phases, but
without background: they have no downtime between them, so each label sits on a gradient that fades out.
The ruler is the fight's ruler then (see `Stage.layout_children`).

Drawn by a single shape (bands, ticks and timestamps), so zooming only redraws it.
Everything is positioned through the fight row's `TimeMap`, so cropping and cut out time
is reflected here the same way as on the casts below.
*/

import Konva from "konva"
import type { Context } from "konva/lib/Context"

import * as constants from "./constants"
import { toMMSS } from "../../utils"
import { level_for_scale } from "./ruler_levels"
import { get_pull_color, get_pull_label } from "../../pulls"
import type { Pull } from "../../types/fight"
import type { TimeMapRef } from "./TimeMap"
import { format_duration, get_pull_at, get_time_info, hide_tooltip, show_tooltip, type TooltipInfo } from "./tooltip"
import { RULER_HINTS, clear_phase_selection, is_select_click, select_phase } from "./phase_selection"
import type Stage from "./Stage"
import type { Anchor } from "./Stage"


const HEIGHT = constants.LINE_HEIGHT
const BAND_OPACITY = 0.15
const BAND_OPACITY_SELECTED = 0.6
/** the pull under the pointer (dungeon runs) */
const BAND_OPACITY_HOVER = 0.4
const BACKGROUND = "#1a1a1a"
/** ticks and timestamps: same as the main `Ruler` */
const TEXT_COLOR = "white"
const FONT = "14px Lato"
const TEXT_Y = 11

/** the pull's name in the top left of each band */
const STRIP_HEIGHT = 12
const STRIP_OPACITY = 0.85
/** brightens the name's background of the pull under the pointer (it can be clicked) */
const STRIP_HOVER_HIGHLIGHT = 0.5
const STRIP_FONT = "bold 10px Lato"
const STRIP_TEXT_COLOR = "black"
/** below this width a strip has no text */
const MIN_STRIP_TEXT_WIDTH = 14

/** the pull all runs are aligned on: same as the active phase marker */
const ANCHOR_COLOR = "#00ffff"  // 6 digits: see `rgba`
/** phase labels: under the pointer (same as a hovered phase marker) */
const PHASE_HOVER_COLOR = "#17e67f"
/** phases starting before this (ms) are "on pull": no label */
const MIN_PHASE_START = 1000

/** min. px between two timestamps (eg. left and right of a cut) */
const MIN_TEXT_SPACING = 40


/** "#rrggbb" as "rgba(r, g, b, alpha)" */
function rgba(color: string, alpha: number) {
    const n = parseInt(color.slice(1), 16)
    return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}


export default class PullRow {

    pulls: Pull[]
    time_ref: TimeMapRef
    /** boss of the fight (phases: which phases there are to pick from) */
    private boss_slug?: string
    selected: Set<number> = new Set()
    /** name of the pull the runs are aligned on (see `handle_click`) */
    private anchor_name?: string
    /** index of the pull under the pointer */
    private hovered?: number
    /** the "pulls" are the phases of a boss fight */
    readonly is_phases: boolean
    /** where the runs are aligned on a phase (kind "phase": see `Stage.get_anchor`). ts 0: not aligned */
    private phase_anchor?: { name: string, ts: number }
    /** phases: the "phase markers" display setting. Off: no bands or labels, only the hover highlight */
    private show_phases = true
    /** the phase whose line in a row is under the pointer */
    private hovered_phase?: string

    /** pixels per second */
    private scale_x = constants.DEFAULT_ZOOM

    /** bands and ruler (in the fight's background) */
    shape: Konva.Shape

    /** catches the mouse (in the fight's overlay): tooltip and markers like the main ruler */
    bbox: Konva.Rect

    constructor(pulls: Pull[], time_ref: TimeMapRef, boss_slug?: string) {
        this.boss_slug = boss_slug
        this.pulls = pulls
        this.time_ref = time_ref
        this.is_phases = !!pulls[0]?.name

        this.shape = new Konva.Shape({
            name: "PullRow",
            listening: false,
            transformsEnabled: "position",
            perfectDrawEnabled: false,
            sceneFunc: (context) => this.draw(context),
        })

        this.bbox = new Konva.Rect({
            height: HEIGHT,
            width: 0,  // see `_handle_zoom_change`
            transformsEnabled: "position",
        })
        this.bbox.on("mousemove", () => this.handle_mousemove())
        this.bbox.on("mouseout", () => this.handle_mouseout())
        this.bbox.on("click tap", (event) => this.handle_click(event.evt))
        this.bbox.on("contextmenu", (event) => this.handle_contextmenu(event.evt))
        this.bbox.on("dblclick dbltap", () => (this.bbox.getStage() as Stage | null)?.ruler.add_marker())
    }

    height() {
        return HEIGHT
    }

    /** whether the row is shown (see `set_shown`) */
    is_shown() {
        return this.shape.visible()
    }

    destroy() {
        this.shape.destroy()
        this.bbox.destroy()
    }

    ////////////////////////////////////////////////////////////////////////////
    // Drawing
    //

    private draw(context: Context) {
        const map = this.time_ref.current
        const s = this.scale_x
        const width = map.width(s)
        // the stretches with background: the segments, the gutters (before the crop, at cuts) stay empty
        const spans = map.segment_xs(s)

        // black border at both ends of every segment (also around the gutters)
        context.setAttr("strokeStyle", "black")
        context.setAttr("lineWidth", 1)
        context.beginPath()
        spans.forEach(({ x0, x1 }) => {
            context.moveTo(Math.round(x0) - 0.5, 0)
            context.lineTo(Math.round(x0) - 0.5, HEIGHT + 1)
            context.moveTo(Math.round(x1) + 0.5, 0)
            context.lineTo(Math.round(x1) + 0.5, HEIGHT + 1)
        })
        context.stroke()

        // pulls outside the crop stay outside the row
        context.beginPath()
        spans.forEach(({ x0, x1 }) => context.rect(x0, 0, x1 - x0, HEIGHT + 1))
        context.clip()

        // background (phases: none, the page's)
        if (!this.is_phases) {
            context.setAttr("fillStyle", BACKGROUND)
            spans.forEach(({ x0, x1 }) => context.fillRect(x0, 0, x1 - x0, HEIGHT))
        }

        // pulls that are shown (not cut out)
        const bands = this.pulls
            .map((pull, i) => ({
                pull, i,
                x0: map.to_x(pull.start / 1000, s),
                x1: map.to_x(pull.end / 1000, s),
                color: get_pull_color(pull),
            }))
            .filter(band => band.x1 > band.x0)
            .map(band => ({ ...band, color: this.tint(band.color, band.pull, band.i) }))

        // bands: behind the ticks
        const draw_band = ({ i, x0, x1, color }: typeof bands[number]) => {
            const selected = this.selected.has(i)
            const hovered = !this.is_phases && i === this.hovered
            const alpha = selected ? BAND_OPACITY_SELECTED : hovered ? BAND_OPACITY_HOVER : BAND_OPACITY
            context.setAttr("globalAlpha", this.is_phases ? 1 : alpha)
            if (this.is_phases) {
                // phases: fades out (no downtime between them), unless highlighted
                const highlighted = this.is_highlighted(i)
                const gradient = context.createLinearGradient(x0, 0, x1, 0)
                gradient.addColorStop(0, rgba(color, highlighted ? BAND_OPACITY_SELECTED : alpha))
                gradient.addColorStop(1, rgba(color, highlighted ? BAND_OPACITY_SELECTED : 0))
                context.setAttr("fillStyle", gradient)
            } else {
                context.setAttr("fillStyle", color)
            }
            context.fillRect(x0, 1, x1 - x0, HEIGHT - 1)

            // edges
            context.setAttr("globalAlpha", 1)
            context.setAttr("strokeStyle", color)
            context.setAttr("lineWidth", 2)
            context.beginPath()
            context.moveTo(Math.round(x0) + 0.5, 1)
            context.lineTo(Math.round(x0) + 0.5, HEIGHT)
            context.stroke()
        }
        bands
            // phases: none for P1 (it starts on pull) and none when the phase markers are hidden, unless highlighted
            .filter(({ pull, i }) => !this.is_phases || this.is_highlighted(i) || (pull.start >= MIN_PHASE_START && this.show_phases))
            .forEach(draw_band)
        context.setAttr("globalAlpha", 1)

        // the pull the runs are aligned on: its start
        const anchored = !this.is_phases && bands.find(({ pull, i }) => get_pull_label(pull, i) == this.anchor_name)
        if (anchored) {
            const x = Math.round(anchored.x0) + 0.5
            context.setAttr("strokeStyle", ANCHOR_COLOR)
            context.setAttr("lineWidth", 3)
            context.beginPath()
            context.moveTo(x, 0)
            context.lineTo(x, HEIGHT)
            context.stroke()
        }

        this.draw_ticks(context)

        // names: in front of the ticks
        bands.forEach(({ pull, i, x0, x1, color }) => {
            if (this.is_phases && !this.show_phases) { return }  // (the hover highlight stays)
            if (this.is_phases && pull.start < MIN_PHASE_START && !this.is_highlighted(i)) { return }  // "on pull": no label unless highlighted (the band can still be clicked)
            this.draw_strip(context, get_pull_label(pull, i), color, x0, x1, !this.is_phases && i === this.hovered)
        })

        // bottom line
        context.setAttr("strokeStyle", "black")
        context.beginPath()
        spans.forEach(({ x0, x1 }) => {
            context.moveTo(x0, HEIGHT + 0.5)
            context.lineTo(x1, HEIGHT + 0.5)
        })
        context.stroke()
    }

    /** the pull's name in the top left of its band, on a background as wide as the name */
    private draw_strip(context: Context, text: string, color: string, x0: number, x1: number, hovered = false) {
        const width = x1 - x0

        // name cut short to fit the band (none on very narrow bands)
        context.setAttr("font", STRIP_FONT)
        let label = ""
        if (width >= MIN_STRIP_TEXT_WIDTH) {
            const max_width = width - 6
            label = text
            if (context.measureText(label).width > max_width) {
                while (label.length > 1 && context.measureText(label + "…").width > max_width) {
                    label = label.slice(0, -1)
                }
                label = label + "…"
            }
        }

        // background: only as wide as the name
        const strip_width = label ? Math.min(width, context.measureText(label).width + 6) : width
        context.setAttr("globalAlpha", STRIP_OPACITY)
        context.setAttr("fillStyle", color)
        context.fillRect(x0, 1, strip_width, STRIP_HEIGHT)
        if (hovered) {
            context.setAttr("globalAlpha", STRIP_HOVER_HIGHLIGHT)
            context.setAttr("fillStyle", "white")
            context.fillRect(x0, 1, strip_width, STRIP_HEIGHT)
        }
        context.setAttr("globalAlpha", 1)

        if (!label) { return }
        context.setAttr("fillStyle", STRIP_TEXT_COLOR)
        context.setAttr("textAlign", "left")
        context.setAttr("textBaseline", "middle")
        context.fillText(label, x0 + 3, 1 + STRIP_HEIGHT / 2 + 0.5)
    }

    /** phases: cyan if the runs are aligned on it, green if highlighted (hovered here, or its line in a row) */
    private tint(color: string, pull: Pull, index: number) {
        if (!this.is_phases) { return color }
        if (this.phase_anchor?.ts && this.phase_anchor.name == pull.name) { return ANCHOR_COLOR }
        return this.is_highlighted(index) ? PHASE_HOVER_COLOR : color
    }

    private is_highlighted(index: number) {
        return index === this.hovered || (this.hovered_phase !== undefined && this.hovered_phase == this.pulls[index]?.name)
    }

    /** ticks and timestamps like the main `Ruler`, in run time */
    private draw_ticks(context: Context) {
        const map = this.time_ref.current
        const s = this.scale_x
        const { label, tick } = level_for_scale(s)
        const ticks_per_label = Math.round(label / tick)

        context.setAttr("strokeStyle", TEXT_COLOR)
        context.setAttr("fillStyle", TEXT_COLOR)
        context.setAttr("lineWidth", 1)
        context.setAttr("font", FONT)
        context.setAttr("textAlign", "left")
        context.setAttr("textBaseline", "middle")

        // what the timestamps count from (like the times of the casts, see `TimeMap.label`): intervals of run time, each with its 0:00
        const anchor = this.phase_anchor
        const anchor_span = anchor?.ts ? this.pulls.find(pull => pull.name == anchor.name) : undefined
        const intervals = this.label_intervals(map, anchor_span?.start)

        let last_text_x = -Infinity
        const xs = map.segment_xs(s)
        map.segments.forEach((segment, index) => {
            intervals.forEach(interval => {
                const lo = Math.max(segment.start, interval.start)
                const hi = Math.min(segment.end, interval.end)
                if (hi < lo) { return }

                const first = Math.ceil((lo - interval.origin) / tick - 1e-9)
                const last = Math.floor((hi - interval.origin) / tick + 1e-9)
                for (let i = first; i <= last; i++) {
                    const t = i * tick
                    const x = Math.round(xs[index].x0 + (interval.origin + t - segment.start) * s) + 0.5
                    const big = i % ticks_per_label == 0
                    const h = big ? 10 : 5

                    context.beginPath()
                    context.moveTo(x, HEIGHT - h)
                    context.lineTo(x, HEIGHT)
                    context.stroke()

                    if (big && x - last_text_x >= MIN_TEXT_SPACING) {
                        // starts at the tick, like the main ruler
                        const is_anchor = !!anchor_span && t == 0 && interval.origin == anchor_span.start / 1000
                        if (is_anchor) {
                            context.setAttr("fillStyle", ANCHOR_COLOR)
                            context.setAttr("font", `bold ${FONT}`)
                        }
                        context.fillText(is_anchor ? (anchor_span!.start < MIN_PHASE_START ? "Pull" : anchor!.name) : toMMSS(t), x - 0.5, TEXT_Y)
                        if (is_anchor) {
                            context.setAttr("fillStyle", TEXT_COLOR)
                            context.setAttr("font", FONT)
                        }
                        last_text_x = x
                    }
                }
            })
        })
    }

    /** run time ranges (s) and the run time (s) they count from, for the timestamps setting */
    private label_intervals(map: TimeMap, aligned_start?: number): { start: number, end: number, origin: number }[] {
        const whole = { start: -Infinity, end: Infinity }
        if (map.timestamps == "aligned" && aligned_start !== undefined) { return [{ ...whole, origin: aligned_start / 1000 }] }
        if (map.timestamps != "phase" || !map.phase_ranges.length) { return [{ ...whole, origin: 0 }] }

        // each phase (dungeon run: pull) from its start, in between (and before/after): the run time
        const intervals: { start: number, end: number, origin: number }[] = []
        let t = -Infinity
        map.phase_ranges.forEach(range => {
            if (range.start > t) { intervals.push({ start: t, end: range.start, origin: 0 }) }
            intervals.push({ ...range, origin: range.start })
            t = range.end
        })
        intervals.push({ start: t, end: Infinity, origin: 0 })
        return intervals
    }

    ////////////////////////////////////////////////////////////////////////////
    // Mouse
    //

    /** the run time under the pointer (inverse of the time map) */
    private pointer_time(): number | null {
        const pointer = this.bbox.getRelativePointerPosition()
        if (!pointer) { return null }
        return this.time_ref.current.run_at_x(pointer.x, this.scale_x)
    }

    private handle_mousemove() {
        const stage = this.bbox.getStage() as Stage | null
        if (!stage) { return }

        const t = this.pointer_time()
        if (t === null) { return }
        const map = this.time_ref.current

        // the pull at that time: its name and times
        const info: TooltipInfo = get_time_info(this.time_ref, t)
        const found = get_pull_at(this.pulls, t)
        if (found) {
            const { pull, index } = found
            const start = pull.start / 1000  // (run time, whatever the timestamps setting)
            const duration = (pull.end - pull.start) / 1000
            const end = start + map.display_length(pull.start / 1000, duration)
            info.title = get_pull_label(pull, index)
            info.time_detail = `(${format_duration(t - pull.start / 1000)} in)`
            info.time_pull = undefined
            info.title_color = get_pull_color(pull)
            info.title_detail = `${toMMSS(start)} - ${toMMSS(end)} (${format_duration(duration)})`
        }

        if (this.is_phases && found) { info.hints = RULER_HINTS }

        // anchor above the pointer
        const container = stage.container().getBoundingClientRect()
        const pointer = stage.getPointerPosition()!
        show_tooltip(info, { x: container.x + pointer.x, y: container.y + this.bbox.getAbsolutePosition().y })
        stage.container().style.cursor = found ? "pointer" : "default"
        this.set_hovered(found?.index)
    }

    private handle_mouseout() {
        hide_tooltip()
        const stage = this.bbox.getStage()
        if (stage) { stage.container().style.cursor = "default" }
        this.set_hovered(undefined)
    }

    /** redraws the row only if the pull under the pointer changed */
    private set_hovered(index: number | undefined) {
        if (index === this.hovered) { return }
        this.hovered = index
        this.peek_phase(index)
        this.shape.getLayer()?.batchDraw()
    }

    /** phases: show the start and end markers of the phase under the pointer in the rows (also if hidden) */
    private peek_phase(index: number | undefined) {
        if (!this.is_phases) { return }
        const names = index === undefined ? [] : [this.pulls[index]?.name, this.pulls[index + 1]?.name].filter((name): name is string => !!name)
        const stage = this.bbox.getStage() as Stage | null
        stage?.handle_event(constants.EVENT_PHASE_PEEK, { names })
    }

    /** align all runs on the pull under the pointer, or reset them if they already are */
    private handle_click(event?: MouseEvent | TouchEvent) {
        const stage = this.bbox.getStage() as Stage | null
        if (!stage) { return }

        const t = this.pointer_time()
        if (t === null) { return }
        const found = get_pull_at(this.pulls, t)
        if (!found) { return }

        // phases, with Ctrl/Cmd/Shift: select it (dims the others) instead of aligning on it
        if (this.is_phases && event && "shiftKey" in event && is_select_click(event)) {
            select_phase(this.boss_slug, found.pull.name!, event)
            return
        }

        const name = get_pull_label(found.pull, found.index)
        const kind = this.is_phases ? "phase" : "pull"
        const current = stage.get_anchor()
        if (current.kind == kind && current.name == name && current.ts) {
            stage.set_anchor(0, "pull")
        } else {
            // where the pull starts in this run now: it stays in place, the other runs move to it
            const row_x = this.bbox.getParent()?.x() ?? 0
            const x = row_x + this.time_ref.current.to_x(found.pull.start / 1000, this.scale_x)
            stage.set_anchor(x / this.scale_x, name, kind)
        }
    }

    /** right click on the ruler of phases: back to all phases */
    private handle_contextmenu(event: MouseEvent) {
        if (!this.is_phases) { return }
        event.preventDefault()
        clear_phase_selection()
    }

    private handle_anchor_changed({ ts, name, kind }: Anchor) {
        this.anchor_name = kind == "pull" ? name : undefined
        this.phase_anchor = kind == "phase" ? { name, ts } : undefined
    }

    /** show or hide the row (eg. only the first fight of a spec ranking has one) */
    set_shown(state: boolean) {
        this.shape.visible(state)
        this.bbox.visible(state)
    }

    ////////////////////////////////////////////////////////////////////////////
    // Events
    //

    set_selected(indices: number[]) {
        this.selected = new Set(indices)
    }

    _handle_zoom_change(scale_x: number) {
        this.scale_x = scale_x
        this.bbox.width(this.time_ref.current.width(scale_x))
    }

    handle_event(event_name: string, payload: any) {
        if (event_name === constants.EVENT_ZOOM_CHANGE) { this._handle_zoom_change(payload) }
        if (event_name === constants.EVENT_ANCHOR_CHANGED) { this.handle_anchor_changed(payload) }
        if (event_name === constants.EVENT_DISPLAY_SETTINGS) { this.handle_display_settings(payload) }
        if (event_name === constants.EVENT_PHASE_HOVER && this.is_phases) { this.handle_phase_hover(payload) }
    }

    private handle_display_settings(settings: { show_phases?: boolean }) {
        const show = settings.show_phases ?? true
        if (show === this.show_phases) { return }
        this.show_phases = show
        this.shape.getLayer()?.batchDraw()
    }

    private handle_phase_hover({ state, name }: { state: boolean, name: string }) {
        this.hovered_phase = state ? name : undefined
        this.shape.getLayer()?.batchDraw()
    }
}
