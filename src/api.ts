// Not the actual api... but all the connections to it and some post processing

import { BACKEND_URL } from "./constants"


const PRINT_REQUEST_TIMES = true

/*
    Each Game Version is served by its own backend.
    The chosen one is remembered across reloads and picked up synchronously on startup,
    so no request is sent to the wrong backend.
*/
const BACKEND_URL_STORAGE_KEY = "lorrgs_backend_url"


function read_stored_backend_url(): string | null {
    try {
        return localStorage.getItem(BACKEND_URL_STORAGE_KEY) || null
    } catch {
        return null // storage can be unavailable (private mode, blocked site data)
    }
}

let backend_url: string = read_stored_backend_url() || BACKEND_URL


/** Base url of the backend we currently talk to. */
export function get_backend_url(): string {
    return backend_url
}


/** Talk to another backend from now on and remember it. `null` goes back to the default one. */
export function set_backend_url(url: string | null) {
    backend_url = url || BACKEND_URL
    try {
        url ? localStorage.setItem(BACKEND_URL_STORAGE_KEY, url) : localStorage.removeItem(BACKEND_URL_STORAGE_KEY)
    } catch { /* nothing to remember it with */ }
}


export async function fetch_data(url: string, params = {}) {

    if (Object.keys(params).length) {
        let search = new URLSearchParams(params)
        if (search) {
            url = url + "?" + search
        }
    }

    url = backend_url + url
    const console_key = `request: ${url}`

    PRINT_REQUEST_TIMES && console.time(console_key)
    // const response = await fetch(url, { mode: 'no-cors' })
    const response = await fetch(url)
    PRINT_REQUEST_TIMES && console.timeEnd(console_key)

    if (!response.ok) {
        const data = await response.json()
        return {
            "status": response.status,
            "error": data?.detail || response.statusText,
        }
    }

    return response.json()
}
