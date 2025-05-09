

export default interface Spell {

    /** In game ID of the spell. */
    readonly spell_id: number

    /** Type of spell */
    readonly spell_type: string

    /** full name of the spell */
    readonly name: string

    /** HTML color code for the spell */
    readonly color: string

    /** spell cooldown (in seconds) */
    readonly cooldown: number

    /** spell duration (in seconds) */
    readonly duration: number

    /** name of just the icon filename */
    readonly icon: string

    show: boolean

    /** Custom/Additional Tooltip for this Spell. */
    readonly tooltip?: string

    readonly tooltip_info?: string
    readonly wowhead_data?: string

    readonly tags?: string[]

    specs?: string[]

    icon_path: string
}


export type SpellDict = {
    [key: number]: Spell
}

