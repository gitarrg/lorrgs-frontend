import { deepMerge } from "../../utils"
import * as constants from "./constants"
import EventLine, { EventLineConfig } from "./EventLine"
import Stage from "./Stage"
import type Konva from "konva"
import type Phase from "../../types/phase"
import { PHASE_COLOR } from "../../pulls"


/** px wide that grab the line */
const HIT_WIDTH = 10


export default class PhaseMarker extends EventLine {

    declare event_data: Phase

    active: boolean = false

    constructor(phase_data: Phase, config: EventLineConfig = {}) {

        // the name is on the ruler (see `PullRow`): the line stays inside the rows
        config = deepMerge({

            color: PHASE_COLOR,
            color_hover: "#17e67f",
            color_active: "#0FF",
            line_width: 1,

            label: { show: false },
            label_background: { show: false },
        }, config)

        super(phase_data, config)

        // easier to hit than the line itself
        this.mouse_event_bbox.width(HIT_WIDTH)
        this.mouse_event_bbox.x(-HIT_WIDTH / 2)

        this.on('mouseover', () => { this.hover_same_phase(true) });
        this.on('mouseout', () => { this.hover_same_phase(false) });
        this.on('mousedown', (e) => this.handle_mousedown(e));
    }

    _get_text_label() {
        return this.event_data.name
    }

    _get_text_tooltip() {
        const t = this._get_tooltip_elements()
        return `${this.event_data.name}: ${t.time}`
    }

    /***** Events */

    handle_mousedown(event: Konva.KonvaEventObject<MouseEvent>) {
        const stage = this.getStage() as Stage;
        if (!stage) { return; }


        const { name: current_anchor, ts } = stage.get_anchor()
        if (this.event_data.name == current_anchor && ts) {
            stage.set_anchor(0, "pull")
        } else {
            // where the line is now: it stays in place, the other fights move to it (see `FightRow.update_x`)
            const x = (this.getParent()?.x() ?? 0) + this.x()
            stage.set_anchor(x / stage.scale_x, this.event_data.name)
        }
    }

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

    /** the phase under the pointer in the ruler: its start and end show, even if the markers are hidden */
    private handle_phase_peek({ names }: { names: string[] }) {
        this.set_peek(names.includes(this.event_data.name))
    }

    private handle_display_settings(settings: { [key: string]: boolean }) {
        this.set_shown(settings.show_phases)
    }

    private handle_anchor_changed({ ts, name }: { ts: number, name: string }) {
        this.set_active(name == this.event_data.name)
    }

    handle_event(event_name: string, payload: any) {
        if (event_name === constants.EVENT_DISPLAY_SETTINGS) { this.handle_display_settings(payload) }
        if (event_name === constants.EVENT_PHASE_HOVER) { this._handle_phase_hover(payload) }
        if (event_name === constants.EVENT_PHASE_PEEK) { this.handle_phase_peek(payload) }
        if (event_name === constants.EVENT_ANCHOR_CHANGED) { this.handle_anchor_changed(payload) }
        super.handle_event(event_name, payload)
    }
}
