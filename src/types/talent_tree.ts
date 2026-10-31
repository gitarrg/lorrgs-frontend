
/** Talents of one player in one Fight: `{node entry id: rank}` */
export type Talents = { [entry_id: string]: number }


export interface TalentEntry {
    id: number
    name: string
    spell_id: number
    index: number
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
    entries: TalentEntry[]
}


/** The talent tree of one spec, as served by `/api/{game_version}/talent_trees/{spec_slug}` */
export default interface TalentTree {
    spec_id: number
    tree_id: number
    nodes: TalentNode[]
    edges: [number, number][]
    node_order: number[]
}
