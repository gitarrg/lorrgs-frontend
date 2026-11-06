/** The look of the talent trees, named after the expansion that introduced it (see `tree_style.ts`). */
export type TalentTreeStyleName = "classic" | "mists" | "dragonflight"


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

    /** whether Spec Ranking players carry their Talents. Default: false */
    has_talents?: boolean

    /** the look of the talent trees. Default: "dragonflight" */
    talent_tree_style?: TalentTreeStyleName
}
