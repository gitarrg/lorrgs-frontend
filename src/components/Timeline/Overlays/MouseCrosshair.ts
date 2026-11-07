import Konva from "konva"
import * as constants from "../constants"


/** The time under the pointer, shown on the ruler of the fight the pointer is over. */
export type TimeIndicator = {
    text: string
    /** top of that ruler (stage coords) */
    y: number
    /** of that ruler: hides the timestamps under the indicator */
    background: string
}


/** px of background left and right of the indicator's text */
const INDICATOR_PADDING = 3


/**
 * Vertical line following the pointer across all timelines (see `Stage._update_crosshair`),
 * with a time indicator on the ruler of the hovered fight.
 */
export default class MouseCrosshair extends Konva.Group {

    // last known pointer position in seconds on the timeline
    private time = 0

    private line: Konva.Line
    private indicator: Konva.Group
    private indicator_background: Konva.Rect
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

        // a timestamp like the ruler's (see `Ruler.create_ticks`), on the ruler's background to hide the timestamps below it
        this.indicator = new Konva.Group({ listening: false, visible: false, transformsEnabled: "position" })
        this.indicator_background = new Konva.Rect({
            x: -INDICATOR_PADDING,
            y: 3,
            height: constants.LINE_HEIGHT - 10 - 3,  // down to the big ticks
            listening: false,
            transformsEnabled: "position",
        })
        this.indicator_text = new Konva.Text({
            y: -10,
            height: constants.LINE_HEIGHT,
            verticalAlign: "bottom",
            fontSize: 14,
            fontFamily: "Lato",
            fill: "white",
            listening: false,
            transformsEnabled: "position",
        })
        this.indicator.add(this.indicator_background, this.indicator_text)

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
            this.indicator.y(indicator.y)
            this.indicator_text.text(indicator.text)
            this.indicator_background.fill(indicator.background)
            this.indicator_background.width(this.indicator_text.width() + 2 * INDICATOR_PADDING)
        }
    }

    hide_crosshair() {
        this.visible(false)
    }

    handle_event(event_name: string, _: any) {
        if (event_name === constants.EVENT_ZOOM_CHANGE) { this.update_position() }
    }
}
