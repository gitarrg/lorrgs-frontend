export default interface GameVersion {

    /** unique id (e.g. "retail", "classic_mop") */
    name: string

    /** display name */
    title: string

    /** base url of the backend serving this game version (empty: not reachable from here) */
    api_url: string

    /** whether the backend we are connected to serves this game version */
    active: boolean

    /** show only the selected raid expanded in the navbar (for game versions with many raids). Default: false */
    collapse_raids?: boolean

    /** whether the game version has comp rankings (hides the comp section on the home page otherwise). Default: true */
    has_comp_modes?: boolean
}
