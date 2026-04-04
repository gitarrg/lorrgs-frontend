import Event from "./event"

/**
 * A Phase within a fight
 */
export default interface Phase extends Event {

    /** Phase ID */
    id: number

    /** timestamp */
    ts: number

    name?: string
}
