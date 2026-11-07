
import Konva from "konva"
import * as constants from "./constants"
import type PlayerRow from "./PlayerRow"


export default class PlayerRowBackground extends Konva.Group {

    row: PlayerRow
    fill: Konva.Rect
    /** behind the icons of casts from before the crop (see `FightRow.update_gutter`) */
    gutter: Konva.Rect

    constructor(row: PlayerRow) {
        super()

        this.row = row // parent row element

        // create background
        this.fill = new Konva.Rect({
            height: constants.LINE_HEIGHT,
            width: this.row.duration * constants.DEFAULT_ZOOM,
            x: -0.5,
            y: 0.5,
            fill: "#222",
            stroke: "black",
            strokeWidth: 1,
            listening: false,
            transformsEnabled: "position",
        })
        this.gutter = new Konva.Rect({
            height: constants.LINE_HEIGHT,
            y: 0.5,
            fill: "#181818",
            stroke: "black",
            strokeWidth: 1,
            listening: false,
            visible: false,
            transformsEnabled: "position",
        })
        this.add(this.gutter, this.fill)
    }

    set_gutter(width: number) {
        this.gutter.visible(width > 0)
        this.gutter.x(-width - 0.5)
        this.gutter.width(width)
    }

    /////////////////////////
    // Events

    _handle_zoom_change(scale_x: number) {
        this.fill.width(this.row.duration * scale_x)
    }

    handle_event(event_name: string, payload: any) {
        if (event_name === constants.EVENT_ZOOM_CHANGE) { this._handle_zoom_change(payload)}
    }
}
