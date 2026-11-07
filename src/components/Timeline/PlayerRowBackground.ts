
import Konva from "konva"
import * as constants from "./constants"
import type PlayerRow from "./PlayerRow"
import type { Context } from "konva/lib/Context"


export default class PlayerRowBackground extends Konva.Group {

    row: PlayerRow
    fill: Konva.Rect
    /** behind the icons of carried casts: the gaps before the segments (see `TimeMap.gaps`) */
    gaps: Konva.Shape
    private scale_x = constants.DEFAULT_ZOOM

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
        this.gaps = new Konva.Shape({
            listening: false,
            perfectDrawEnabled: false,
            transformsEnabled: "position",
            sceneFunc: (context) => this.draw_gaps(context),
        })
        this.add(this.fill, this.gaps)
    }

    private draw_gaps(context: Context) {
        const map = this.row.time_ref.current
        if (!map.gaps.some(gap => gap > 0)) { return }

        context.setAttr("fillStyle", "#181818")
        context.setAttr("strokeStyle", "black")
        context.setAttr("lineWidth", 1)
        map.segment_xs(this.scale_x).forEach(({ x0 }, i) => {
            const gap = map.gap(i)
            if (!gap) { return }
            const x = Math.round(x0 - gap) - 0.5
            context.fillRect(x, 0.5, Math.round(gap), constants.LINE_HEIGHT)
            context.strokeRect(x, 0.5, Math.round(gap), constants.LINE_HEIGHT)
        })
    }

    /////////////////////////
    // Events

    _handle_zoom_change(scale_x: number) {
        this.scale_x = scale_x
        this.fill.width(this.row.time_ref.current.width(scale_x))
    }

    handle_event(event_name: string, payload: any) {
        if (event_name === constants.EVENT_ZOOM_CHANGE) { this._handle_zoom_change(payload)}
    }
}
