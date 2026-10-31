// Not the actual api... but all the connections to it and some post processing

import { BACKEND_URL } from "./constants"


const PRINT_REQUEST_TIMES = false

/*
    One backend serves every Game Version: versioned routes live under `/api/{game_version}/...`.
    The chosen Game Version is remembered across reloads and picked up synchronously on startup.
*/
const GAME_VERSION_STORAGE_KEY = "lorrgs_game_version"
export const DEFAULT_GAME_VERSION = "retail"


function read_stored_game_version(): string | null {
    try {
        return localStorage.getItem(GAME_VERSION_STORAGE_KEY) || null
    } catch {
        return null // storage can be unavailable (private mode, blocked site data)
    }
}

let game_version_name: string = read_stored_game_version() || DEFAULT_GAME_VERSION


/** Name of the Game Version we currently request data for. */
export function get_game_version_name(): string {
    return game_version_name
}


/** Request data for another Game Version from now on and remember it. */
export function set_game_version_name(name: string) {
    game_version_name = name
    try {
        localStorage.setItem(GAME_VERSION_STORAGE_KEY, name)
    } catch { /* nothing to remember it with */ }
}


/**
 * Fetch a versioned route (see `versioned`).
 * Returns `null` if the Game Version changed while waiting: the response belongs to the previous one and has to be dropped.
 */
export async function fetch_versioned(path: string, params = {}) {
    const requested_for = game_version_name
    const data = await fetch_data(versioned(path), params)
    return requested_for == game_version_name ? data : null
}


/** Path of a versioned route (roles, classes, specs, spells, zones, bosses, seasons, spec_ranking, comp_ranking). */
export function versioned(path: string): string {
    return `/api/${game_version_name}${path}`
}


export async function fetch_data(url: string, params = {}) {

    if (Object.keys(params).length) {
        let search = new URLSearchParams(params)
        if (search) {
            url = url + "?" + search
        }
    }

    url = BACKEND_URL + url
    const console_key = `request: ${url}`

    PRINT_REQUEST_TIMES && console.time(console_key)
    // const response = await fetch(url, { mode: 'no-cors' })
    const response = await fetch(url)
    PRINT_REQUEST_TIMES && console.timeEnd(console_key)

    if (!response.ok) {
        const data = await response.json().catch(() => null) // e.g. a 502 HTML page
        return {
            "status": response.status,
            "error": data?.detail || response.statusText,
        }
    }

    return response.json()
}
