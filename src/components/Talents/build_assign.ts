/*
    Which Build a player's talents belong to: the same rules as the backend's `assign_talents` (`lorgs/models/spec_builds.py`).

    Hero and spec talents only. Talents on another hero tree, or differing in a `force_new_build` entry, are never
    in the same Build. Otherwise the nearest Build within `max(threshold, min_assign)` talent entries whose rank differs.
*/
import type TalentTree from "../../types/talent_tree"
import type { Talents } from "../../types/talent_tree"


export interface BuildSettings {
    threshold: number
    min_assign: number
    ignore: number[]
    force_new_build: number[]
}


export interface TalentScope {
    /** hero and spec entries */
    counted: Set<number>
    /** entry id -> slug of its hero tree */
    hero_trees: Map<number, string>
}


interface Point {
    /** entry id -> rank */
    ranks: Map<number, number>
    /** hero trees and forced entries */
    group: string
}


export function talent_scope(tree: TalentTree): TalentScope {
    const scope: TalentScope = { counted: new Set(), hero_trees: new Map() }
    tree.nodes.forEach(node => {
        if (node.tree == "class") { return }
        node.entries.forEach(entry => {
            scope.counted.add(entry.id)
            if (node.hero_tree_slug) { scope.hero_trees.set(entry.id, node.hero_tree_slug) }
        })
    })
    return scope
}


function project(talents: Talents, scope: TalentScope, settings: BuildSettings): Point {
    const ranks = new Map<number, number>()
    const hero_trees = new Set<string>()
    const forced: number[] = []
    Object.entries(talents).forEach(([key, rank]) => {
        const id = Number(key)
        if (!(rank > 0)) { return }
        if (scope.counted.has(id) && !settings.ignore.includes(id)) { ranks.set(id, rank) }
        const hero_tree = scope.hero_trees.get(id)
        if (hero_tree) { hero_trees.add(hero_tree) }
        if (settings.force_new_build.includes(id)) { forced.push(id) }
    })
    return { ranks, group: [...hero_trees].sort().join(",") + "|" + forced.sort((a, b) => a - b).join(",") }
}


function distance(a: Point, b: Point): number | null {
    if (a.group != b.group) { return null }
    let dist = 0
    a.ranks.forEach((rank, id) => { if (b.ranks.get(id) != rank) { dist++ } })
    b.ranks.forEach((_, id) => { if (!a.ranks.has(id)) { dist++ } })
    return dist
}


/** Assigns talents to the index of their Build, or `null` for none */
export function build_assigner(builds: { talents: Talents }[], scope: TalentScope, settings: BuildSettings) {
    const centres = builds.map(build => project(build.talents, scope, settings))
    const reach = Math.max(settings.threshold, settings.min_assign)

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
