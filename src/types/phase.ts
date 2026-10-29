import Event from "./event"

/**
 * A Phase within a fight
 */
export default interface Phase extends Event {

    /** Phase ID */
    id: number

    /** Phase ID as sent by the API (can be fractional, eg.: 2.5) */
    phase_id?: number

    /** timestamp */
    ts: number

    name?: string
}
