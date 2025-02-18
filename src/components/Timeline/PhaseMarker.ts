import EventLine, { EventLineConfig } from "./EventLine"
import * as constants from "./constants"
import type Phase from "../../types/phase"
import { deepMerge } from "../../utils"


export default class PhaseMarker extends EventLine {

    event_data: Phase = { ts: 0 }


    constructor(phase_data: Phase, config: EventLineConfig) {

        const height = 12

        config = deepMerge({

            color: "#36b336",
            color_hover: "#17e617",
            // color_hover: "#e6b217",

            label: {
                // show: true,
                fontSize: 10,
                align: "center",
                color: "black",

                x: 0,
                y: -height,

                width: 20,
                height: height,
            },

            label_background: {
                // show: true,
                cornerRadius: [0, height / 2, height / 2, 0],
                // x: -10,
            }
        }, config)

        super(phase_data, config)
    }

    _get_text_label() {
        return this.event_data.label || ""
    }

    _get_text_tooltip() {
        const t = this._get_tooltip_elements()
        return `${this.event_data.label}: ${t.time}`
    }

    /***** Events */

    hover(state: boolean) {
        this.line.strokeWidth(state ? 4 : 2)
        super.hover(state)
    }

    _handle_display_settings(settings: { [key: string]: boolean }) {
        this.visible(settings.show_phases)
    }

    handle_event(event_name: string, payload: any) {
        if (event_name === constants.EVENT_DISPLAY_SETTINGS) { this._handle_display_settings(payload) }
        super.handle_event(event_name, payload)
    }
}
