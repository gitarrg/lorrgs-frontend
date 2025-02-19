import Actor from "../../types/actor"
import EventLine from "./EventLine"
import type Event from "../../types/event"


/**
 * Event line showing a player related event.
 */
export default class PlayerEventLine extends EventLine {


    player_data: Actor


    constructor(player_data: Actor, event_data: Event, config) {
        super(event_data, config);

        // Attributes
        this.player_data = player_data
    }


    _get_tooltip_elements() {
        const items = super._get_tooltip_elements()

        items["player"] = this.player_data ? `<span class="wow-${this.player_data.class}">${this.player_data.name}</span>` : ""

        return items
    }


    _get_text_player() {
        return `<span class="wow-${this.player_data.class}">${this.player_data.name}</span>`
    }


}

