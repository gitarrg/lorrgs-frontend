import type Boss from "./boss";


export default interface RaidZone {

    /** zone ID */
    id: number

    name: string
    name_slug: string

    /** boss names (slug) of all bosses in this zone (in order) */
    bosses: string[]
}
