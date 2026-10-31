
import Konva from "konva"
import type { Context } from "konva/lib/Context"

import * as constants from "./constants"
import store from "./../../store/store"
import { toMMSS } from "../../utils"
import type Spell from "../../types/spell"
import type CastType from "../../types/cast"
import type Stage from "./Stage"

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

    tooltip_content?: string

    // default opacity (might be different for procs)
    _default_opacity: number = 1.0

    /** pixels per second */
    private scale_x = constants.DEFAULT_ZOOM

    private image?: HTMLImageElement
    private text = ""
    private text_width = 0
    private has_cooldown = false

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


    constructor(cast_data: CastType) {
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
        this.text = toMMSS(this.timestamp)
        this.text_width = measure_text(this.text)
        this.has_cooldown = !!this.spell.cooldown

        // Dim procs
        if ( this.is_proc(cast_data) )
        {
            this._default_opacity = 0.5
            this.opacity(this._default_opacity)
            this.has_cooldown = false
        }

        let show = state.spells.spell_display[this.spell_id]
        show = (show === undefined) ? this.spell.show : show
        this.visible(show)

        // prepare the tooltip content, as it doesn't change
        this.tooltip_content = `${this.spell.name}`
        this.tooltip_content += cast_data.counter ? ` #${cast_data.counter}` : ""
        this.tooltip_content += "<br>"
        this.tooltip_content += `${toMMSS(this.timestamp)}`
        if (this._duration > 0) {
            let end_time = this.timestamp + this._duration;
            this.tooltip_content += ` - ${toMMSS(end_time)}`
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

    _sceneFunc(context: Context) {
        const alpha = context._context.globalAlpha // the cast's own opacity, set by Konva

        if (this.show_cooldown && this.has_cooldown) {
            context.setAttr("globalAlpha", alpha * this.cooldown_opacity)
            context.setAttr("fillStyle", this.spell.color)
            context.fillRect(0, 0, this.spell.cooldown * this.scale_x, BAR_HEIGHT)
        }

        if (this.show_duration && this._duration) {
            context.setAttr("globalAlpha", alpha * this.duration_opacity)
            context.setAttr("fillStyle", this.spell.color)
            context.fillRect(0, 0, this._duration * this.scale_x, BAR_HEIGHT)
        }

        if (this.show_icon) {
            context.setAttr("globalAlpha", alpha * this.icon_opacity)
            if (this.icon_stroke) {
                context.setAttr("lineWidth", 1)
                context.setAttr("strokeStyle", "black")
                context.strokeRect(ICON_X, ICON_X, ICON_SIZE, ICON_SIZE)
            }
            if (this.image?.complete && this.image.naturalWidth) {
                context.drawImage(this.image, ICON_X, ICON_X, ICON_SIZE, ICON_SIZE)
            }
        }

        if (this.show_text) {
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
        let width = 0
        if (this.show_text) { width = TEXT_X + this.text_width + TEXT_PADDING }
        else if (this.show_icon) { width = TEXT_X }
        else if (this.show_duration) { width = this._duration * this.scale_x }
        if (!width) { return }

        // with the icon hidden, the text starts at the same place
        const x = (this.show_icon || !this.show_text) ? 0 : TEXT_X
        context.setAttr("fillStyle", this.colorKey)
        context.fillRect(x, 0, width - x, BAR_HEIGHT)
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
        this.x(scale_x * this.timestamp)
        this.scale_x = scale_x
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
        store.dispatch({
            type: constants.EVENT_SHOW_TOOLTIP,
            payload: {
                content: this.hovering ? this.tooltip_content : "",
                position: position
            },
        })
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
