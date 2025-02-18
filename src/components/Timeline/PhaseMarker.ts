import { deepMerge } from "../../utils"
import * as constants from "./constants"
import Event from "../../types/event"
import EventLine, { EventLineConfig } from "./EventLine"
import Stage from "./Stage"


export default class PhaseMarker extends EventLine {

    phase_label: string = ""

    constructor(phase_data: Event, config: EventLineConfig = {}) {

        const height = 12

        config = deepMerge({

            color: "#36b336",
            color_hover: "#17e67f",
            // color_hover: "#e6b217",

            label: {
                show: true,
                fontSize: 10,
                align: "center",
                color: "black",

                x: 0,
                y: -height,

                width: 20,
                height: height,
            },

            label_background: {
                show: true,
                cornerRadius: [0, height / 2, height / 2, 0],
                // x: -10,
            }
        }, config)

        super(phase_data, config)

        this.on('mouseover', () => { this.hover_same_phase(true) });
        this.on('mouseout', () => { this.hover_same_phase(false) });

    }

    _get_text_label() {
        return this.event_data.name || this.event_data.label || ""
    }

    _get_text_tooltip() {
        const t = this._get_tooltip_elements()
        return `${this.event_data.name}: ${t.time}`
    }

    /***** Events */

    hover_same_phase(state: boolean) {

        const stage = this.getStage() as Stage;
        const label = this.event_data
        if (stage && label) {
            stage.handle_event(constants.EVENT_PHASE_HOVER, { state, name: this.event_data.name })
        }
    }

    _handle_phase_hover(payload: { state: boolean, name: string }) {

        if (payload.name != this.event_data.name) { return }

        this.line.strokeWidth(payload.state ? 4 : 2)
        super._handle_phase_hover(payload)
    }

    _handle_display_settings(settings: { [key: string]: boolean }) {
        this.visible(settings.show_phases)
    }

    handle_event(event_name: string, payload: any) {
        if (event_name === constants.EVENT_DISPLAY_SETTINGS) { this._handle_display_settings(payload) }
        if (event_name === constants.EVENT_PHASE_HOVER) { this._handle_phase_hover(payload) }
        super.handle_event(event_name, payload)
    }
}
