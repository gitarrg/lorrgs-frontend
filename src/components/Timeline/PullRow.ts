/*
The row above a dungeon run: its pulls as bands, with a ruler on top.
Each band shows the pull's name ("Pull #n", or the boss) in its top left corner.

Clicking a pull aligns all runs on it (like clicking a boss phase): the same pull (by name) starts
at the same x in every run. Clicking it again resets them all to start at 0.

Drawn by a single shape (bands, ticks and timestamps), so zooming only redraws it.
Everything is positioned through the fight row's `TimeMap`, so cropping and cut out time
is reflected here the same way as on the casts below.
*/

import Konva from "konva"
import type { Context } from "konva/lib/Context"

import * as constants from "./constants"
import { toMMSS } from "../../utils"
import { level_for_scale } from "./ruler_levels"
import { BOSS_PULL_COLOR, PULL_COLOR, get_pull_label } from "../../pulls"
import type { Pull } from "../../types/fight"
import type { TimeMapRef } from "./TimeMap"
import { format_duration, get_pull_at, get_time_info, hide_tooltip, show_tooltip, type TooltipInfo } from "./tooltip"
import type Stage from "./Stage"
import type { Anchor } from "./Stage"


const HEIGHT = constants.LINE_HEIGHT
const BAND_OPACITY = 0.2
const BAND_OPACITY_SELECTED = 0.6
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
const ANCHOR_COLOR = "#0FF"

/** min. px between two timestamps (eg. left and right of a cut) */
const MIN_TEXT_SPACING = 40


export default class PullRow {

    pulls: Pull[]
    time_ref: TimeMapRef
    selected: Set<number> = new Set()
    /** name of the pull the runs are aligned on (see `handle_click`) */
    private anchor_name?: string
    /** index of the pull under the pointer */
    private hovered?: number

    /** pixels per second */
    private scale_x = constants.DEFAULT_ZOOM

    /** bands and ruler (in the fight's background) */
    shape: Konva.Shape

    /** catches the mouse (in the fight's overlay): tooltip and markers like the main ruler */
    bbox: Konva.Rect

    constructor(pulls: Pull[], time_ref: TimeMapRef) {
        this.pulls = pulls
        this.time_ref = time_ref

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
        this.bbox.on("click tap", () => this.handle_click())
        this.bbox.on("dblclick dbltap", () => (this.bbox.getStage() as Stage | null)?.ruler.add_marker())
    }

    height() {
        return HEIGHT
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

        // background
        context.setAttr("fillStyle", BACKGROUND)
        spans.forEach(({ x0, x1 }) => context.fillRect(x0, 0, x1 - x0, HEIGHT))

        // pulls that are shown (not cut out)
        const bands = this.pulls
            .map((pull, i) => ({
                pull, i,
                x0: map.to_x(pull.start / 1000, s),
                x1: map.to_x(pull.end / 1000, s),
                color: pull.boss ? BOSS_PULL_COLOR : PULL_COLOR,
            }))
            .filter(band => band.x1 > band.x0)

        // bands: behind the ticks
        bands.forEach(({ i, x0, x1, color }) => {
            const selected = this.selected.has(i)
            context.setAttr("globalAlpha", selected ? BAND_OPACITY_SELECTED : BAND_OPACITY)
            context.setAttr("fillStyle", color)
            context.fillRect(x0, 1, x1 - x0, HEIGHT - 1)

            // edges
            context.setAttr("globalAlpha", 1)
            context.setAttr("strokeStyle", color)
            context.setAttr("lineWidth", 2)
            context.beginPath()
            context.moveTo(Math.round(x0) + 0.5, 1)
            context.lineTo(Math.round(x0) + 0.5, HEIGHT)
            context.stroke()
        })
        context.setAttr("globalAlpha", 1)

        // the pull the runs are aligned on: its start
        const anchored = bands.find(({ pull, i }) => get_pull_label(pull, i) == this.anchor_name)
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
        bands.forEach(({ pull, i, x0, x1, color }) => this.draw_strip(context, get_pull_label(pull, i), color, x0, x1, i === this.hovered))

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

    /** ticks and timestamps like the main `Ruler`, in the labels of the time map (run or pull time) */
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

        let last_text_x = -Infinity
        const xs = map.segment_xs(s)
        map.label_ranges().forEach((range, index) => {
            const first = Math.ceil(range.label / tick)
            const last = Math.floor((range.label + (range.end - range.start)) / tick)

            for (let i = first; i <= last; i++) {
                const t = i * tick
                const x = Math.round(xs[index].x0 + (t - range.label) * s) + 0.5
                const big = i % ticks_per_label == 0
                const h = big ? 10 : 5

                context.beginPath()
                context.moveTo(x, HEIGHT - h)
                context.lineTo(x, HEIGHT)
                context.stroke()

                if (big && x - last_text_x >= MIN_TEXT_SPACING) {
                    // starts at the tick, like the main ruler
                    context.fillText(toMMSS(t), x - 0.5, TEXT_Y)
                    last_text_x = x
                }
            }
        })
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
            const start = map.label(pull.start / 1000)
            const duration = (pull.end - pull.start) / 1000
            const end = start + map.display_length(pull.start / 1000, duration)
            info.title = get_pull_label(pull, index)
            info.time_detail = `(${format_duration(t - pull.start / 1000)} in)`
            info.time_pull = undefined
            info.title_color = pull.boss ? BOSS_PULL_COLOR : PULL_COLOR
            info.title_detail = `${toMMSS(start)} - ${toMMSS(end)} (${format_duration(duration)})`
        }

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
        this.shape.getLayer()?.batchDraw()
    }

    /** align all runs on the pull under the pointer, or reset them if they already are */
    private handle_click() {
        const stage = this.bbox.getStage() as Stage | null
        if (!stage) { return }

        const t = this.pointer_time()
        if (t === null) { return }
        const found = get_pull_at(this.pulls, t)
        if (!found) { return }

        const name = get_pull_label(found.pull, found.index)
        const current = stage.get_anchor()
        if (current.kind == "pull" && current.name == name) {
            stage.set_anchor(0, "pull")
        } else {
            // where the pull starts in this run now: it stays in place, the other runs move to it
            const row_x = this.bbox.getParent()?.x() ?? 0
            const x = row_x + this.time_ref.current.to_x(found.pull.start / 1000, this.scale_x)
            stage.set_anchor(x / this.scale_x, name, "pull")
        }
    }

    private handle_anchor_changed({ name, kind }: Anchor) {
        this.anchor_name = kind == "pull" ? name : undefined
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
    }
}
