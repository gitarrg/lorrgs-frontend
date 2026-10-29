

export const DEBUG = import.meta.env.VITE_DEBUG
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://forever-api.lorrgs.io"  // tmp

/** Backend base url for a game version */
//@ts-format-ignore-region
export const API_URL_BY_GAME_VERSION: { [name: string]: string } = {
    retail: import.meta.env.LORRGS_API_URL_RETAIL || "https://retail.lorrgs.io",
    mists: import.meta.env.LORRGS_API_URL_MISTS || "https://mists-api.lorrgs.io",
    forever: import.meta.env.LORRGS_API_URL_FOREVER || "https://forever-api.lorrgs.io",
}


export const LOGO_URL = "/static/logo.svg";
export const ASSETS = "https://assets2.lorrgs.io"


// Third Party
export const WCL_URL = "https://www.warcraftlogs.com"
export const DISCORD_LINK = "https://discord.gg/jZWj6djJk2"
export const PATREON_LINK = "https://www.patreon.com/lorrgs"
export const BUYMEACOFFEE_LINK = "https://www.buymeacoffee.com/lorrgs"
export const DISCORD_CLIENT_ID = "903080290925293628"
export const DISCORD_LOGIN_URL = "https://discord.com/oauth2/authorize"



export const DIFFICULTIES = {
    HEROIC: "heroic",
    MYTHIC: "mythic",
}

export const DEFAULT_DIFFICULTY = DIFFICULTIES.MYTHIC

/** difficulty token for zones that rank a single difficulty (`RaidZone.difficulty`): the backend picks it. */
export const AUTO_DIFFICULTY = "auto"


///////////////////////////////////
// UI: Timeline
export const LINE_HEIGHT = 28
export const DEFAULT_ZOOM = 4


