import * as constants from "./constants"
import Cast from "./Cast"
import Death from "./Death"
import Konva from "konva"
import Resurrection from "./Resurrection"
import type Actor from "../../types/actor"
import type PlayerRow from "./PlayerRow"
import type Stage from "./Stage"


export default class Player extends Konva.Group {

    row: PlayerRow
    casts: Cast[]
    deaths: Death[]
    resurrections: Resurrection[]
    player_data: Actor

    constructor(row: PlayerRow, player_data: Actor) {
        super()
        this.row = row
        this.transformsEnabled("position")

        this.clip({
            x: 0,
            y: 1,
            width: this.row.duration * constants.DEFAULT_ZOOM,
            height: constants.LINE_HEIGHT,
        })

        this.player_data = player_data

        // load casts
        this.casts = (player_data.casts || []).map(cast_data => new Cast(cast_data))
        this.casts = this.casts.filter(cast => cast.spell)

        // sub events
        this.deaths = (player_data.deaths || []).map(death_data => new Death(player_data, death_data))
        this.resurrections = (player_data.resurrects || []).map(resurrect_data => new Resurrection(player_data, resurrect_data))
        this.layout_children()
    }

    layout_children() {

        // Rebuild the child list in one pass instead of moveToTop() per cast (O(n) each).
        // Casts are sorted by time, so adding them in order fixes overlaps; deaths and resurrections go on top.
        const visible_casts = this.casts.filter(cast => cast.spell && cast.visible())

        this.removeChildren()
        this.add(...visible_casts, ...this.deaths, ...this.resurrections)
    }

    /** Drop the cache now and let the stage rebuild it once the browser is idle. */
    schedule_cache() {
        this.clearCache() // clear to make sure we update (even if eg: all children are hidden)

        const stage = this.getStage() as Stage | null
        stage?.request_cache(this) // not on a stage: nothing to draw, nothing to cache
    }

    /**
     * Widest cache we build, in device pixels. Konva allocates four canvases per cache,
     * so wide ones (when zoomed in) cost a lot of memory and can hit the browser's canvas size limits.
     * Wider rows are drawn uncached.
     */
    static MAX_CACHE_WIDTH = 4096

    update_cache() {
        this.clearCache()
        if (!this.hasChildren()) { return }
        if (this.clipWidth() * Konva.pixelRatio > Player.MAX_CACHE_WIDTH) { return }
        this.cache()
    }

    /** Events that change how the row looks and therefore need the cache rebuilt. */
    static REDRAW_EVENTS = new Set([
        constants.EVENT_ZOOM_CHANGE,
        constants.EVENT_SPELL_DISPLAY,
        constants.EVENT_DISPLAY_SETTINGS,
        constants.EVENT_SPELL_SELECTED,
        constants.EVENT_IMAGES_LOADED,
    ])

    //////////////////////////////
    // Events
    //

    _handle_spell_display() {
        this.layout_children()
    }

    _handle_zoom_change(scale_x: number) {
        this.clipWidth((this.row.duration * scale_x) - 1)  // 1px to allow border to show
    }

    handle_event(event_name: string, payload: any) {
        if (event_name === constants.EVENT_ZOOM_CHANGE) { this._handle_zoom_change(payload) }
        this.casts.forEach(cast => cast.handle_event(event_name, payload))
        this.deaths.forEach(event => event.handle_event(event_name, payload))
        this.resurrections.forEach(event => event.handle_event(event_name, payload))

        // after cast update, so we can handle the cast visibility in there
        if (event_name === constants.EVENT_SPELL_DISPLAY) { this._handle_spell_display() }

        if (Player.REDRAW_EVENTS.has(event_name)) {
            this.schedule_cache()
        }
    }
}
