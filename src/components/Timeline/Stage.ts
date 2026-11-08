import Konva from "konva"
import type { StageConfig } from "konva/lib/Stage";

import Ruler from "./Ruler"
import MouseCrosshair from "./Overlays/MouseCrosshair"
import * as constants from "./constants";
import FightRow, { type PullView } from "./FightRow";
import type Fight from "../../types/fight";
import Cast, { IMAGES } from "./Cast";
import type Player from "./Player";
import { MODES, set_aligned_phase, type FilterValues } from "../../store/ui";
import store from "../../store/store";


// for performance
Konva.autoDrawEnabled = false;


export type AnchorKind = "phase" | "pull"

/**
 * The time all fights are aligned on (see `EVENT_ANCHOR_CHANGED`).
 * `ts`: where on the timeline (s) the phase/pull starts. 0: no anchor, all fights start at 0.
 */
export type Anchor = { ts: number, name: string, kind: AnchorKind }


/** Run `callback` once the browser is idle. `has_time()` tells if there is idle time left to continue. */
function on_idle(callback: (has_time: () => boolean) => void) {
    const SLICE_MS = 10 // keep each slice short, so input never waits long

    if (window.requestIdleCallback) {
        window.requestIdleCallback((deadline) => {
            const end = performance.now() + SLICE_MS
            callback(() => performance.now() < end && (deadline.didTimeout || deadline.timeRemaining() > 1))
        }, { timeout: 1000 })
        return
    }

    // no requestIdleCallback (Safari)
    setTimeout(() => {
        const end = performance.now() + SLICE_MS
        callback(() => performance.now() < end)
    }, 0)
}


export default class Stage extends Konva.Stage {

    static ZOOM_RATE = 1.1
    static SCROLL_RATE = 0.5
    static ZOOM_MIN = 0.5

    static THROTTLE = 200 // max update rate in ms

    MODE = ""

    scale_x: number

    // bool: true if any spell is selected
    has_selection: boolean

    anchor_ts: number = 0
    anchor_name: string = "pull"
    /** what the anchor aligns the fights on: a boss phase, or a pull of dungeon runs (see `FightRow`) */
    anchor_kind: AnchorKind = "phase"

    /** how dungeon runs show their pulls (see `set_pull_view`) */
    private pull_view: PullView = { selection: {}, hide_unselected: false, timestamps: "pull", phase_selection: [] }

    /** filters last applied (see `EVENT_APPLY_FILTERS`) */
    private applied_filters?: FilterValues

    private rows: FightRow[] = []
    back_layer: Konva.Layer
    main_layer: Konva.Layer
    overlay_layer: Konva.Layer  // general overlays (MouseCrossHair)
    overlay_layer2: Konva.Layer  // additional overlays
    marker_layer: Konva.Layer  // Timeline Markers (on top: nothing may catch their mouse events)
    ruler: Ruler
    private crosshair: MouseCrosshair

    /** Duration of the longest fight. Used to set things such as the the Length of the Ruler and overall width. */
    longest_fight = 0

    /** Players whose cache needs rebuilding. Done in small slices while the browser is idle (see `_update_caches`). */
    private uncached_players = new Set<Player>()
    private cache_work_scheduled = false

    /** True while spell icons are still loading: caching now would be thrown away once they are in. */
    private images_pending = false

    /** Wait this long after the last zoom step before caching: every further step would throw the caches away again. */
    static ZOOM_SETTLE_MS = 300
    private zoomed_at = 0


    constructor(options: StageConfig) {
        super(options);
        this.draggable(true)

        /////////////////////////////////
        // custom attributes
        this.scale_x = constants.DEFAULT_ZOOM

        this.rows = []

        // bool: true if any spell is selected
        this.has_selection = false;

        ////////////////////////////////
        // create layers
        this.back_layer = new Konva.Layer({ listening: false })
        this.add(this.back_layer);

        this.main_layer = new Konva.Layer()
        this.add(this.main_layer);
        this.main_layer.on("mouseover mouseout mousedown", (event) => this._handle_cast_mouse_event(event))

        this.overlay_layer = new Konva.Layer()
        this.add(this.overlay_layer);

        this.overlay_layer2 = new Konva.Layer()
        this.add(this.overlay_layer2);

        this.marker_layer = new Konva.Layer()
        this.add(this.marker_layer);

        this.ruler = new Ruler(this);
        this.back_layer.add(this.ruler)

        this.crosshair = new MouseCrosshair()
        this.overlay_layer.add(this.crosshair)
        this.on("mousemove", () => { this._update_crosshair(); this.schedule_cursor_time() })
        this.container().addEventListener("mouseleave", () => this._hide_crosshair())

        // update canvas on window resize
        this.on("dragmove", this.on_dragmove)
        this.on("wheel", this.on_wheel)
        this.on("contextmenu", this.contextmenu)

        // update canvas on window resize
        window.addEventListener("resize", () => { this.update_width() })
        this.update_width() // initial update
    }

    get FIGHT_SPACE() {
        // distance between fights in pixels
        if (this.MODE == MODES.SPEC_RANKING) { return -1; }
        if (this.MODE == MODES.COMP_RANKING) { return 10; }
        if (this.MODE == MODES.USER_REPORT) { return 38; } // 1 row + 10px gap

        return -1;
    }

    ////////////////////////////////////////////////////////////////////////////
    // CREATION AND DRAW
    //
    update_width() {
        let container = this.container()
        this.width(container.offsetWidth)
    }

    layout_children() {

        // a dungeon run's pull row sits where the ruler is when it is the first fight (see `PullRow`).
        // (the ruler keeps its space: the names column shows the first fight's info next to it)
        // (boss fights with phases the same, but only the first one in a spec ranking: they are stacked without space between)
        const first_row = this.rows.find(row => row.visible())
        this.ruler.set_shown(!first_row?.has_pull_row())
        this.rows.forEach(row => {
            row.has_phases() && row.set_ruler_shown(this.MODE == MODES.USER_REPORT || row === first_row)
        })

        let y = this.ruler.height()

        this.rows.forEach(row => {
            row.y(y)

            const row_height = row.height()
            if (row_height > 0) {
                y += row.height() + this.FIGHT_SPACE + 1 // 1px for border
            }
        })
        this.height(y + 1) // 1 extra to show the border
        this.crosshair.set_height(this.height())
    }

    /** pointer position (px on the stage), once seen: "cursor" timestamps count from it */
    private cursor_x?: number
    private cursor_frame = 0

    /** update the "cursor" timestamps once per frame */
    private schedule_cursor_time() {
        if (this.pull_view.timestamps != "cursor" || this.cursor_frame) { return }
        this.cursor_frame = requestAnimationFrame(() => {
            this.cursor_frame = 0
            const pointer = this.getPointerPosition()
            if (pointer) { this.cursor_x = pointer.x - this.x() }
            this.update_cursor_time()
        })
    }

    private update_cursor_time() {
        if (this.cursor_x === undefined) { return }
        let changed = false
        this.rows.forEach(row => { changed = row.set_cursor(this.cursor_x!) || changed })
        if (changed) { this.batchDraw() }
    }

    /** move the crosshair to the pointer */
    _update_crosshair() {
        const pointer = this.getPointerPosition()
        if (!pointer) { return }
        this.crosshair.move_to((pointer.x - this.x()) / this.scale_x)
        this.overlay_layer.batchDraw()
    }

    _hide_crosshair() {
        this.crosshair.hide_crosshair()
        this.overlay_layer.batchDraw()
    }

    /**
     * Rebuild a player's cache once the browser is idle.
     * Until then the player is drawn uncached: it looks the same, drawing is just slower.
     * (so several events in a row only cache once, and caching never blocks the first draw)
     */
    request_cache(player: Player) {
        this.uncached_players.add(player)
        this._schedule_cache_work()
    }

    _schedule_cache_work() {
        if (this.cache_work_scheduled || this.images_pending) { return }
        if (this.uncached_players.size === 0) { return }

        this.cache_work_scheduled = true
        on_idle((has_time) => {
            this.cache_work_scheduled = false
            this._update_caches(has_time)
        })
    }

    _update_caches(has_time: () => boolean) {
        if (this.images_pending) { return } // caching now would be thrown away once they are in

        const settle_ms = this.zoomed_at + Stage.ZOOM_SETTLE_MS - performance.now()
        if (settle_ms > 0) {
            this.cache_work_scheduled = true
            setTimeout(() => {
                this.cache_work_scheduled = false
                this._schedule_cache_work()
            }, settle_ms)
            return
        }

        let updated = false
        for (const player of this.uncached_players) {
            if (!has_time()) { break }
            if (!player.isVisible()) { continue } // hidden: cache once it is shown again (see `_handle_apply_filters`)

            player.update_cache()
            this.uncached_players.delete(player)
            updated = true
        }

        if (updated) { this.main_layer.batchDraw() }

        // more visible players left: continue in the next idle period
        for (const player of this.uncached_players) {
            if (player.isVisible()) { return this._schedule_cache_work() }
        }
    }

    ////////////////////////////////////////////////////////////////////////////
    // STANDARD EVENTS
    //

    /** One listener for all casts, instead of three on each of them. */
    _handle_cast_mouse_event(event: Konva.KonvaEventObject<MouseEvent>) {
        if (!(event.target instanceof Cast)) { return }
        const cast = event.target

        if (event.type === "mouseover") { cast.hover(true) }
        if (event.type === "mouseout") { cast.hover(false) }
        if (event.type === "mousedown") { cast.handle_mousedown(event) }
    }

    contextmenu(event: Konva.KonvaEventObject<MouseEvent>) {
        event.evt.preventDefault();
    }

    _limit_movement() {
        this.y(0);
        this.x(Math.min(this.x(), 0))
    }

    on_dragmove() {
        this._limit_movement()
        this.batchDraw();
    }

    on_wheel(event: Konva.KonvaEventObject<WheelEvent>) {

        // [alt] --> horizontal scroll
        if (event.evt.altKey || event.evt.deltaX > 0) {
            event.evt.preventDefault();

            /// combine the delata of vertical and horizontal scroll
            let delta = event.evt.deltaX + event.evt.deltaY

            let x = this.x() - delta * Stage.SCROLL_RATE
            this.x(x);

            this.on_dragmove() // trigger updates
            return;
        }

        // only zoom on shift/ctrl + scroll
        if (!(event.evt.shiftKey || event.evt.ctrlKey)) { return; }
        event.evt.preventDefault();

        ////////////////////////////////////
        // update scale

        let pointer = this.getPointerPosition();
        if (!pointer) { return }

        let old_offset = (pointer.x - this.x()) / this.scale_x; // normalized distance between 0:00 and cursor

        this.scale_x = event.evt.deltaY < 0 ? this.scale_x * Stage.ZOOM_RATE : this.scale_x / Stage.ZOOM_RATE;
        this.scale_x = Math.max(this.scale_x, Stage.ZOOM_MIN)

        let new_offset = (old_offset * this.scale_x); // distance between 0:00 and cursor (new scale)
        let new_x = pointer.x - new_offset;

        this.x(new_x);
        this._limit_movement()

        ////////////////////////////////////
        // update scale
        this.zoomed_at = performance.now()
        this.handle_event(constants.EVENT_ZOOM_CHANGE, this.scale_x)
    }

    ////////////////////////////////////////////////////////////////////////////
    // CUSTOM EVENTS

    _handle_spell_selected(selected_spells: number[]) {
        this.has_selection = selected_spells.length > 0;
    }

    _handle_check_images_loaded() {
        // Emit a EVENT_IMAGES_LOADED event once all images have been loaded.
        // until then, periodically emit new "check"-events
        const is_loading = Object.values(IMAGES).some(img => !img.complete)

        // try again later
        if (is_loading) {
            setTimeout(() => { this.handle_event(constants.EVENT_CHECK_IMAGES_LOADED) }, 200)
            return
        }
        // update now
        this.images_pending = false
        this.handle_event(constants.EVENT_IMAGES_LOADED)
    }

    _handle_apply_filters(filters: FilterValues) {
        this.applied_filters = filters
        this.layout_children()
        this._schedule_cache_work() // players that just became visible might still need their cache
    }

    handle_event(event_name: string, payload?: any) {

        if (event_name === constants.EVENT_SPELL_SELECTED) { this._handle_spell_selected(payload) }
        if (event_name === constants.EVENT_CHECK_IMAGES_LOADED) { return this._handle_check_images_loaded() } // return here, as this event should not be passed on

        // pass to children
        this.ruler.handle_event(event_name, payload)
        this.crosshair.handle_event(event_name, payload)
        this.rows.forEach(row => row.handle_event(event_name, payload))

        if (event_name === constants.EVENT_APPLY_FILTERS) { this._handle_apply_filters(payload) }
        if (FightRow.GUTTER_EVENTS.has(event_name)) { this.sync_gaps() }

        // with "hide empty rows", rows whose casts are all hidden now must hide too
        if (event_name === constants.EVENT_SPELL_DISPLAY && this.applied_filters?.hide_empty_rows) {
            this.handle_event(constants.EVENT_APPLY_FILTERS, this.applied_filters)
        }

        // these only change casts: redraw just their layer (every redrawn layer is a full-size canvas)
        if (Stage.CAST_EVENTS.has(event_name)) { this.main_layer.batchDraw() }
        else { this.batchDraw() } // for now, just assume we need to redraw after every other event
    }

    /**
     * Boss fights show their phases next to each other, so the gaps before the segments (see `TimeMap.gaps`) must be as wide in
     * all of them (the widest): else the same phase would start at different positions, and the ruler above the first fight would not fit the others.
     * (dungeon runs have a ruler each: they keep their own)
     */
    private sync_gaps() {
        const rows = this.rows.filter(row => row.visible() && row.has_phases())
        if (!rows.length) { return }

        const wanted = rows.map(row => row.wanted_gaps())
        const gaps = Array.from({ length: Math.max(...wanted.map(w => w.length)) }, (_, i) => Math.max(...wanted.map(w => w[i] || 0)))
        rows.forEach(row => row.apply_gaps(gaps))
    }

    /** Events that only change casts (all on the main layer). */
    static CAST_EVENTS = new Set([constants.EVENT_SPELL_DISPLAY, constants.EVENT_SPELL_SELECTED])

    ////////////////////////////////////////////////////////////////////////////
    // LOAD
    //

    set_fights(new_fights: Fight[]) {

        // clear any old rows
        this.rows.forEach(row => {
            row.destroy()
        })

        this.longest_fight = 0
        this.rows = []
        this.uncached_players.clear()
        this.images_pending = true // until EVENT_CHECK_IMAGES_LOADED below says otherwise

        // create fresh instances
        new_fights.forEach((fight) => {
            const row = new FightRow(fight)
            row.set_pull_view(this.pull_view)
            this.rows.push(row)
        })
        this.longest_fight = this.get_longest_fight()

        // resize before adding the rows: Konva redraws every layer on resize, and the new rows aren't cached yet
        this.layout_children()

        this.rows.forEach(row => {
            this.back_layer.add(row.background)
            this.main_layer.add(row.foreground)
            this.overlay_layer2.add(row.overlay)
        })

        this.ruler.update_duration(this.longest_fight)
        this.handle_event(constants.EVENT_ZOOM_CHANGE, this.scale_x)
        this.handle_event(constants.EVENT_CHECK_IMAGES_LOADED)
    }

    /** length of the longest row (in display time: dungeon runs can be cropped) */
    private get_longest_fight() {
        return Math.max(0, ...this.rows.map(row => row.time_ref.current.duration))
    }

    /** Change how dungeon runs show their pulls: selection, cut out or dimmed, what the timestamps count from. */
    set_pull_view(view: PullView) {
        const previous = this.pull_view
        this.pull_view = view

        let changed = false
        this.rows.forEach(row => {
            const run_changed = previous.hide_unselected != view.hide_unselected
                || previous.timestamps != view.timestamps
                || previous.phase_selection !== view.phase_selection
                || previous.selection[row.run_key] !== view.selection[row.run_key]
            if (run_changed) { row.set_pull_view(view); changed = true }
        })
        if (!changed) { return }
        this.sync_gaps()
        this.update_cursor_time()

        const longest = this.get_longest_fight()
        if (longest != this.longest_fight) {
            this.longest_fight = longest
            this.ruler.update_duration(longest)
            this.ruler.handle_event(constants.EVENT_ZOOM_CHANGE, this.scale_x)
        }
        this.batchDraw()
    }

    set_anchor(ts: number, name: string = "", kind: AnchorKind = "phase") {
        this.anchor_ts = ts
        this.anchor_name = name
        this.anchor_kind = kind
        store.dispatch(set_aligned_phase(ts && kind == "phase" ? name : null))

        this.handle_event(constants.EVENT_ANCHOR_CHANGED, this.get_anchor())
    }

    get_anchor(): Anchor {
        return {
            ts: this.anchor_ts,
            name: this.anchor_name,
            kind: this.anchor_kind,
        }
    }

}
