/*
Links between the pulls and the players of a User Report: who was in which pull.

Drives the selection page (`/user_report`): hovering a pull highlights its players (and the other way round),
selected pulls grey out players who weren't in any of them (and the other way round) and a tooltip lists them.
Which of these are on is up to the user's View Settings.

Only the pulls the page shows count: pulls of bosses or dungeons we don't know aren't shown,
and players who were only in those are hidden.
*/
import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { AppDispatch, RootState } from './store'
import type Fight from '../types/fight'
import { get_user_report_fights, get_user_report_players } from './user_reports'


////////////////////////////////////////////////////////////////////////////////
// Types
//

/**
 * A pull ("fight") or player on the selection page.
 * `kind` is also the name of its form field: the item is checked as `fight[12]` / `player[34]`.
 */
export type LinkItem = { kind: "fight" | "player", id: number }

/** the other kind: the players of a pull / the pulls of a player */
export function get_linked_kind(kind: LinkItem["kind"]): LinkItem["kind"] {
    return kind == "fight" ? "player" : "fight"
}

/** where the hovered item is on screen (to place the tooltip) */
export type LinkAnchor = { left: number, right: number, top: number, bottom: number }

export type LinkHover = LinkItem & { anchor: LinkAnchor }

export interface ViewSettings {
    /** hovering a pull highlights its players */
    hover_fight: boolean
    /** hovering a player highlights their pulls */
    hover_player: boolean
    /** selected pulls grey out players who weren't in any of them (and the other way round) */
    grey_out: boolean
    /** tooltip listing the players of a pull / the pulls of a player */
    tooltip: boolean
}

/** how an item shows, from the hovered and selected items: space separated, eg. "dim grey" */
export type LinkState = `${"" | "linked" | "dim"}${"" | " grey"}`


////////////////////////////////////////////////////////////////////////////////
// View Settings (stored per browser)
//

const SETTINGS_STORAGE_KEY = "lorrgs_report_view_settings"

export const DEFAULT_VIEW_SETTINGS: ViewSettings = {
    hover_fight: true,
    hover_player: true,
    grey_out: false,
    tooltip: true,
}


function read_view_settings(): ViewSettings {
    try {
        const stored = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || "{}")
        return { ...DEFAULT_VIEW_SETTINGS, ...stored }
    } catch {
        return DEFAULT_VIEW_SETTINGS  // storage can be unavailable (private mode, blocked site data)
    }
}


function store_view_settings(settings: ViewSettings) {
    try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    } catch { /* nothing to remember it with */ }
}


////////////////////////////////////////////////////////////////////////////////
// Slice
//

interface ReportLinksState {
    settings: ViewSettings
    hovered: LinkHover | null
    selected_fight_ids: number[]
    selected_player_ids: number[]
}


const INITIAL_STATE: ReportLinksState = {
    settings: read_view_settings(),
    hovered: null,
    selected_fight_ids: [],
    selected_player_ids: [],
}


const SLICE = createSlice({
    name: "report_links",
    initialState: INITIAL_STATE,

    reducers: {
        set_view_setting_value: (state, action: PayloadAction<{ key: keyof ViewSettings, value: boolean }>) => {
            state.settings[action.payload.key] = action.payload.value
        },

        set_hovered: (state, action: PayloadAction<LinkHover | null>) => {
            state.hovered = action.payload
        },

        /** mirror of the selection in the form (see `LinkSelectionSync`) */
        set_selection: (state, action: PayloadAction<{ fight_ids: number[], player_ids: number[] }>) => {
            state.selected_fight_ids = action.payload.fight_ids
            state.selected_player_ids = action.payload.player_ids
        },
    },
})

export default SLICE.reducer
export const { set_hovered, set_selection } = SLICE.actions


/** change one View Setting and remember it */
export function set_view_setting(key: keyof ViewSettings, value: boolean) {
    return (dispatch: AppDispatch, getState: () => RootState) => {
        dispatch(SLICE.actions.set_view_setting_value({ key, value }))
        store_view_settings(getState().report_links.settings)
    }
}


////////////////////////////////////////////////////////////////////////////////
// Selectors
//

export function get_view_settings(state: RootState) {
    return state.report_links.settings
}

export function get_hovered(state: RootState) {
    return state.report_links.hovered
}

/** whether hovering an item does anything */
export function get_hover_enabled(state: RootState) {
    const { hover_fight, hover_player, tooltip } = state.report_links.settings
    return hover_fight || hover_player || tooltip
}


/** a pull's group on the page: its boss, or its dungeon for a whole dungeon run */
export function get_fight_group(fight: Fight) {
    return fight.boss?.boss_slug || (fight.dungeon ?? "")
}


/** The fights the pull selection shows (see `FightSelectList`): those of the bosses and dungeons we know. */
export const get_shown_fights = createSelector(
    get_user_report_fights,
    (state: RootState) => state.zones.bosses,
    (state: RootState) => state.dungeons,
    (fights, bosses, dungeons) => fights.filter(fight => {
        const boss_slug = fight.boss?.boss_slug
        return boss_slug ? !!bosses[boss_slug] : !!(fight.dungeon && dungeons[fight.dungeon])
    })
)


/**
 * Whether the shown fights know their players (overviews loaded before that don't).
 * Also false while the zone/dungeons of the report load and no fight is shown yet.
 */
export const get_has_player_data = createSelector(
    get_shown_fights,
    (fights) => fights.some(fight => fight.player_ids?.length)
)


/** source ids of the report's players (fights may list others, eg. pets) */
const get_report_player_ids = createSelector(
    get_user_report_players,
    (players) => new Set(players.map(player => player.source_id!))
)


/** fight id -> its number within its boss/dungeon (as labeled in the pull selection) */
export const get_fight_numbers = createSelector(
    get_shown_fights,
    (fights) => {
        const counters: { [group: string]: number } = {}
        const numbers: { [fight_id: number]: number } = {}
        fights.forEach(fight => {
            const group = get_fight_group(fight)
            numbers[fight.fight_id] = counters[group] = (counters[group] || 0) + 1
        })
        return numbers
    }
)


/** fight id -> source ids of the report's players in that fight (shown fights only) */
export const get_player_ids_by_fight = createSelector(
    get_shown_fights,
    get_report_player_ids,
    (fights, report_player_ids) => {
        const result: { [fight_id: number]: Set<number> } = {}
        fights.forEach(fight => {
            result[fight.fight_id] = new Set((fight.player_ids || []).filter(id => report_player_ids.has(id)))
        })
        return result
    }
)


/** player source id -> ids of the shown fights that player took part in */
export const get_fight_ids_by_player = createSelector(
    get_player_ids_by_fight,
    (players_by_fight) => {
        const result: { [player_id: number]: Set<number> } = {}
        Object.entries(players_by_fight).forEach(([fight_id, player_ids]) => {
            player_ids.forEach(player_id => {
                (result[player_id] ??= new Set()).add(Number(fight_id))
            })
        })
        return result
    }
)


/** The players the player selection shows: without those who were in none of the shown pulls. */
export const get_shown_players = createSelector(
    get_user_report_players,
    get_fight_ids_by_player,
    get_has_player_data,
    (players, fights_by_player, has_player_data) => {
        if (!has_player_data) { return players }  // can't tell: show everyone
        return players.filter(player => fights_by_player[player.source_id!])
    }
)


/** ids of the items of the other kind linked to `item`: the (shown) players of a pull / the (shown) pulls of a player */
export function get_linked_ids(state: RootState, item: LinkItem): number[] {
    const ids = item.kind == "fight" ? get_player_ids_by_fight(state)[item.id] : get_fight_ids_by_player(state)[item.id]
    return [...(ids || [])]
}


/** the items linked to the hovered one, while hovering highlights anything */
const get_hover_links = createSelector(
    get_hovered,
    get_view_settings,
    get_player_ids_by_fight,
    get_fight_ids_by_player,
    (hovered, settings, players_by_fight, fights_by_player) => {
        if (!hovered) { return null }
        if (hovered.kind == "fight" && settings.hover_fight) {
            return { kind: "player", ids: players_by_fight[hovered.id] || new Set<number>() }
        }
        if (hovered.kind == "player" && settings.hover_player) {
            return { kind: "fight", ids: fights_by_player[hovered.id] || new Set<number>() }
        }
        return null
    }
)


/** the items to grey out: not linked to any selected item of the other kind */
const get_greyed = createSelector(
    get_view_settings,
    get_has_player_data,
    (state: RootState) => state.report_links.selected_fight_ids,
    (state: RootState) => state.report_links.selected_player_ids,
    get_player_ids_by_fight,
    get_fight_ids_by_player,
    (settings, has_player_data, selected_fight_ids, selected_player_ids, players_by_fight, fights_by_player) => {
        const greyed = { fight: new Set<number>(), player: new Set<number>() }
        if (!settings.grey_out || !has_player_data) { return greyed }

        if (selected_fight_ids.length) {
            Object.keys(fights_by_player).map(Number).forEach(player_id => {
                const fights = fights_by_player[player_id]
                if (!selected_fight_ids.some(id => fights.has(id))) { greyed.player.add(player_id) }
            })
        }
        if (selected_player_ids.length) {
            Object.keys(players_by_fight).map(Number).forEach(fight_id => {
                const players = players_by_fight[fight_id]
                if (!selected_player_ids.some(id => players.has(id))) { greyed.fight.add(fight_id) }
            })
        }
        return greyed
    }
)


/** How one item shows. A string, so that items only re-render when theirs changes. */
export function get_link_state(state: RootState, item: LinkItem): LinkState {
    const hover = get_hover_links(state)
    const grey = get_greyed(state)[item.kind].has(item.id)

    const hover_state = hover?.kind == item.kind ? (hover.ids.has(item.id) ? "linked" : "dim") : ""
    return `${hover_state}${grey ? " grey" : ""}` as LinkState
}
