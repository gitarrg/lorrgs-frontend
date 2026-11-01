/*
    The Talent Filter a Build button applies. Spec and hero talents only, taken from the main loadout of the Build:
    - the capstone: the lowest node of the spec tree (a tiered one: its highest tier taken)
    - every choice node the Build picked an entry of, if another Build plays the other one
    - the fewest talents that tell it from the other Builds, that the above doesn't tell apart yet
      (greedy set cover: the talent ruling out most of them; on a tie choice nodes, then "only with", then the highest node).
      Other choice nodes only come in this way.
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


export interface BuildPreset {
    filter: TalentFilter
    /** "only with" talents that tell it from other Builds (not the capstone or the hero tree): to show as icons */
    key_talents: number[]
}


export function build_preset_filter(tree: TalentTree, build: BuildDefinition, others: BuildDefinition[]): BuildPreset {

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
    const capstone_y = Math.max(...spec_nodes.map(node => node.y))
    spec_nodes.filter(node => node.y == capstone_y).forEach(add_node)
    const base = new Set(Object.keys(filter).map(Number))

    // choice nodes the Builds disagree on (the hero tree selection is covered by the hero nodes)
    tree.nodes
        .filter(node => node.tree != "class" && node.type == "choice")
        .forEach(node => {
            const picked = node.entries.find(entry => taken(entry.id))
            const contested = picked && others.some(other => node.entries.some(entry =>
                entry.id != picked.id && has_talent(other.talents, entry.id)))
            if (contested) { filter[picked.id] = "with" }
        })

    // the other Builds, still let through (those on another hero tree too: its selection usually rules them out)
    let remaining = others.filter(other => matches(filter, other.talents))

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
                candidate.choice != best.choice ? candidate.choice
                    : taken(candidate.entry_id) != taken(best.entry_id) ? taken(candidate.entry_id)
                        : candidate.y < best.y
            ))
            if (better) { best = candidate; best_count = count }
        }
        if (!best) { break }  // the rest only differ in ranks
        filter[best.entry_id] = taken(best.entry_id) ? "with" : "without"
        remaining = remaining.filter(other => matches(filter, other.talents))
    }
    // the hero tree selection: shown as the hero tree icon
    const hero_selection = new Set(tree.nodes
        .filter(node => node.type == "hero_selection")
        .flatMap(node => node.entries.map(entry => entry.id)))
    const key_talents = Object.entries(filter)
        .filter(([id, mode]) => mode == "with" && !base.has(Number(id)) && !hero_selection.has(Number(id)))
        .map(([id]) => Number(id))
    return { filter, key_talents }
}
