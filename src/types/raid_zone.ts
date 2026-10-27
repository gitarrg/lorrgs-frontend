import type Boss from "./boss";


export default interface RaidZone {

    /** zone ID */
    id: number

    name: string
    name_slug: string

    /** the only difficulty ranked in this zone (`null` = the user picks one) */
    difficulty: string | null

    /** boss names (slug) of all bosses in this zone (in order) */
    bosses: string[]
}
