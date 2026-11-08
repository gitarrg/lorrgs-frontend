import type Actor from "./actor";
import type Phase from "./phase";


export interface Pull {
    start: number
    end: number
    boss: string | null
    /** only the phases of a boss fight (see `get_phase_spans`): their name, eg. "P2" */
    name?: string
}


export default interface Fight {


    fight_id: number
    report_id: string
    report_url: string


    duration: number

    boss?: Actor

    /** slug of the Dungeon, for a whole dungeon run (which has no boss) */
    dungeon?: string | null
    players: Actor[]

    /** source ids of every player that took part in the fight (from the report overview) */
    player_ids?: number[]

    phases: Phase[]

    /**
     * The pulls of a dungeon run, in Warcraft Logs order (empty/missing otherwise).
     * `start`/`end`: milliseconds since the run started (same clock as the casts).
     * `boss`: name of the boss for a boss pull, null for trash.
     */
    pulls?: Pull[]

    /** Mythic+ keystone level (0/missing: unknown) */
    keystone_level?: number
    /** Mythic+ run time in ms, as Warcraft Logs reports it */
    keystone_time?: number
    /** 0 = depleted, 1/2/3 = timed at +1/+2/+3 */
    keystone_bonus?: number
    keystone_affixes?: number[]

    pinned?: boolean

    /** the zone id of the fight: EU, US, TW, CN, KR */
    region?: string

    /** boss percent at the end of the fight */
    percent?: number

    kill?: boolean

    /** isoformat of the time the fight began. */
    start_time?: string

    /** WCL id: 0 unknown, 1 LFR, 3 normal, 4 heroic, 5 mythic */
    difficulty: number;
}

