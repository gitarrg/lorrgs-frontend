/* A row in our Timeline. representing a single Fight.

This basically just wraps a number of Boss/Player Rows.

Dungeon runs with pulls also get a `PullRow` above the row (in the gap/ruler space next to the run's info), and can be cropped to some of their pulls. Everything on the row goes through the row's `TimeMap`
(`time_ref`) to turn the time of an event into its position.

*/

import { FilterValues } from "../../store/ui";
import { toMMSS } from "../../utils";
import * as constants from "./constants";
import filter_logic from "../../filter_logic";
import Konva from "konva";
import PhaseMarker from "./PhaseMarker";
import PlayerRow from "./PlayerRow";
import PullRow from "./PullRow";
import TimeMap, { type TimeMapRef } from "./TimeMap";
import { get_run_key } from "../../store/ui";
import type { Context } from "konva/lib/Context";
import type Actor from "../../types/actor";
import type Fight from "../../types/fight";
import type Stage from "./Stage";


/** How dungeon runs show their pulls (the same for all fight rows of the stage) */
export interface PullView {
    /** selected pulls per run (see `get_run_key`) */
    selection: { [run_key: string]: number[] }
    hide_unselected: boolean
    pull_time: boolean
}


export default class FightRow {

    /* offset for the killtime text */
    KILLTIME_MARGIN = 5

    /** length of the fight in seconds */
    duration: number
    _visible: boolean

    /** maps the time of an event to its position on the row. Shared with all children */
    time_ref: TimeMapRef
    run_key: string
    _fight_data: Fight

    // latest payload per event received while hidden
    _pending_events: Map<string, any> = new Map()

    // Timestamp of the current anchor (in milliseconds)
    anchor_offset: number = 0
    anchor_ts: number = 0

    foreground: Konva.Group
    background: Konva.Group
    overlay: Konva.Group
    rows: PlayerRow[] = []
    phases: PhaseMarker[] = []
    killtime_text: Konva.Text

    // dungeon runs
    pull_row?: PullRow
    /** greys out the time between the selected pulls, and marks cut out time */
    dim_shape: Konva.Shape
    private rows_height = 0
    private scale_x = constants.DEFAULT_ZOOM


    constructor(fight_data: Fight) {

        this._visible = true

        // input data
        this._fight_data = fight_data
        this.duration = Math.ceil(fight_data.duration / 1000); // ms to s
        this.time_ref = { current: TimeMap.identity(this.duration), pulls: fight_data.pulls || undefined }
        this.run_key = get_run_key(fight_data)

        // Groups
        this.foreground = new Konva.Group()
        this.background = new Konva.Group()
        this.overlay = new Konva.Group()

        this.rows = [] // child rows

        // create child rows
        fight_data.boss && this.add_row(fight_data, fight_data.boss)
        fight_data.players.forEach(player => this.add_row(fight_data, player))

        this.killtime_text = this.create_killtime_text()
        this.foreground.add(this.killtime_text)

        // Phases
        fight_data.phases?.forEach(phase_data => {
            const phase = new PhaseMarker(phase_data)
            phase.time_ref = this.time_ref
            this.phases.push(phase)
            this.overlay.add(phase)
        })

        // Pulls (dungeon runs)
        const pulls = fight_data.pulls || []
        if (pulls.length) {
            // above the row, next to the run's info in the names column (where the shared ruler is for the first fight)
            this.pull_row = new PullRow(pulls, this.time_ref)
            this.pull_row.shape.y(-this.pull_row.height())
            this.pull_row.bbox.y(-this.pull_row.height())
            this.background.add(this.pull_row.shape)
            this.overlay.add(this.pull_row.bbox)
        }

        this.dim_shape = new Konva.Shape({
            listening: false,
            perfectDrawEnabled: false,
            transformsEnabled: "position",
            sceneFunc: (context) => this.draw_dim(context),
        })
        this.overlay.add(this.dim_shape)
        this.dim_shape.moveToBottom()  // below the phase markers

        this.layout_children()
    }

    add_row(fight: Fight, player: Actor) {
        const row = new PlayerRow(fight, player, this.time_ref)
        this.rows.push(row)

        this.foreground.add(row.foreground)
        this.background.add(row.background)
    }

    create_killtime_text() {

        return new Konva.Text({
            name: "cast_text",
            text: toMMSS(this.duration),
            x: this.KILLTIME_MARGIN + (this.time_ref.current.duration * constants.DEFAULT_ZOOM),
            y: 0,
            fontSize: 14,

            height: constants.LINE_HEIGHT,
            verticalAlign: 'middle',

            fontFamily: "Lato",
            fill: "#999",
            listening: false,
            transformsEnabled: "position",
        })
    }

    layout_children() {

        let y = 0 // accumulate the height over time, to take into account visibility
        this.rows.forEach((row) => {
            row.y(y)
            y += row.height()
        })
        this.rows_height = y

        this.phases.forEach(phase => { phase.set_height(y) })
    }

    /** grey out the time between the selected pulls, and mark where time was cut out (in the overlay) */
    private draw_dim(context: Context) {
        const map = this.time_ref.current
        const s = this.scale_x
        // (the pull row sits above the row)
        const top = -(this.pull_row?.height() ?? 0)
        const height = this.rows_height - top

        context.setAttr("fillStyle", "rgba(0, 0, 0, 0.6)")
        map.dimmed.forEach(range => {
            const x0 = map.to_x(range.start, s)
            const x1 = map.to_x(range.end, s)
            context.fillRect(x0, top, x1 - x0, height)
        })

        // cuts: dashed line through the whole run, where the time continues (after the gap)
        context.setAttr("strokeStyle", "rgba(255, 255, 255, 0.6)")
        context.setAttr("lineWidth", 1)
        context.setLineDash([3, 3])
        map.segment_xs(s).slice(1).forEach(({ x0 }) => {
            const x = Math.round(x0) + 0.5
            context.beginPath()
            context.moveTo(x, top)
            context.lineTo(x, this.rows_height)
            context.stroke()
        })
        context.setLineDash([])
    }

    /** whether the fight shows its pulls (and so has its own ruler) */
    has_pull_row() {
        return !!this.pull_row
    }

    /** Rebuild the time map for the pull selection/settings. @returns true if it changed */
    set_pull_view(view: PullView): boolean {
        if (!this.pull_row) { return false }

        const selected = view.selection[this.run_key] || []
        const map = TimeMap.build({
            duration: this.duration,
            pulls: this._fight_data.pulls,
            selected,
            hide_unselected: view.hide_unselected,
            pull_time: view.pull_time,
        })
        this.pull_row.set_selected(selected)
        this.time_ref.current = map

        // children read the map: update their texts, what is cut out, and their positions
        this.handle_event(constants.EVENT_TIME_MAP_CHANGED, null)
        this.handle_event(constants.EVENT_ZOOM_CHANGE, this.scale_x)
        return true
    }

    //////////////////////////////
    // Attributes
    //
    visible(value?: boolean) {

        if (value !== undefined) {
            this._visible = value
            this.foreground.visible(value)
            this.background.visible(value)
            this.overlay.visible(value)
        }
        return this._visible
    }

    height(): number {
        if (!this._visible) { return 0 }
        const heights = this.rows.map(row => row.height())
        return heights.reduce((a, b) => a + b, 0)
    }

    y(y: number) {
        // forward changes y-coord changes to both children
        this.background.y(y)
        this.foreground.y(y)
        this.overlay.y(y)
    }

    x(x: number) {
        this.background.x(x)
        this.foreground.x(x)
        this.overlay.x(x)
    }

    destroy() {
        this.background.destroy()
        this.foreground.destroy()
        this.overlay.destroy()
    }

    //////////////////////////////
    // Methods
    //

    _handle_zoom_change(scale_x: number) {
        this.scale_x = scale_x
        this.killtime_text.x(this.KILLTIME_MARGIN + this.time_ref.current.width(scale_x))
        this.update_x()
    }

    /** the anchor offset */
    private update_x() {
        this.x(this.anchor_offset * this.scale_x)
    }

    /**
     * Gaps before the segments of a cropped/cut row, with the icons of the casts from before them
     * whose bars reach into them (so they don't look like they were cast at the segment's start).
     * Each as wide as the most such casts of a (visible) player. None: no gap.
     */
    private update_gaps() {
        const map = this.time_ref.current
        const visible = this.rows.filter(row => row.visible())
        const gaps = map.segments.map((_, i) => {
            const count = Math.max(0, ...visible.map(row => row.foreground.gap_counts[i] || 0))
            return count ? count * constants.GUTTER_SLOT + constants.GUTTER_PADDING : 0
        })
        if (!map.set_gaps(gaps)) { return }

        // everything after a gap moves
        this.handle_event(constants.EVENT_ZOOM_CHANGE, this.scale_x)
        this.background.getStage()?.batchDraw()  // (casts only redraw their layer)
    }

    /** events that can change which casts go in the gaps */
    static GUTTER_EVENTS = new Set([
        constants.EVENT_TIME_MAP_CHANGED,
        constants.EVENT_SPELL_DISPLAY,
        constants.EVENT_DISPLAY_SETTINGS,
        constants.EVENT_APPLY_FILTERS,
    ])

    _handle_time_map_changed() {
        const map = this.time_ref.current
        this.killtime_text.text(toMMSS(map.label_at_display(map.duration)))
    }

    _handle_apply_filters_pre(filters: FilterValues) {
        const visible = filter_logic.is_fight_visible(this._fight_data, filters)
        this.visible(visible)
    }

    private handle_anchor_changed({ ts, name }: { ts: number, name: string }) {

        let stage = this.background.getStage() as Stage || null
        if (!stage) { return }

        // reset to pull
        if (ts == 0) {
            this.anchor_offset = 0
            this.anchor_ts = 0
            this.update_x()
        }

        // find the same phase in this fight
        const phase_in_fight = this._fight_data.phases?.find(phase => phase.name === name)
        if (!phase_in_fight) { return }

        // TODO: see if we can keep the relative screen position
        // of the object clicked on.
        let new_offset = ts - this.time_ref.current.to_display(phase_in_fight.ts / 1000);
        this.anchor_offset = new_offset;
        this.update_x()
    }


    _handle_apply_filters_post() {
        this.layout_children()
    }

    _replay_pending_events() {
        const pending = this._pending_events
        this._pending_events = new Map()
        pending.forEach((payload, event_name) => this.handle_event(event_name, payload))
    }

    handle_event(event_name: string, payload: any) {

        // apply filters to the fight itself (before processing children)
        if (event_name === constants.EVENT_APPLY_FILTERS) {
            this._handle_apply_filters_pre(payload)
            if (this.visible()) { this._replay_pending_events() }
        }

        // hidden: remember the latest payload and replay once visible again
        if (!this.visible()) {
            if (event_name !== constants.EVENT_APPLY_FILTERS && event_name !== constants.EVENT_PHASE_HOVER) {
                this._pending_events.delete(event_name)
                this._pending_events.set(event_name, payload)
            }
            return
        }

        if (event_name === constants.EVENT_ZOOM_CHANGE) { this._handle_zoom_change(payload) }
        if (event_name === constants.EVENT_TIME_MAP_CHANGED) { this._handle_time_map_changed() }
        if (event_name === constants.EVENT_ANCHOR_CHANGED) { this.handle_anchor_changed(payload) }
        this.rows.forEach(child => child.handle_event(event_name, payload))
        this.phases.forEach(child => child.handle_event(event_name, payload))
        this.pull_row?.handle_event(event_name, payload)

        // postprocess after filters applied (in case height change due to child rows updating)
        if (event_name === constants.EVENT_APPLY_FILTERS) { this._handle_apply_filters_post() }
        if (FightRow.GUTTER_EVENTS.has(event_name)) { this.update_gaps() }
    }
}
