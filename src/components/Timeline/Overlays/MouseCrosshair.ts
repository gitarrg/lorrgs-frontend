import Konva from "konva"
import * as constants from "../constants"


/** The time under the pointer, shown on the ruler of the fight the pointer is over. */
export type TimeIndicator = {
    text: string
    /** top of that ruler (stage coords) */
    y: number
}


/**
 * Vertical line following the pointer across all timelines (see `Stage._update_crosshair`),
 * with a time indicator on the ruler of the hovered fight.
 */
export default class MouseCrosshair extends Konva.Group {

    // last known pointer position in seconds on the timeline
    private time = 0

    private line: Konva.Line
    private indicator: Konva.Label
    private indicator_text: Konva.Text

    constructor() {
        super({
            name: "mouse_crosshair",
            listening: false,
            visible: false,
            transformsEnabled: "position",
        })

        this.line = new Konva.Line({
            points: [0.5, 0, 0.5, 0],  // see `set_height`
            stroke: "white",
            strokeWidth: 0.5,
            listening: false,
            transformsEnabled: "none",
        })

        // box above the ticks, pointing down at the time
        this.indicator = new Konva.Label({ x: 0.5, listening: false, visible: false, transformsEnabled: "position" })
        this.indicator.add(new Konva.Tag({
            fill: "#ddd",
            cornerRadius: 2,
            pointerDirection: "down",
            pointerWidth: 6,
            pointerHeight: 4,
            listening: false,
        }))
        this.indicator_text = new Konva.Text({
            fontFamily: "Lato",
            fontSize: 12,
            fontStyle: "bold",
            fill: "black",
            padding: 2,
            listening: false,
        })
        this.indicator.add(this.indicator_text)

        this.add(this.line, this.indicator)
    }

    /** cover all timelines */
    set_height(height: number) {
        this.line.points([0.5, 0, 0.5, height])
    }

    private update_position() {
        const stage = this.getStage() as (Konva.Stage & { scale_x: number }) | null
        this.x(this.time * (stage?.scale_x || constants.DEFAULT_ZOOM))
    }

    /** Move to `time` (seconds on the stage), with the time of the hovered fight on its ruler. */
    move_to(time: number, indicator: TimeIndicator | null) {
        this.time = time
        this.update_position()
        this.visible(true)

        this.indicator.visible(!!indicator)
        if (indicator) {
            this.indicator_text.text(indicator.text)
            this.indicator.y(indicator.y + 20)  // tip just above the big ticks
        }
    }

    hide_crosshair() {
        this.visible(false)
    }

    handle_event(event_name: string, _: any) {
        if (event_name === constants.EVENT_ZOOM_CHANGE) { this.update_position() }
    }
}
