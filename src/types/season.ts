

export default interface Season {

    name: string
    slug: string

    /** Raids in this Season */
    raids: number[]

    /** show only the selected raid expanded in the navbar (for game versions with many raids). Default: false */
    collapse_raids?: boolean

    /** whether the game version has comp rankings (hides the comp section on the home page otherwise). Default: true */
    has_comp_modes?: boolean
}

