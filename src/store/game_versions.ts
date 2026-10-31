/*
    Store to manage the available Game Versions (Retail, Mists, ...).

    One backend serves all of them (versioned routes: `/api/{game_version}/...`, see `versioned` in api.ts).
    All data in the store is specific to the current Game Version: switching clears it (see `store.ts`)
    and the `GlobalDataLoader` loads it again.
*/
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type GameVersion from '../types/game_version'
import { AppDispatch, RootState } from './store'
import { fetch_data, get_game_version_name, set_game_version_name } from '../api'


/** Action type that makes the root reducer drop all Game Version specific data. */
export const SWITCH_GAME_VERSION = "game_versions/switch"


type GameVersionsSlice = {
    game_versions: GameVersion[]

    /** name of the Game Version we request data for */
    current: string
}


////////////////////////////////////////////////////////////////////////////////
// Selectors
//


export function get_game_versions(state: RootState): GameVersion[] {
    return state.game_versions.game_versions
}


/** The Game Version we currently show data for. */
export function get_current_game_version(state: RootState): GameVersion | undefined {
    return state.game_versions.game_versions.find(version => version.name == state.game_versions.current)
}


/** The Game Version a Warcraft Logs game version id (eg.: of a User Report) belongs to. */
export function get_game_version_by_wcl_id(state: RootState, wcl_game_version?: number): GameVersion | undefined {
    if (wcl_game_version === undefined) { return undefined }
    return state.game_versions.game_versions.find(version => version.wcl_game_version == wcl_game_version)
}


export function get_collapse_raids(state: RootState): boolean {
    return get_current_game_version(state)?.collapse_raids ?? false
}


export function get_has_comp_modes(state: RootState): boolean {
    return get_current_game_version(state)?.has_comp_modes ?? true
}



////////////////////////////////////////////////////////////////////////////////
// Slice
//


const INITIAL_STATE: GameVersionsSlice = {
    game_versions: [],
    current: get_game_version_name(),
}


const SLICE = createSlice({
    name: "game_versions",

    initialState: INITIAL_STATE,

    reducers: {
        /** Request data of another Game Version. */
        switch: (state, action: PayloadAction<string>) => {
            state.current = action.payload
        },

        set_game_versions: (state, action: PayloadAction<GameVersion[]>) => {
            state.game_versions = action.payload

            // the remembered Game Version is gone: fall back to the first one
            if (!action.payload.some(version => version.name == state.current) && action.payload.length) {
                state.current = action.payload[0].name
                set_game_version_name(state.current)
            }
        },
    },
})

export default SLICE.reducer


////////////////////////////////////////////////////////////////////////////////
// Extra Actions


async function fetch_game_versions(): Promise<GameVersion[] | null> {
    try {
        const data = await fetch_data("/api/game_versions")
        return Array.isArray(data) ? data : null
    } catch {
        return null // backend not reachable
    }
}


export function load_game_versions() {

    return async (dispatch: AppDispatch) => {

        dispatch({ type: "ui/set_loading", payload: { key: "game_versions", value: true } })
        try {

            const game_versions = await fetch_game_versions()

            game_versions && dispatch(SLICE.actions.set_game_versions(game_versions))
        } finally {
            dispatch({ type: "ui/set_loading", payload: { key: "game_versions", value: false } })
        }
    }
}


/**
 * Switch to another Game Version, without reloading the page.
 * All data in the store is specific to it: it is dropped and the `GlobalDataLoader` loads the new one.
 * Navigating to `target` (if any) is up to the caller.
 */
export function switch_game_version(game_version: GameVersion) {

    return (dispatch: AppDispatch) => {
        if (game_version.name == get_game_version_name()) { return }

        set_game_version_name(game_version.name)  // before the dispatch: requests from now on are for the new one
        dispatch(SLICE.actions.switch(game_version.name))
    }
}
