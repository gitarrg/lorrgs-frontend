
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


function create_cast_cooldown(spell: Spell) {
    if (!spell.cooldown) { return }
    return new Konva.Rect({
    name: "cast_cooldown",
        width: spell.cooldown * constants.DEFAULT_ZOOM,
        height: constants.LINE_HEIGHT-1,
        fill: spell.color,
        opacity: 0.1,
        listening: false,
        transformsEnabled: "none",
        perfectDrawEnabled: false,
    })
}


function create_cast_duration(spell: Spell, duration=0) {
    if (!duration) { return }

    return new Konva.Rect({
        name: "cast_duration",
        width: duration  * constants.DEFAULT_ZOOM,
        height: constants.LINE_HEIGHT-1,
        fill: spell.color,
        listening: true,  // the fake bbox might be smaller
        opacity: 0.5,
        transformsEnabled: "none",
        perfectDrawEnabled: false,
    })
}

function create_cast_icon(spell: Spell) {

    // simple cache to reuse existing images
    if (IMAGES[spell.spell_id] === undefined) {
        IMAGES[spell.spell_id] = new Image()
        IMAGES[spell.spell_id].src = spell.icon_path
    }

    // create the konva image
    return new Konva.Image({
        name: "cast_icon",
        image: IMAGES[spell.spell_id],
        listening: false,
        x: 3.5, // padding
        y: 3.5, // padding
        width: 20,
        height: 20,
        stroke: "black",
        strokeWidth: 1,
        transformsEnabled: "position",
        perfectDrawEnabled: false,
    })
}


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
 * A single line of text, vertically centered in the row. Looks the same as a Konva.Text,
 * but cheaper to create: a Konva.Text measures itself and registers ~10 listeners, which adds up over hundreds of casts.
 */
class CastText extends Konva.Shape {

    text: string
    private bold = false

    constructor(text: string) {
        super({
            name: "cast_text",
            x: 27,
            y: 0,
            width: measure_text(text),
            height: constants.LINE_HEIGHT,
            fill: "white",
            listening: false,
            transformsEnabled: "position",
            perfectDrawEnabled: false,
        })
        this.text = text
    }

    set_bold(bold: boolean) {
        this.bold = bold
    }

    _sceneFunc(context: Context) {
        context.setAttr("font", this.bold ? CAST_TEXT_FONT_BOLD : CAST_TEXT_FONT)
        context.setAttr("textBaseline", "middle")
        context.setAttr("textAlign", "left")
        context.setAttr("fillStyle", this.fill())
        context.fillText(this.text, 0, this.height() / 2)
    }
}


export default class Cast extends Konva.Group {

    /** name of the invisible box that receives the mouse events (handled by the Stage) */
    static MOUSE_BBOX_NAME = "cast_bbox"

    spell_id: number
    timestamp: number
    _duration = 0
    spell: Spell

    hovering: boolean
    selected: boolean

    cast_cooldown?: Konva.Rect
    cast_duration?: Konva.Rect
    cast_icon?: Konva.Image
    cast_text?: CastText
    mouse_event_bbox?: Konva.Rect

    tooltip_content?: string

    // default opacity (might be different for procs)
    _default_opacity: number = 1.0


    constructor(cast_data: CastType) {
        super()

        // Kova Attrs
        this.listening(true)
        this.transformsEnabled("position")
        this.name("Cast")

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

        ////////////////////////////
        // create elements
        //
        this.cast_cooldown = create_cast_cooldown(this.spell)
        this.cast_cooldown && this.add(this.cast_cooldown)

        this.cast_duration = create_cast_duration(this.spell, this._duration)
        this.cast_duration && this.add(this.cast_duration)

        this.cast_icon = create_cast_icon(this.spell)
        this.cast_icon && this.add(this.cast_icon)

        this.cast_text = new CastText(toMMSS(this.timestamp))
        this.add(this.cast_text)

        // Dim procs
        if ( this.is_proc(cast_data) )
        {
            this._default_opacity = 0.5
            this.opacity(this._default_opacity)
            this.cast_cooldown?.remove()
        }

        // invisible box for mouse events
        // (some casts might not have a duration-bar to use)
        this.mouse_event_bbox = new Konva.Rect({
            name: Cast.MOUSE_BBOX_NAME,
            width: this.cast_text.width() + 3,
            height: constants.LINE_HEIGHT-1,
            listening: true,
        });
        this.add(this.mouse_event_bbox)

        let show = state.spells.spell_display[this.spell_id]
        show = (show === undefined) ? this.spell.show : show
        this.visible(show)
        this.y(1); // for the background stroke

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

    update_style() {

        if (!this.visible()) { return;}

        const stage  = this.getStage() as Stage | null
        if (!stage) { return}

        // default state
        this.cast_text?.set_bold(false)
        this.cast_text?.fill("white");
        this.cast_duration?.opacity(0.5)
        this.cast_cooldown?.opacity(0.1)
        this.cast_icon?.opacity(1.0)
        this.cast_icon?.strokeWidth(1)
        this.opacity(this._default_opacity)

        if (stage.has_selection) {
            if (this.selected) {
                this.cast_text?.set_bold(true)
                this.cast_duration?.opacity(0.85)
                this.cast_cooldown?.opacity(0.4)
            } else {
                this.opacity(.5)
                this.cast_text?.fill("#ccc")
                this.cast_icon?.opacity(0.5)
                this.cast_icon?.strokeWidth(0)
            }
        }
    }

    ////////////////////////////////////////////////////////////////////////////
    // Events
    //

    _handle_display_settings(settings: { [key: string]: boolean}) {
        this.cast_icon?.visible(settings.show_casticon)
        this.cast_text?.visible(settings.show_casttime)
        this.cast_cooldown?.visible(settings.show_cooldown)
        this.cast_duration?.visible(settings.show_duration)
    }

    _handle_zoom_change(scale_x: number) {
        this.x(scale_x * this.timestamp)
        this.cast_cooldown?.width(this.spell.cooldown * scale_x)
        this.cast_duration?.width(this._duration * scale_x)
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

        position.x += this.cast_icon ? (this.cast_icon.x() + (this.cast_icon.width() / 2)) : 0 // center above the icon
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
