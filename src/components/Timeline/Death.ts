import * as constants from "./constants"
import PlayerEventLine from "./PlayerEventLine"


export default class Death extends PlayerEventLine {

    color = "#ff4d4d"

    _get_text_label() {
        return "💀 " + super._get_text_label()
    }

    _get_text_tooltip() {
        const t = this._get_tooltip_elements()

        // additonal logic in case no spell info is given
        const s = t.spell ? ` from ${t.spell}` : ""
        return `${t.icon} ${t.time} ${t.player} dies${s}.`
    }

    _handle_display_settings(settings: { [key: string]: boolean }) {
        this.visible(settings.show_deaths)
    }

    handle_event(event_name: string, payload: any) {
        if (event_name === constants.EVENT_DISPLAY_SETTINGS) { this._handle_display_settings(payload) }
        super.handle_event(event_name, payload)
    }
}
