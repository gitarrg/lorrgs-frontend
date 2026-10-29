/*
    Store to manage the available Game Versions (Retail, Classic, ...).

    Each Game Version is served by its own backend: switching sends us to the other one.
*/
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type GameVersion from '../types/game_version'
import { AppDispatch, RootState } from './store'
import { API_URL_BY_GAME_VERSION, BACKEND_URL } from '../constants'
import { fetch_data, get_backend_url, set_backend_url } from '../api'


type GameVersionsSlice = {
    game_versions: GameVersion[]
}


////////////////////////////////////////////////////////////////////////////////
// Selectors
//


export function get_game_versions(state: RootState): GameVersion[] {
    return state.game_versions.game_versions
}


/** The Game Version served by the backend we are connected to. */
export function get_current_game_version(state: RootState): GameVersion | undefined {
    return state.game_versions.game_versions.find(version => version.active)
}


/** Game Versions we can switch to (the current one and everything with a known backend). */
export function get_selectable_game_versions(state: RootState): GameVersion[] {
    return state.game_versions.game_versions.filter(version => version.active || version.api_url)
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
    game_versions: []
}


const SLICE = createSlice({
    name: "game_versions",

    initialState: INITIAL_STATE,

    reducers: {
        set_game_versions: (state, action: PayloadAction<GameVersion[]>) => {
            state.game_versions = action.payload
        },
    },
})

export default SLICE.reducer


////////////////////////////////////////////////////////////////////////////////
// Extra Actions


function with_api_url(version: GameVersion): GameVersion {
    const api_url = API_URL_BY_GAME_VERSION[version.name]
    return api_url ? { ...version, api_url } : version
}


async function fetch_game_versions(): Promise<GameVersion[] | null> {
    try {
        const data = await fetch_data("/api/game_versions")
        return Array.isArray(data) ? data.map(with_api_url) : null
    } catch {
        return null // backend not reachable
    }
}


export function load_game_versions() {

    return async (dispatch: AppDispatch) => {

        dispatch({ type: "ui/set_loading", payload: { key: "game_versions", value: true } })

        let game_versions = await fetch_game_versions()

        // the remembered backend is gone: fall back to the default one
        if (!game_versions && get_backend_url() != BACKEND_URL) {
            set_backend_url(null)
            game_versions = await fetch_game_versions()
        }

        game_versions && dispatch(SLICE.actions.set_game_versions(game_versions))
        dispatch({ type: "ui/set_loading", payload: { key: "game_versions", value: false } })
    }
}


/** Switch to another Game Version. All data is specific to it, so we reload (on `target`, the home page by default). */
export function switch_game_version(game_version: GameVersion, target: string = "/") {

    if (game_version.active) { return }
    if (!game_version.api_url) { return }

    set_backend_url(game_version.api_url)
    window.location.assign(target)
}
