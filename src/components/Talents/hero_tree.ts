import { ASSETS } from "../../constants"
import type TalentTree from "../../types/talent_tree"
import type { Talents } from "../../types/talent_tree"


export interface HeroTree {
    name: string
    slug: string
    icon_path: string
}


/** The hero tree a player picked: the one that has a talent of theirs. `null` if there is none (no talents, no hero tree selected). */
export function get_hero_tree(tree: TalentTree | null | undefined, talents: Talents | undefined): HeroTree | null {
    if (!tree || !talents) { return null }
    for (const node of tree.nodes) {
        if (!node.hero_tree || !node.hero_tree_slug) { continue }
        if (node.entries.some(entry => talents[entry.id])) {
            return {
                name: node.hero_tree,
                slug: node.hero_tree_slug,
                icon_path: `${ASSETS}/images/hero_trees/${node.hero_tree_slug}.png`,
            }
        }
    }
    return null
}
