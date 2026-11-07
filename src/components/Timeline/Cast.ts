
import Konva from "konva"
import type { Context } from "konva/lib/Context"

import * as constants from "./constants"
import store from "./../../store/store"
import { toMMSS } from "../../utils"
import type Spell from "../../types/spell"
import type CastType from "../../types/cast"
import type Stage from "./Stage"
import { IDENTITY_REF, type TimeMapRef } from "./TimeMap"
import { format_duration, get_time_info, show_tooltip, type TooltipInfo } from "./tooltip"

/** simple cache to reuse existing images */
export const IMAGES: {[key: number]: HTMLImageElement} = {}

function get_image(spell: Spell) {
    if (IMAGES[spell.spell_id] === undefined) {
        IMAGES[spell.spell_id] = new Image()
        IMAGES[spell.spell_id].src = spell.icon_path
    }
    return IMAGES[spell.spell_id]
}


// Layout of a cast
const BAR_HEIGHT = constants.LINE_HEIGHT - 1
const ICON_X = 3.5 // padding
const ICON_SIZE = 20
const TEXT_X = 27

/** extra width of the hit area past the end of the text */
const TEXT_PADDING = 3


const CAST_TEXT_FONT = "14px Lato"
const CAST_TEXT_FONT_BOLD = "bold 14px Lato"

/** widths of already measured texts (only filled once the font is loaded, the fallback font has other widths) */
const TEXT_WIDTHS: { [text: string]: number } = {}
let measure_context: CanvasRenderingContext2D | null = null

function measure_text(text: string) {
    if (TEXT_WIDTHS[text] !== undefined) { return TEXT_WIDTHS[text] }

    if (!measure_context) {
        measure_context = document.createElement("canvas").getContext("2d")!
        measure_context.font = CAST_TEXT_FONT
    }
    const width = measure_context.measureText(text).width

    if (document.fonts?.check(CAST_TEXT_FONT) ?? true) { TEXT_WIDTHS[text] = width }
    return width
}


/**
 * A single cast: cooldown bar, duration bar, icon and cast time, drawn by one shape.
 * (one node instead of six: Konva's per-node setup dominated building the timeline)
 */
export default class Cast extends Konva.Shape {

    spell_id: number
    timestamp: number
    _duration = 0
    spell: Spell

    hovering: boolean
    selected: boolean

    private counter?: number

    /** the cast of the same spell before this one, by the same player (see `Player`) */
    previous?: Cast

    /** where on the row the cast goes (see `TimeMap`) */
    time_ref: TimeMapRef

    /** false while neither the cast nor its bars are shown on the row */
    in_range = true

    /**
     * Run time (s) the cast is drawn from: its own time, or where its bars come into view
     * when it was cast before the shown time (before the first selected pull, or in a cut-out gap).
     */
    private shown_from = 0

    /** cast before the shown time, but its bars reach into it: drawn from `shown_from`, without its time */
    private carried = false

    /** carried: the segment it comes into view in. Its icon goes in the gap before it (see `TimeMap.gaps`) */
    gap_index: number | null = null

    /** position in that gap (0: next to the segment), set by `Player.update_gutter_slots` */
    gutter_slot: number | null = null

    /** carried, but a later cast of the same spell is carried into the same gap: not drawn */
    superseded = false

    // default opacity (might be different for procs)
    _default_opacity: number = 1.0

    private image?: HTMLImageElement
    private text = ""
    private text_width = 0
    private has_cooldown = false

    // widths of the bars in display time (s): time cut out of the row doesn't count
    private cooldown_width = 0
    private duration_width = 0

    // the same in px (see `_handle_zoom_change`): bars crossing a gap include it
    private cooldown_px = 0
    private duration_px = 0

    // which parts are shown (see `_handle_display_settings`)
    private show_icon = true
    private show_text = true
    private show_cooldown = true
    private show_duration = true

    // style of the parts (see `update_style`)
    private cooldown_opacity = 0.1
    private duration_opacity = 0.5
    private icon_opacity = 1.0
    private icon_stroke = true
    private text_bold = false
    private text_fill = "white"


    constructor(cast_data: CastType, time_ref: TimeMapRef = IDENTITY_REF) {
        super({
            name: "Cast",
            y: 1, // for the background stroke
            listening: true,
            transformsEnabled: "position",
            perfectDrawEnabled: false,
        })

        // get redux store
        const state = store.getState()

        // Cast & Spell Info
        this.time_ref = time_ref
        this.spell_id = cast_data.id;
        this.timestamp = cast_data.ts / 1000;
        this.spell = state.spells.all_spells[this.spell_id];
        this._duration = cast_data?.d ? cast_data.d /1000 : this.spell?.duration

        // Internal Attrs
        this.hovering = false
        this.selected = false // cached value to avoid reading from redux all the time

        // guess we are done here
        if (!this.spell) { return }

        this.image = get_image(this.spell)
        this.counter = cast_data.counter
        this.has_cooldown = !!this.spell.cooldown

        // Dim procs
        if ( this.is_proc(cast_data) )
        {
            this._default_opacity = 0.5
            this.opacity(this._default_opacity)
            this.has_cooldown = false
        }
        this.update_time()

        let show = state.spells.spell_display[this.spell_id]
        show = (show === undefined) ? this.spell.show : show
        this.visible(show)

    }

    /** Apply the current time map: bar widths and the times shown (position: see `_handle_zoom_change`) */
    update_time() {
        const map = this.time_ref.current

        const t = this.timestamp
        const cooldown = this.has_cooldown ? (this.spell?.cooldown || 0) : 0
        const duration = this._duration || 0

        const from = map.first_shown(t, t + Math.max(cooldown, duration))
        this.in_range = from !== null
        this.shown_from = from ?? t
        this.carried = from !== null && from > t
        this.gap_index = this.carried ? map.segment_index(this.shown_from) : null

        // the part of each bar from `shown_from` on
        const bar_width = (length: number) => Math.max(0, map.to_display(t + length) - map.to_display(this.shown_from))
        this.cooldown_width = bar_width(cooldown)
        this.duration_width = bar_width(duration)

        if (!this.spell) { return }
        const time = map.label(this.timestamp)
        const text = toMMSS(time)
        if (text !== this.text) {
            this.text = text
            this.text_width = measure_text(this.text)
        }
    }

    /** time, spell, and the time since the previous cast and since it was ready again */
    get_tooltip(): TooltipInfo {
        const lines: TooltipInfo["lines"] = []

        if (this.previous) {
            const since = this.timestamp - this.previous.timestamp
            lines.push({ value: format_duration(since), label: "since the last cast" })

            const cooldown = this.spell.cooldown || 0
            const late = since - cooldown
            if (cooldown && late >= 1) { lines.push({ value: format_duration(late), label: "after it was ready" }) }
            else if (cooldown && late > -1) { lines.push({ value: "", label: "as soon as it was ready" }) }
        }

        const time_info = get_time_info(this.time_ref, this.timestamp)
        if (this.carried) {
            // pull time has no value for time that isn't shown: use the run time
            time_info.time = toMMSS(this.timestamp)
            lines.unshift({ value: format_duration(this.shown_from - this.timestamp), label: "before the shown time" })
        }

        return {
            ...time_info,
            icon: this.spell.icon_path,
            title: this.spell.name + (this.counter ? ` #${this.counter}` : ""),
            title_color: this.spell.color || undefined,
            lines,
        }
    }

    /**
     * @param cast_data
     * @returns Boolean True if a Cast is a Proc
     */
    is_proc(cast_data: CastType) {
        // no duration --> can't be a proc
        if (!cast_data.d) { return false }

        const reg_duration = this.spell?.duration || 0 // regular cast duration

        // longer than regular --> prob normal cast + proc
        // so proc yes.. but also regular cast. Pref to categorize as regular cast in this case
        if (cast_data.d > reg_duration) { return false}

        // more than 3sec diff to regular duration
        return (Math.abs(cast_data.d - reg_duration) > 3)
    }

    ////////////////////////////////////////////////////////////////////////////
    // Drawing
    //

    /** whether a carried cast still shows a bar (else there is nothing to tie its icon to) */
    has_visible_bar() {
        return (this.show_cooldown && this.has_cooldown && this.cooldown_width > 0)
            || (this.show_duration && this.duration_width > 0)
    }

    /** carried, but nothing to show: no bar left, or a later cast of the spell is shown instead */
    private hidden_carried() {
        return this.carried && (this.superseded || !this.has_visible_bar())
    }

    _sceneFunc(context: Context) {
        if (this.hidden_carried()) { return }
        const alpha = context._context.globalAlpha // the cast's own opacity, set by Konva

        if (this.show_cooldown && this.has_cooldown) {
            context.setAttr("globalAlpha", alpha * this.cooldown_opacity)
            context.setAttr("fillStyle", this.spell.color)
            context.fillRect(0, 0, this.cooldown_px, BAR_HEIGHT)
        }

        if (this.show_duration && this._duration) {
            context.setAttr("globalAlpha", alpha * this.duration_opacity)
            context.setAttr("fillStyle", this.spell.color)
            context.fillRect(0, 0, this.duration_px, BAR_HEIGHT)
        }

        if (this.show_icon) {
            // carried: in the gap before the segment
            const x = this.in_gutter() ? this.gutter_icon_x() : ICON_X
            context.setAttr("globalAlpha", alpha * this.icon_opacity)
            if (this.icon_stroke) {
                context.setAttr("lineWidth", 1)
                context.setAttr("strokeStyle", "black")
                context.strokeRect(x, ICON_X, ICON_SIZE, ICON_SIZE)
            }
            if (this.image?.complete && this.image.naturalWidth) {
                context.drawImage(this.image, x, ICON_X, ICON_SIZE, ICON_SIZE)
            }
        }

        if (this.show_text && !this.carried) {
            context.setAttr("globalAlpha", alpha)
            context.setAttr("font", this.text_bold ? CAST_TEXT_FONT_BOLD : CAST_TEXT_FONT)
            context.setAttr("textBaseline", "middle")
            context.setAttr("textAlign", "left")
            context.setAttr("fillStyle", this.text_fill)
            context.fillText(this.text, TEXT_X, constants.LINE_HEIGHT / 2)
        }
    }

    /** The area that receives mouse events: the visible label parts, else the duration bar. */
    _hitFunc(context: Context) {
        if (this.hidden_carried()) { return }

        // carried: its icon in the gap, else its bars
        if (this.in_gutter() && this.show_icon) {
            context.setAttr("fillStyle", this.colorKey)
            context.fillRect(this.gutter_icon_x() - 1, 0, ICON_SIZE + 2, BAR_HEIGHT)
            return
        }
        const show_text = this.show_text && !this.carried

        let width = 0
        if (show_text) { width = TEXT_X + this.text_width + TEXT_PADDING }
        else if (this.show_icon) { width = TEXT_X }
        else if (this.show_duration) { width = this.duration_px }
        if (!width) { return }

        // with the icon hidden, the text starts at the same place
        const x = (this.show_icon || !show_text) ? 0 : TEXT_X
        context.setAttr("fillStyle", this.colorKey)
        context.fillRect(x, 0, width - x, BAR_HEIGHT)
    }

    /** whether the icon goes in the gap before its segment */
    private in_gutter() {
        return this.carried && this.gutter_slot !== null
    }

    /** x of the icon in the gap (left of the segment, slot 0 next to it) */
    private gutter_icon_x() {
        return -constants.GUTTER_PADDING - (this.gutter_slot! + 1) * constants.GUTTER_SLOT + (constants.GUTTER_SLOT - ICON_SIZE) / 2
    }

    update_style() {

        if (!this.visible()) { return;}

        const stage  = this.getStage() as Stage | null
        if (!stage) { return}

        // default state
        this.text_bold = false
        this.text_fill = "white"
        this.duration_opacity = 0.5
        this.cooldown_opacity = 0.1
        this.icon_opacity = 1.0
        this.icon_stroke = true
        this.opacity(this._default_opacity)

        if (stage.has_selection) {
            if (this.selected) {
                this.text_bold = true
                this.duration_opacity = 0.85
                this.cooldown_opacity = 0.4
            } else {
                this.opacity(.5)
                this.text_fill = "#ccc"
                this.icon_opacity = 0.5
                this.icon_stroke = false
            }
        }
    }

    ////////////////////////////////////////////////////////////////////////////
    // Events
    //

    _handle_display_settings(settings: { [key: string]: boolean}) {
        this.show_icon = settings.show_casticon
        this.show_text = settings.show_casttime
        this.show_cooldown = settings.show_cooldown
        this.show_duration = settings.show_duration
    }

    _handle_zoom_change(scale_x: number) {
        const map = this.time_ref.current
        const x = map.to_x(this.shown_from, scale_x)
        const bar_px = (length: number) => length > 0 ? Math.max(0, map.to_x(this.timestamp + length, scale_x) - x) : 0
        this.x(x)
        this.cooldown_px = this.has_cooldown ? bar_px(this.spell?.cooldown || 0) : 0
        this.duration_px = bar_px(this._duration || 0)
    }

    /** @returns true if the cast was shown or hidden */
    _handle_spell_display(payload: { [key: number]: boolean }) {
        const visible = payload[this.spell_id] !== false
        const was_visible = this.visible()
        if (visible === was_visible) { return false }

        this.visible(visible)
        if (visible) { this.update_style() }
        return true
    }

    _handle_spell_selected(payload: number[]) {
        this.selected = payload.includes(this.spell_id)
        this.update_style()
    }

    handle_event(event_name: string, payload: any) {

        // FIXME: this causes issues when you unhide a spell, where it does not have the latest events applied.
        // if (!this.visible()) { return} // no need to process the following events
        if (event_name === constants.EVENT_ZOOM_CHANGE) {this._handle_zoom_change(payload)}
        if (event_name === constants.EVENT_DISPLAY_SETTINGS) (this._handle_display_settings(payload))
        if (event_name === constants.EVENT_SPELL_SELECTED) (this._handle_spell_selected(payload))
    }

    ////////////////////////////////////////////////////////////////////////////
    // Mouse Events
    //
    hover(hovering: boolean) {

        this.hovering = hovering;

        // update cursor
        const stage = this.getStage() as Stage | null
        if (!stage) { return }
        stage.container().style.cursor = this.hovering ? "pointer" : "grab";

        //////////////////
        // handle tooltip
        const position = this.absolutePosition()

        // add stage global position
        const container = stage.container()
        const container_position = container.getBoundingClientRect()
        position.x += container_position.x
        position.y += container_position.y

        position.x += ICON_X + (ICON_SIZE / 2) // center above the icon
        show_tooltip(this.hovering ? this.get_tooltip() : "", position)
    }

    select(event: Konva.KonvaEventObject<MouseEvent>) {
        store.dispatch({
            type: constants.EVENT_SPELL_SELECTED,
            payload: {
                spell_id: this.spell_id,
                selected: !this.selected,
                deselect_others: !event.evt.ctrlKey,
            },
        })
    }

    handle_mousedown(event: Konva.KonvaEventObject<MouseEvent>) {
        event.evt.preventDefault()

        if (event.evt.button == 0) {
            return this.select(event)
        }
    }
}
