export default interface GameVersion {

    /** unique id (e.g. "retail", "mists", "forever") */
    name: string

    /** display name */
    title: string

    /** Warcraft Logs game version id: a User Report's `game_version` refers to it */
    wcl_game_version: number

    /** show only the selected raid expanded in the navbar (for game versions with many raids). Default: false */
    collapse_raids?: boolean

    /** whether the game version has comp rankings (hides the comp section on the home page otherwise). Default: true */
    has_comp_modes?: boolean
}
