

/** A Class in the game. eg.: Druid, Shaman, Warrior */
export default interface Class {

    id: number
    name: string
    name_slug: string

    /** full_name_slug for each spec */
    specs: string[]

    /** Maps full_name_slug → Blizzard spec id (null for synthetic specs). */
    spec_ids?: number[]

    // just to silence some TS errors
    class?: any

    // class color (incuding the #)
    color: string

    /** URL to the icon */
    icon_path: string

}
