import Konva from "konva"
import * as constants from "../constants"


/** Vertical line following the pointer across all timelines (see `Stage._update_crosshair`). */
export default class MouseCrosshair extends Konva.Line {

    // last known pointer position in seconds on the timeline
    private time = 0

    constructor() {
        super({
            name: "mouse_crosshair",
            points: [0.5, 0, 0.5, 0],  // see `set_height`
            stroke: "white",
            strokeWidth: 0.5,
            listening: false,
            visible: false,
            transformsEnabled: "position",
        })
    }

    /** cover all timelines */
    set_height(height: number) {
        this.points([0.5, 0, 0.5, height])
    }

    private update_position() {
        const stage = this.getStage() as (Konva.Stage & { scale_x: number }) | null
        this.x(this.time * (stage?.scale_x || constants.DEFAULT_ZOOM))
    }

    /** Move to `time` (seconds on the stage) */
    move_to(time: number) {
        this.time = time
        this.update_position()
        this.visible(true)
    }

    hide_crosshair() {
        this.visible(false)
    }

    handle_event(event_name: string, _: any) {
        if (event_name === constants.EVENT_ZOOM_CHANGE) { this.update_position() }
    }
}
