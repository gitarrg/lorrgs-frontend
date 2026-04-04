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

/** Assign per-spell cast counters on the actor (mutates and returns the same object). */
export function normalize_actor(actor: Actor): Actor {
    const spell_counter: { [key: number]: number } = {};
    actor.casts = actor.casts || [];
    actor.casts.forEach((cast) => {
        cast.counter = spell_counter[cast.id] = (spell_counter[cast.id] || 0) + 1;
    });
    return actor;
}
