import Event from "./event"

/**
 * A Phase within a fight
 */
export default interface Phase extends Event {

    /** timestamp */
    ts: number

    label?: string

    /** MRT Trigger Expression
     * eg.: SPELL_CAST_SUCCESS:442432:1
     */
    mrt?: string

}
