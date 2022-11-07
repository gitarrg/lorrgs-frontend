import type Cast from "./cast";
import type Event from "./event";


export default interface Actor {

    //////////////////
    // Base Actor
    casts: Cast[]
    source_id?: number

    //////////////////
    // Player
    name: string
    spec_slug: string
    class_slug: string
    total: number
    deaths: Event[]
    resurrects: Event[]

    //////////////////
    // Boss
    boss_slug?: string

    //////////////////
    // Other
    // spec ranking
    pinned?: boolean
    rank?: number
}
