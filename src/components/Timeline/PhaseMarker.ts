import EventLine from "./EventLine"
import * as constants from "./constants"
import type Phase from "../../types/phase"


export default class PhaseMarker extends EventLine {

    event_data: Phase //  = { ts: 0 }

    constructor(phase_data: Phase) {
        super(phase_data, {

            label: {
                align: "center",
                // x: 0,

                y: -25,
                color: "white",

                width: 30,
                height: 20,

                // background: true,
                // background_width: 40,
                // background_height: 20,
            },

            label_background: {
                show: true,
            }
        })
    }

    get color() {
        return "#e6b217"
        return "#36b336"
    }

    _get_text_label() {
        return this.event_data.label || ""
    }

    _get_text_tooltip() {
        const t = this._get_tooltip_elements()
        return `${this.event_data.label}: ${t.time}`
    }

    _handle_display_settings(settings: { [key: string]: boolean }) {
        this.visible(settings.show_deaths)
    }

    handle_event(event_name: string, payload: any) {
        if (event_name === constants.EVENT_DISPLAY_SETTINGS) { this._handle_display_settings(payload) }
        super.handle_event(event_name, payload)
    }
}
