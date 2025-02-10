
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type Boss from "../types/boss"
import type { AppDispatch, RootState } from './store'
import { fetch_data } from '../api'
import { group_spells_by_type } from './store_utils'
import { ASSETS, ZONE_ID } from '../constants'
import type RaidZone from '../types/raid_zone'


// TODO:
// Split Zones and Bosses Slices?


////////////////////////////////////////////////////////////////////////////////
// Selectors
//

export function get_zones(state: RootState) {
    return state.zones.zones
}

export function get_zone(state: RootState, zone_id: number) {
    return state.zones.zones[zone_id]
}


/** all bosses in the zone, keyed by their full_name_slug */
export function get_bosses(state: RootState) {
    return state.zones.bosses
}


/** a single boss from the zone (defaults to the currently selected boss) */
export function get_boss(state: RootState, boss_slug?: string) {
    boss_slug = boss_slug ?? state.ui.boss_slug
    return state.zones.bosses[boss_slug] || null
}


////////////////////////////////////////////////////////////////////////////////
// Slice
//

function _post_process_boss(zone: RaidZone, boss: Boss) {
    boss.loaded = false
    boss.icon_path = `${ASSETS}/images/spells/${boss.icon}`
    boss.zone_id = zone.id

    // insert some static data
    boss.role = "boss"
    boss.class = { name: "boss", name_slug: "boss" }
}


interface RaidZoneAPIResponse {
    id: -1,
    name: "",
    name_slug: "",
    bosses: Boss[],
}


const INITIAL_STATE = {
    zones: {} as { [key: number]: RaidZone },
    bosses: {} as { [key: string]: Boss },
}

const SLICE = createSlice({
    name: "zones",

    initialState: INITIAL_STATE,

    reducers: {

        set_zone: (state, action: PayloadAction<RaidZoneAPIResponse>) => {


            const zone: RaidZone = {
                id: action.payload.id,
                name: action.payload.name,
                name_slug: action.payload.name_slug,
                bosses: []
            }
            state.zones[zone.id] = zone

            action.payload.bosses = action.payload.bosses || []  // ensure its not empty
            action.payload.bosses.forEach(boss => {
                _post_process_boss(zone, boss)

                state.bosses[boss.full_name_slug] = boss
                zone.bosses.push(boss.full_name_slug)
            });

            return state
        },

        set_boss_spells: (state, action) => {
            const { boss_slug, spells } = action.payload
            const boss = state.bosses[boss_slug]
            if (!boss) { return }

            boss.spells_by_type = group_spells_by_type(spells, boss)
            boss.loaded = true
            return state
        }
    },
})

export const {
    set_boss_spells
} = SLICE.actions

export default SLICE.reducer


////////////////////////////////////////////////////////////////////////////////
// Extra Actions

/* load all bosses */
export function load_bosses(zone_id?: number) {

    zone_id = zone_id || ZONE_ID

    return async (dispatch: AppDispatch) => {

        dispatch({ type: "ui/set_loading", payload: { key: "zone", value: true } })

        // Request
        const zone_info = await fetch_data(`/api/zones/${zone_id}`);

        dispatch(SLICE.actions.set_zone(zone_info))
        dispatch({ type: "ui/set_loading", payload: { key: "zone", value: false } })
    }
}


/**
 * Load Spells for a given boss
 * @param {string} boss_slug name of the boss whom's spells to load
 */
export function load_boss_spells(boss_slug: string) {

    return async (dispatch: AppDispatch) => {

        const load_key = `boss/${boss_slug}`
        dispatch({ type: "ui/set_loading", payload: { key: load_key, value: true } })

        // Request
        const spells: RaidZoneAPIResponse = await fetch_data(`/api/bosses/${boss_slug}/spells`);

        dispatch(SLICE.actions.set_boss_spells({ boss_slug, spells }))
        dispatch({ type: "ui/set_loading", payload: { key: load_key, value: false } })
    }
}
