/** Generic Event used for things like DeathEvents, Resurrections
 * and maybe other niche features in the future */
export default interface Event {

    /** timestamp */
    ts: number

    /** spell info */
    spell_id?: number
    spell_icon?: string
    spell_name?: string

    /** source player info */
    source_id?: number
    source_name?: number
    source_class?: number

    label?: string

}
