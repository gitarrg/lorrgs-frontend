import { get_spell_display } from "./store/spells"
import store from "./store/store"
import type { FilterValues } from "./store/ui"
import type Actor from "./types/actor"
import type Fight from "./types/fight"


function get_date_floor_ms(date_str: string): number {
    return Date.parse(`${date_str}T00:00:00.000Z`)
}


function get_date_ceil_ms(date_str: string): number {
    return Date.parse(`${date_str}T23:59:59.999Z`)
}


function is_fight_visible(fight: Fight, filters: FilterValues) {

    if (fight.pinned) { return true }

    let fight_duration = fight.duration / 1000  // ms to s
    if (filters.killtime.min && filters.killtime.min > fight_duration) { return false }
    if (filters.killtime.max && filters.killtime.max < fight_duration) { return false }

    if (fight.region && filters.region && filters.region[fight.region] === false) {
        return false
    }

    const from = filters.log_date?.from
    const to = filters.log_date?.to
    if (from || to) {
        if (!fight.start_time) { return false }

        const fight_ms = Date.parse(fight.start_time)
        if (Number.isNaN(fight_ms)) { return false }

        if (from && fight_ms < get_date_floor_ms(from)) { return false }
        if (to && fight_ms > get_date_ceil_ms(to)) { return false }
    }

    const has_boss = fight.boss && is_player_visible(fight.boss, filters)
    return has_boss || fight.players.some(player => is_player_visible(player, filters))
}



function player_has_visible_casts(player: Actor): boolean {

    // WARNING: this does not listen to updates.
    // so we need to manually retrigger the filtering whenever spell display changes
    const state = store.getState()
    const spell_display = get_spell_display(state);

    return player.casts.some(cast =>
        // can be True or Undefined
        spell_display[cast.id] !== false
    )
}

function is_player_visible(player: Actor, filters: FilterValues) {

    if (player.pinned) { return true }

    // TODO: is this still used?
    if (filters["role"][player.role] === false) { return false }
    if (filters["class"][player.class] === false) { return false }
    if (filters["spec"][player.spec] === false) { return false }

    if (filters.hide_empty_rows) {

        // never hide the boss lane
        if (player.class_slug == "boss") {
            return true
        }

        if (!player_has_visible_casts(player)) {
            return false
        }
    }

    const casts = player.casts
    return casts.length > 0
}


const FILTERS = {
    is_fight_visible,
    is_player_visible,
}

export default FILTERS
