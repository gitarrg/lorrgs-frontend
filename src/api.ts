// Not the actual api... but all the connections to it and some post processing

import { BACKEND_URL } from "./constants"


const PRINT_REQUEST_TIMES = true


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
