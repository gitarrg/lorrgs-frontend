/*
    Which Build a player's talents belong to: the same rules as the backend's `assign_talents` (`lorgs/models/spec_builds.py`).

    Hero and spec talents only. Talents on another hero tree, or differing in a `force_new_build` entry, are never
    in the same Build. Otherwise the nearest Build within `max(threshold, assign_reach)` talent nodes whose pick differs
    (swapping a choice node is 1, moving a point to another node is 2).
*/
import type TalentTree from "../../types/talent_tree"
import type { Talents } from "../../types/talent_tree"


export interface BuildSettings {
    threshold: number
    assign_reach?: number
    /** @deprecated Builds stored before `assign_reach` */
    min_assign?: number
    ignore: number[]
    force_new_build: number[]
}


export interface TalentScope {
    /** hero and spec entries */
    counted: Set<number>
    /** entry id -> slug of its hero tree */
    hero_trees: Map<number, string>
    /** entry id -> id of its node */
    nodes: Map<number, number>
}


interface Point {
    /** node id -> "entry id:rank" */
    picks: Map<number, string>
    /** hero trees and forced entries */
    group: string
}


export function talent_scope(tree: TalentTree): TalentScope {
    const scope: TalentScope = { counted: new Set(), hero_trees: new Map(), nodes: new Map() }
    tree.nodes.forEach(node => {
        if (node.tree == "class") { return }
        node.entries.forEach(entry => {
            scope.counted.add(entry.id)
            scope.nodes.set(entry.id, node.id)
            if (node.hero_tree_slug) { scope.hero_trees.set(entry.id, node.hero_tree_slug) }
        })
    })
    return scope
}


function project(talents: Talents, scope: TalentScope, settings: BuildSettings): Point {
    const picks = new Map<number, string>()
    const hero_trees = new Set<string>()
    const forced: number[] = []
    Object.entries(talents).forEach(([key, rank]) => {
        const id = Number(key)
        if (!(rank > 0)) { return }
        if (scope.counted.has(id) && !settings.ignore.includes(id)) {
            // a node holds one pick: a choice node one entry, a tiered one its ranks
            const node = scope.nodes.get(id) ?? id
            picks.set(node, [picks.get(node), `${id}:${rank}`].filter(Boolean).sort().join(","))
        }
        const hero_tree = scope.hero_trees.get(id)
        if (hero_tree) { hero_trees.add(hero_tree) }
        if (settings.force_new_build.includes(id)) { forced.push(id) }
    })
    return { picks, group: [...hero_trees].sort().join(",") + "|" + forced.sort((a, b) => a - b).join(",") }
}


function distance(a: Point, b: Point): number | null {
    if (a.group != b.group) { return null }
    let dist = 0
    a.picks.forEach((pick, node) => { if (b.picks.get(node) != pick) { dist++ } })
    b.picks.forEach((_, node) => { if (!a.picks.has(node)) { dist++ } })
    return dist
}


/** Assigns talents to the index of their Build, or `null` for none */
export function build_assigner(builds: { talents: Talents }[], scope: TalentScope, settings: BuildSettings) {
    const centres = builds.map(build => project(build.talents, scope, settings))
    const reach = Math.max(settings.threshold, settings.assign_reach ?? settings.min_assign ?? 0)

    return (talents: Talents): number | null => {
        const point = project(talents, scope, settings)
        let best: number | null = null
        let best_dist = Infinity
        centres.forEach((centre, index) => {
            const dist = distance(point, centre)
            if (dist != null && dist <= reach && dist < best_dist) { best = index; best_dist = dist }
        })
        return best
    }
}
