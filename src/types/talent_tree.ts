
/** Talents of one player in one Fight: `{node entry id: rank}` */
export type Talents = { [entry_id: string]: number }


export interface TalentEntry {
    id: number
    name: string
    spell_id: number
    /** icon filename, eg.: "spell_nature_rejuvenation.jpg". Empty if unknown */
    icon: string
    index: number

    /** the talent's spell is passive */
    passive?: boolean

    /** `Enum.TraitNodeEntryType`
     * eg.: "spend_square" (drawn square ingame: mostly active talents),
     * "spend_circle"
     * */
    entry_type?: string
}


export interface TalentNode {
    id: number
    x: number
    y: number
    type: "single" | "tiered" | "choice" | "hero_selection"
    max_ranks: number
    tree: "class" | "spec" | "hero"
    /** name of the hero tree (for nodes in one) */
    hero_tree: string | null
    /** slug of the hero tree, also the name of its icon: "elunes-chosen" */
    hero_tree_slug: string | null
    /** Tab of a three-tab tree (WoW Forever): 0-2, left to right */
    tab?: number
    /** Tab trees: points spent in the node's tab to unlock its row (0, 5, ..., 30) */
    required_points?: number
    entries: TalentEntry[]
}


/** The talent tree of one spec, as served by `/api/{game_version}/talent_trees/{spec_slug}` */
export default interface TalentTree {
    spec_id: number
    tree_id: number
    nodes: TalentNode[]
    edges: [number, number][]
    /** node ids in the order of the import string. Empty if the tree has no known import string (WoW Forever) */
    node_order: number[]
    /** Three-tab trees (WoW Forever): the spec id of each tab, left to right */
    tabs?: number[]
    /** Three-tab trees: talent points a player can spend */
    max_points?: number
}
