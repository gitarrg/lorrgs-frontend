/*
    The Talent Filter a Build button applies. Spec and hero talents only, taken from the main loadout of the Build:
    - the capstones: the lowest node of the spec tree and of the Build's hero tree (a tiered one: its highest tier taken)
    - every choice node: the entry the Build picked
    - the first node of the Build's hero tree
    - the fewest talents that tell it from the other Builds on its hero tree, that the above doesn't tell apart yet
      (greedy set cover: the talent ruling out most of them, choice nodes then the highest node on a tie)
*/
import type { TalentFilter } from "../../store/ui"
import type TalentTree from "../../types/talent_tree"
import type { TalentNode, Talents } from "../../types/talent_tree"


export interface BuildDefinition {
    hero_tree: string | null
    talents: Talents
}


const is_choice = (node: TalentNode) => node.type == "choice" || node.type == "hero_selection"
const has_talent = (talents: Talents, entry_id: number) => (talents[entry_id] || 0) > 0


/** whether the filter lets these talents through */
function matches(filter: TalentFilter, talents: Talents): boolean {
    return Object.entries(filter).every(([id, mode]) => has_talent(talents, Number(id)) == (mode == "with"))
}


export function build_preset_filter(tree: TalentTree, build: BuildDefinition, others: BuildDefinition[]): TalentFilter {

    const filter: TalentFilter = {}
    const taken = (entry_id: number) => has_talent(build.talents, entry_id)

    /** with the entries the Build has, without the ones it lacks */
    function add_node(node: TalentNode) {
        if (node.type == "tiered") {  // a tier implies the ones below: only the highest taken, else without the first
            const highest = node.entries.filter(entry => taken(entry.id)).at(-1)
            if (highest) { filter[highest.id] = "with" }
            else if (node.entries.length) { filter[node.entries[0].id] = "without" }
            return
        }
        node.entries.forEach(entry => {
            if (taken(entry.id)) { filter[entry.id] = "with" }
            else if (!is_choice(node)) { filter[entry.id] = "without" }
        })
    }

    const spec_nodes = tree.nodes.filter(node => node.tree == "spec")
    const hero_nodes = tree.nodes.filter(node => node.tree == "hero" && node.hero_tree_slug == build.hero_tree)
    const ends = (nodes: TalentNode[], pick: typeof Math.max) => {
        const y = pick(...nodes.map(node => node.y))
        return nodes.filter(node => node.y == y)
    }

    ends(spec_nodes, Math.max).forEach(add_node)  // capstones
    if (hero_nodes.length) {
        ends(hero_nodes, Math.max).forEach(add_node)
        ends(hero_nodes, Math.min).forEach(add_node)  // first node
    }
    tree.nodes.filter(node => node.tree != "class" && is_choice(node)).forEach(add_node)

    // the other Builds on the hero tree, still let through
    let remaining = others
        .filter(other => other.hero_tree == build.hero_tree)
        .filter(other => matches(filter, other.talents))

    const candidates = tree.nodes
        .filter(node => node.tree != "class")
        .flatMap(node => node.entries.map(entry => ({ entry_id: entry.id, choice: is_choice(node), y: node.y })))
        .filter(candidate => !(candidate.entry_id in filter))

    while (remaining.length) {
        const rules_out = (entry_id: number) => remaining
            .filter(other => has_talent(other.talents, entry_id) != taken(entry_id)).length
        let best: typeof candidates[number] | undefined
        let best_count = 0
        for (const candidate of candidates) {
            const count = rules_out(candidate.entry_id)
            if (!count) { continue }
            const better = count > best_count || (count == best_count && best && (
                candidate.choice != best.choice ? candidate.choice : candidate.y < best.y
            ))
            if (better) { best = candidate; best_count = count }
        }
        if (!best) { break }  // the rest only differ in ranks
        filter[best.entry_id] = taken(best.entry_id) ? "with" : "without"
        remaining = remaining.filter(other => matches(filter, other.talents))
    }
    return filter
}
