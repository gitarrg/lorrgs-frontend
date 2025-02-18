import { ASSETS } from "../../constants"
import { toMMSS } from "../../utils"
import * as constants from "./constants"
import Konva from "konva"
import store from "./../../store/store"
import type Event from "../../types/event"
import type Stage from "./Stage"


const ICON_ROOT = `${ASSETS}/images/spells`


export interface EventLineConfig {

    // General
    color?: string
    color_hover?: string

    // Label
    label?: {
        show?: boolean
        fontSize?: number
        align?: string
        x?: number
        y?: number
        color?: string
        width?: number
        height?: number
    }

    // Label Background
    label_background?: {
        show?: boolean

        fill?: string
        width?: number
        height?: number
        cornerRadius?: number | number[]

        // offset, falls back to label.x/y and 0/0
        x?: number
        y?: number

    }
}


export default class EventLine extends Konva.Group {

    color: string
    color_hover?: string

    // Attributes
    event_data: Event
    timestamp: number
    tooltip_content: string

    config: EventLineConfig = {}


    // Child objects
    line: Konva.Line
    label?: Konva.Text
    handle?: Konva.Rect
    mouse_event_bbox: Konva.Rect

    constructor(event_data: Event, config: EventLineConfig = {}) {
        super()

        this.config = config

        // Kova Attrs
        this.listening(true)  // TODO: only if required
        this.transformsEnabled("position")

        ////////////////////////////////////////////////////////////////////////
        // Attributes
        this.event_data = event_data
        this.timestamp = event_data.ts / 1000 || 0
        this.tooltip_content = this._get_text_tooltip()

        this.color = config?.color || "#ccc"
        this.color_hover = config?.color_hover || this.color

        ////////////////////////////////////////////////////////////////////////
        // Elements

        const show_label = config.label?.show ?? true

        // Element: Line
        this.line = new Konva.Line({
            points: [
                0,
                show_label ? (config?.label?.y ?? 0) : 0,
                0,
                constants.LINE_HEIGHT,
            ],
            stroke: this.color,
            strokeWidth: 2,
            transformsEnabled: "none",
        })
        this.add(this.line)


        // Element: Label
        if (show_label) {
            const width = config?.label?.width || 50
            const height = config?.label?.height || constants.LINE_HEIGHT

            console.log("label", { width, height })

            this.label = new Konva.Text({
                // name: "cast_text",
                text: this._get_text_label(),
                fontSize: config?.label?.fontSize || 14,


                x: config?.label?.x ?? 3, // gap between line and label
                y: config?.label?.y ?? 0,

                width: width,
                height: height,

                verticalAlign: 'middle',
                align: config?.label?.align ?? "center",

                fontFamily: "Lato",
                fill: config?.label?.color || this.color,
                listening: false,
                transformsEnabled: "position",
            })
        }

        if (config?.label_background?.show ?? config.label?.show ?? false) {

            const width = config.label_background?.width ?? this.label?.width() ?? 50
            const height = config.label_background?.height ?? this.label?.height() ?? 20

            this.handle = new Konva.Rect({
                x: config?.label_background?.x || config?.label?.x || 0,
                y: config?.label_background?.y || config?.label?.y || 0,

                width: width,
                height: height,

                fill: this.color,
                cornerRadius: config?.label_background?.cornerRadius || 3,

                // listening: true,
                transformsEnabled: "position",
            })
            this.add(this.handle)
        }

        this.label && this.add(this.label)
        // this.label.visible(show_label)


        // invisible box for mouse events
        {
            const w = this.line.width() + 4
            const h = this.line.height() + (this.label?.height() || 0)

            this.mouse_event_bbox = new Konva.Rect({
                width: w,
                height: h,

                x: -w / 2,
                y: 0,

                listening: true,
                transformsEnabled: "none",
                // fill: "red",
            });
            this.add(this.mouse_event_bbox)
        }

        if (this.tooltip_content) {
            this.listening(true)
            this.mouse_event_bbox.on('mouseover', () => { this.hover(true) });
            this.mouse_event_bbox.on('mouseout', () => { this.hover(false) });

            this.handle?.listening(true)
            this.handle?.on('mouseover', () => { this.hover(true) });
            this.handle?.on('mouseout', () => { this.hover(false) });
        }
    }

    set_height(height: number) {
        let points = this.line.points()
        points[3] = height
        this.line.points(points)
        this.mouse_event_bbox.height(height)
    }

    _get_text_label() {
        return toMMSS(this.timestamp)
    }

    /** Tooltip Text Helpers */
    _get_tooltip_elements() {

        const items: any = {}
        const ed = this.event_data

        items["time"] = toMMSS(this.timestamp)

        // 18px is the native size of the "small"-images
        items["icon"] = ed.spell_icon ? `<img src="${ICON_ROOT}/${ed.spell_icon}" width="18px" height="auto">` : ""
        items["source"] = ed.source_name ? `<span class=wow-${ed.source_class}>${ed.source_name}</span>` : ""
        items["spell"] = ed.spell_name ? `<span class=wow-boss>${ed.spell_name}</span>` : ""
        return items
    }

    _get_tooltip_spell_name() {
        if (!this.event_data.spell_name) { return "" }
        return `<span class=wow-boss>${this.event_data.spell_name}</span>`
    }

    _get_text_tooltip() {
        return ""
    }

    _handle_zoom_change(scale_x: number) {
        this.x(scale_x * this.timestamp)
    }

    _handle_phase_hover(payload: { state: boolean, label: string }) {

        if (payload.label != this.event_data.label) { return }

        const state = payload.state
        if (this.color_hover) {
            this.line?.stroke(state ? this.color_hover : this.color)
            this.handle?.fill(state ? this.color_hover : this.color)
        }
    }

    handle_event(event_name: string, payload: any) {
        if (event_name === constants.EVENT_ZOOM_CHANGE) { this._handle_zoom_change(payload) }
        if (event_name === constants.EVENT_PHASE_HOVER) { this._handle_phase_hover(payload) }
    }

    hover(hovering: boolean) {

        const stage = this.getStage() as Stage | null
        if (!stage) { return }

        // no tooltip
        if (!this.tooltip_content) { return }


        // anchor to group or label (if available)
        let position = this.absolutePosition()
        if (this.label) {
            position = this.label.absolutePosition()
        }

        // add stage global position
        const container = stage.container()
        const container_position = container.getBoundingClientRect()
        position.x += container_position.x
        position.y += container_position.y

        store.dispatch({
            type: constants.EVENT_SHOW_TOOLTIP,
            payload: {
                content: hovering ? this.tooltip_content : "",
                position: position
            },
        })
    }
}
