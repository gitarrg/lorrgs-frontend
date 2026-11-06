/*
    Wowhead tooltips per Game Version: each version's data lives under its own path on wowhead
    (eg.: https://www.wowhead.com/forever/spell=7405), picked with a `domain` in `data-wowhead`.
*/
import { get_game_version_name } from "./api"


/** backend Game Version name -> wowhead domain (none for Retail) */
const DOMAINS: { [game_version: string]: string } = {
    forever: "forever",
    mists: "mop-classic",
}


/** `data-wowhead` for the current Game Version, eg.: "spell=7405" -> "spell=7405&domain=forever". Keeps a domain set by the backend (eg.: ptr). */
export function wowhead_data(data: string | undefined): string | undefined {
    const domain = DOMAINS[get_game_version_name()]
    if (!data || !domain || data.includes("domain=")) { return data }
    return `${data}&domain=${domain}`
}
