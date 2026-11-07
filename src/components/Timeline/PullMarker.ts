import { deepMerge, toMMSS } from "../../utils"
import * as constants from "./constants"
import EventLine, { EventLineConfig } from "./EventLine"
import store from "../../store/store"
import { toggle_pull } from "../../store/ui"
import type Konva from "konva"
import type { Pull } from "../../types/fight"
import type Event from "../../types/event"


/** what the marker gets as its `event_data` (available while `EventLine`'s constructor runs) */
interface PullEvent extends Event {
    name: string
    pull: Pull
    index: number
    run_key: string
}


export const PULL_COLOR = "#5b9bd5"
export const PULL_COLOR_HOVER = "#8cc4f5"
export const BOSS_PULL_COLOR = "#e6b422"
export const BOSS_PULL_COLOR_HOVER = "#ffd75e"

const HEIGHT = 12


/** name of a pull: the boss, or "Pull #n" for trash (`index`: position in the run's pulls) */
export function get_pull_label(pull: Pull, index: number) {
    return pull.boss || `Pull #${index + 1}`
}


/** rough width of a label in 10px Lato (avoids measuring every label) */
function label_width(text: string) {
    return Math.ceil(text.length * 5.6) + 10
}


/**
 * Label at the start of a pull of a dungeon run (on the fight row, like the `PhaseMarker`s).
 * Click to select/deselect the pull.
 */
export default class PullMarker extends EventLine {

    declare event_data: PullEvent

    constructor(pull: Pull, index: number, run_key: string, config: EventLineConfig = {}) {


        const text = get_pull_label(pull, index)
        const width = label_width(text)
        const boss = !!pull.boss

        config = deepMerge({
            color: boss ? BOSS_PULL_COLOR : PULL_COLOR,
            color_hover: boss ? BOSS_PULL_COLOR_HOVER : PULL_COLOR_HOVER,

            label: {
                show: true,
                fontSize: 10,
                align: "left",
                color: "black",
                x: 3,
                y: -HEIGHT,
                width: width,
                height: HEIGHT,
            },

            label_background: {
                show: true,
                x: 0.01, // (0 falls back to the label's x)
                width: width + 3,
                cornerRadius: [0, HEIGHT / 2, HEIGHT / 2, 0],
            }
        }, config)

        const event_data: PullEvent = { ts: pull.start, name: text, pull, index, run_key }
        super(event_data, config)
        this.line.strokeWidth(1)

        this.on("mouseover", () => { this.highlight(true) })
        this.on("mouseout", () => { this.highlight(false) })
        this.on("mousedown", (event) => this.handle_mousedown(event))
    }

    get pull() { return this.event_data.pull }

    _get_text_label() {
        return this.event_data.name
    }

    _get_text_tooltip() {
        const { pull, name } = this.event_data
        const map = this.time_ref.current
        const start = map.label(pull.start / 1000)
        const end = start + map.display_length(pull.start / 1000, (pull.end - pull.start) / 1000)
        const label = pull.boss ? `<span class=wow-boss>${pull.boss}</span>` : name
        return `${label}: ${toMMSS(start)} - ${toMMSS(end)}<br><small>click to select/deselect</small>`
    }

    private highlight(state: boolean) {
        const stage = this.getStage()
        if (stage) { stage.container().style.cursor = state ? "pointer" : "grab" }
        this.fill(state ? this.color_hover : this.color)
        this.getLayer()?.batchDraw()
    }

    private handle_mousedown(event: Konva.KonvaEventObject<MouseEvent>) {
        if (event.evt.button != 0) { return }
        event.cancelBubble = true  // no stage drag
        const { run_key, index } = this.event_data
        store.dispatch(toggle_pull({ run_key, index }))
    }

    handle_event(event_name: string, payload: any) {
        if (event_name === constants.EVENT_DISPLAY_SETTINGS) { return }  // always shown
        super.handle_event(event_name, payload)
    }
}
