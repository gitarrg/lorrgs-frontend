
import Konva from "konva"
import * as constants from "./constants"
import type PlayerRow from "./PlayerRow"
import type { Context } from "konva/lib/Context"


export default class PlayerRowBackground extends Konva.Group {

    row: PlayerRow
    /** the row's background per segment: the gutters (before the crop, at cuts) stay empty */
    segments: Konva.Shape
    private scale_x = constants.DEFAULT_ZOOM

    constructor(row: PlayerRow) {
        super()

        this.row = row // parent row element

        this.segments = new Konva.Shape({
            listening: false,
            perfectDrawEnabled: false,
            transformsEnabled: "position",
            sceneFunc: (context) => this.draw_segments(context),
        })
        this.add(this.segments)
    }

    private draw_segments(context: Context) {
        const map = this.row.time_ref.current
        context.setAttr("fillStyle", "#222")
        context.setAttr("strokeStyle", "black")
        context.setAttr("lineWidth", 1)
        map.segment_xs(this.scale_x).forEach(({ x0, x1 }) => {
            const x = Math.round(x0) - 0.5
            const width = Math.round(x1) - Math.round(x0) + 1
            context.fillRect(x, 0.5, width, constants.LINE_HEIGHT)
            context.strokeRect(x, 0.5, width, constants.LINE_HEIGHT)
        })
    }

    /////////////////////////
    // Events

    _handle_zoom_change(scale_x: number) {
        this.scale_x = scale_x
    }

    handle_event(event_name: string, payload: any) {
        if (event_name === constants.EVENT_ZOOM_CHANGE) { this._handle_zoom_change(payload)}
    }
}
