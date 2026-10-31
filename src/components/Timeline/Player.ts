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

    /** The row's look changed: redraw its cache right away if possible, else rebuild it once the browser is idle. */
    invalidate_cache() {
        if (!this.refresh_cache()) { this.schedule_cache() }
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

    /** area the cache was built for (see `refresh_cache`) */
    private cached_area?: { x: number, y: number, width: number, height: number }

    /**
     * The area to cache: the clip, ie. everything the row can show.
     * (by default Konva caches the bounds of the visible children, which change whenever a cast is shown or hidden.
     * A fixed area also lets rows without visible casts keep their cache, ready for when casts come back)
     */
    private cache_area() {
        // 1px margin: the cache is drawn at fractional positions (after zooming), and blends with whatever lies past its edges
        const x = Math.floor(this.clipX()) - 1
        const y = Math.floor(this.clipY()) - 1
        return {
            x, y,
            width: Math.ceil(this.clipX() + this.clipWidth()) + 1 - x,
            height: Math.ceil(this.clipY() + this.clipHeight()) + 1 - y,
        }
    }

    update_cache() {
        this.clearCache()
        if (this.clipWidth() * Konva.pixelRatio > Player.MAX_CACHE_WIDTH) { return }
        this.cached_area = this.cache_area()
        this.cache(this.cached_area)
    }

    /**
     * Redraw the existing cache in place, the way Konva's `cache()` draws it.
     * `cache()` would allocate four new canvases, which is most of its cost. Only works while
     * the cached area stays the same (so not after a zoom).
     * @returns false if there is no cache to reuse
     */
    private refresh_cache() {
        // Konva internals (9.x): the cache entry holds the canvases and the offset they were drawn at
        const node = this as any
        const cache = node._cache.get("canvas")
        if (!cache) { return false }

        const area = this.cache_area()
        const old = this.cached_area
        if (!old || area.x !== old.x || area.y !== old.y || area.width !== old.width || area.height !== old.height) { return false }

        const { scene, hit, buffer, x, y } = cache
        const scene_context = scene.getContext()
        const hit_context = hit.getContext()
        scene_context.clear()
        hit_context.clear()

        // a cached node draws its cache: take it out while drawing into it
        node._cache.delete("canvas")
        scene_context.save()
        hit_context.save()
        scene_context.translate(-x, -y)
        hit_context.translate(-x, -y)
        node._isUnderCache = true
        node._clearSelfAndDescendantCache("absoluteOpacity")
        node._clearSelfAndDescendantCache("absoluteScale")
        this.drawScene(scene, this, buffer) // (the buffer canvas still has its offset from `cache()`)
        this.drawHit(hit, this)
        node._isUnderCache = false
        scene_context.restore()
        hit_context.restore()
        node._cache.set("canvas", cache)
        return true
    }

    /** Events that change how the row looks and therefore need the cache rebuilt. */
    static REDRAW_EVENTS = new Set([
        constants.EVENT_ZOOM_CHANGE,
        constants.EVENT_DISPLAY_SETTINGS,
        constants.EVENT_SPELL_SELECTED,
        constants.EVENT_IMAGES_LOADED,
    ])

    //////////////////////////////
    // Events
    //

    _handle_spell_display(payload: { [key: number]: boolean }) {
        let changed = false
        this.casts.forEach(cast => { changed = cast._handle_spell_display(payload) || changed })
        if (!changed) { return } // none of our casts were toggled: keep the cache

        this.layout_children()
        this.invalidate_cache()
    }

    _handle_zoom_change(scale_x: number) {
        this.clipWidth((this.row.duration * scale_x) - 1)  // 1px to allow border to show
    }

    handle_event(event_name: string, payload: any) {
        // only concerns casts, and only the rows with toggled casts need a new cache
        if (event_name === constants.EVENT_SPELL_DISPLAY) { return this._handle_spell_display(payload) }

        if (event_name === constants.EVENT_ZOOM_CHANGE) { this._handle_zoom_change(payload) }
        this.casts.forEach(cast => cast.handle_event(event_name, payload))
        this.deaths.forEach(event => event.handle_event(event_name, payload))
        this.resurrections.forEach(event => event.handle_event(event_name, payload))

        if (Player.REDRAW_EVENTS.has(event_name)) {
            this.invalidate_cache()
        }
    }
}
