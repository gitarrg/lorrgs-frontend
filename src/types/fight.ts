import type Actor from "./actor";
import type Phase from "./phase";


export default interface Fight {


    fight_id: number
    report_id: string
    report_url: string


    duration: number

    boss?: Actor
    players: Actor[]
    phases: Phase[]

    pinned?: boolean

    /** the zone id of the fight: EU, US, TW, CN, KR */
    region?: string

    /** boss percent at the end of the fight */
    percent?: number

    kill?: boolean

    /** isoformat of the time the fight began. */
    start_time?: string
}

