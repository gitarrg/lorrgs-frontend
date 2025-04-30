import { get_spell_display } from "./store/spells"
import store from "./store/store"
import type { FilterValues } from "./store/ui"
import type Actor from "./types/actor"
import type Fight from "./types/fight"


function is_fight_visible(fight: Fight, filters: FilterValues) {

    if (fight.pinned) { return true }

    let fight_duration = fight.duration / 1000  // ms to s
    if (filters.killtime.min && filters.killtime.min > fight_duration) { return false }
    if (filters.killtime.max && filters.killtime.max < fight_duration) { return false }

    if (fight.region && filters.region && filters.region[fight.region] === false) {
        return false
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
