
import type Spec from "./spec"

/**
 * Type for a Boss in the Game.
 *
 * There can only be one of each type. eg.: there is only one "Painsmith Raznal"
 */
export default interface Boss extends Spec {

    class: {
        name: "boss"
        name_slug: "boss"
    }

    role: "boss"

    /** encounter ID */
    id: number

    zone_id: number
}
