/*
    Three-tab talent trees (WoW Forever): one tree per class with a tab per spec, side by side.
*/
import { shallowEqual } from "react-redux"
import { useAppSelector } from "../../store/store_hooks"
import type TalentTree from "../../types/talent_tree"
import type { TalentNode, Talents } from "../../types/talent_tree"


/** Whether the tree is a three-tab tree (instead of class | hero | spec trees). */
export function is_tab_tree(tree: TalentTree): boolean {
    return !!tree.tabs?.length
}


/** Ranks a player put in a node: of its highest ranked entry. */
export function node_rank(node: TalentNode, talents: Talents): number {
    return Math.max(0, ...node.entries.map(entry => talents[entry.id] || 0))
}


/** Points spent in each tab, eg.: `[31, 20, 0]`. Empty for trees without tabs. */
export function points_per_tab(tree: TalentTree, talents: Talents): number[] {
    const points = (tree.tabs ?? []).map(() => 0)
    for (const node of tree.nodes) {
        if (node.tab === undefined || node.tab >= points.length) { continue }
        points[node.tab] += node_rank(node, talents)
    }
    return points
}


/** The (spec) name of each tab, eg.: `["Arcane", "Fire", "Frost"]`. */
export function useTabNames(tree: TalentTree): string[] {
    return useAppSelector(state => {
        const specs = Object.values(state.specs.specs_by_name)
        return (tree.tabs ?? []).map((spec_id, i) => specs.find(spec => spec.id == spec_id)?.name ?? `Tab ${i + 1}`)
    }, shallowEqual)
}
