import { memo, type CSSProperties } from "react";
import type TalentTree from "../../types/talent_tree";
import type { TalentNode, Talents } from "../../types/talent_tree";
import { useTalentCounts } from "./talent_filter";
import { is_tab_tree, node_rank, useTabNames } from "./tab_tree";
import type { TreeStyle, TreeView } from "./tree_style";
import { CORNER, GRID, useTreeStyle } from "./tree_style";
import styles from "./TalentCard.module.scss";


export type Panel = {
    label?: string,
    nodes: TalentNode[]
    /** Panels sharing a column are stacked on top of each other, in order (default: own column). */
    column?: number
    /** Area of the tree the panel takes up at least, as `[min, max]` in tree coordinates (default: the extent of the nodes) */
    bounds?: { x: Point, y: Point }
}
export type Point = [number, number]


/** Nodes a player can spend points in (no hidden nodes, no hero tree selection). */
export function is_drawn(node: TalentNode) {
    return node.max_ranks > 0 && node.type != "hero_selection"
}


/** The hero trees of a spec, in a stable order: the slot of a tree (top, bottom) is the same in every graph. */
export function hero_tree_names(nodes: TalentNode[]) {
    return [...new Set(nodes.map(node => node.hero_tree).filter(Boolean))] as string[]
}


/** The sections of a tree, left to right: class | hero trees (stacked) | spec, or one per tab for three-tab trees. */
export function tree_panels(tree: TalentTree, nodes: TalentNode[], names: { class_name: string, spec_name: string, tab_names: string[] }): Panel[] {

    if (is_tab_tree(tree)) {
        // each tab at least as wide as a typical tab (4 columns) and as high as the tallest one
        const tabs = tree.tabs!.map((_, tab) => nodes.filter(node => node.tab == tab))
        const xs = tabs.map(tab_nodes => tab_nodes.map(node => node.x))
        const spans = xs.filter(x => x.length).map(x => Math.max(...x) - Math.min(...x)).sort((a, b) => a - b)
        const span = spans[Math.floor(spans.length / 2)] ?? 0
        const ys = nodes.map(node => node.y)
        const y: Point = [Math.min(...ys), Math.max(...ys)]
        return tabs.map((tab_nodes, tab) => {
            const x0 = Math.min(...xs[tab])
            return { label: names.tab_names[tab], nodes: tab_nodes, bounds: { x: [x0, x0 + span], y } }
        })
    }

    const hero_trees = hero_tree_names(nodes)
    return [
        { label: names.class_name, nodes: nodes.filter(node => node.tree == "class") },
        // all hero trees, in the same slots everywhere: the greyed out ones help the eye to orient itself
        ...hero_trees.map(hero_tree => ({
            label: hero_tree, column: 1,
            nodes: nodes.filter(node => node.hero_tree == hero_tree),
        })),
        { label: names.spec_name, nodes: nodes.filter(node => node.tree == "spec") },
    ]
}


/** How far the talents of a panel reach out from their centers, in talent sizes: a choice pill is 1.5 talents wide. */
function reach(nodes: TalentNode[]): number {
    return nodes.some(node => node.entries.length > 1) ? 0.75 : 0.5
}


/** Extent of a panel in tree coordinates: its nodes, and at least its `bounds`. */
function extent(values: number[], bounds?: Point): Point {
    if (!values.length) { return bounds ?? [0, 0] }
    return [Math.min(...values, bounds?.[0] ?? Infinity), Math.max(...values, bounds?.[1] ?? -Infinity)]
}


/**
 * Place the panels side by side (or stacked, within a column), in pixels (see `TreeView`).
 *
 * Each panel has its label on top. Neighbouring talents are `node_size + node_spacing` apart, the panels `tree_margin` (half of it around the drawing).
 * `size` is the size of the whole drawing, `dividers` are the x positions between the columns.
 */
export function layout(panels: Panel[], view: TreeView) {
    const { node_size, node_spacing, tree_margin, label_size, label_spacing } = view
    const scale = (node_size + node_spacing) / GRID  // tree coordinates -> pixels

    // size of each panel
    const boxes = panels.map(panel => {
        const x = extent(panel.nodes.map(node => node.x), panel.bounds?.x)
        const y = extent(panel.nodes.map(node => node.y), panel.bounds?.y)
        const margin = panel.nodes.length ? reach(panel.nodes) * node_size : 0  // room for the talents at the edges
        const header = panel.label ? label_size + label_spacing : 0
        return { x, y, margin, header, w: (x[1] - x[0]) * scale + 2 * margin, h: (y[1] - y[0]) * scale + 2 * margin }
    })

    // panels per column, in order
    const columns = new Map<number, number[]>()
    panels.forEach((panel, i) => {
        const column = panel.column ?? -i - 1
        columns.set(column, [...(columns.get(column) ?? []), i])
    })

    const positions: { [node_id: number]: Point } = {}
    const labels: { x: number, y: number, label: string }[] = []
    const dividers: number[] = []
    let height = 0

    // each panel has half a margin around it: `tree_margin` between two panels, half of it at the edges
    const half = tree_margin / 2
    let x = half
    Array.from(columns.values()).forEach((members, c) => {
        if (c > 0) {
            dividers.push(x - tree_margin / 2)
        }
        const column_w = Math.max(...members.map(i => boxes[i].w))
        let y = half
        members.forEach((i, row) => {
            const [panel, box] = [panels[i], boxes[i]]
            if (row > 0) { y += tree_margin }
            if (panel.label) { labels.push({ x: x + column_w / 2, y: y + label_size, label: panel.label }) }
            y += box.header
            const offset_x = x + (column_w - box.w) / 2 + box.margin
            const offset_y = y + box.margin
            for (const node of panel.nodes) {
                positions[node.id] = [offset_x + (node.x - box.x[0]) * scale, offset_y + (node.y - box.y[0]) * scale]
            }
            y += box.h
        })
        height = Math.max(height, y + half)
        x += column_w + tree_margin
    })

    const width = x - half  // `x` is past the last column and a full margin
    return { positions, labels, dividers, radius: node_size / 2, size: [width, height] as Point }
}


function NodeShape({ node, pos, rank, percent, radius, style }: { node: TalentNode, pos: Point, rank: number, percent: number, radius: number, style: TreeStyle }) {
    const state = rank ? (rank < node.max_ranks ? styles.partial : styles.taken) : styles.untaken
    // used by everyone => "default"
    const kind = percent >= 100 ? styles.default : ""
    const className = `${state} ${kind}`
    const [x, y] = pos
    const shape = style.node_shape(node)

    if (shape == "choice") {
        return <rect
            className={className}
            x={x - radius} y={y - radius}
            width={2 * radius} height={2 * radius}
            transform={`rotate(45 ${x} ${y})`}
        />
    }
    if (shape == "square") {
        return <rect
            className={className}
            x={x - radius} y={y - radius}
            width={2 * radius} height={2 * radius}
            rx={2 * radius * CORNER}
        />
    }
    return <circle className={className} cx={x} cy={y} r={radius} />
}


/** The class, hero and spec tree of one player, side by side (the hero trees stacked), or the tabs of a three-tab tree. Entries unknown to the tree are ignored. */
function TalentTreeGraph({ tree, talents, class_name, spec_name }: { tree: TalentTree, talents: Talents, class_name: string, spec_name: string }) {

    const nodes = tree.nodes.filter(is_drawn)
    const tab_names = useTabNames(tree)
    const style = useTreeStyle()
    const { positions, labels, dividers, radius, size: [width, height] } = layout(tree_panels(tree, nodes, { class_name, spec_name, tab_names }), style.card)

    const { counts, with_talents } = useTalentCounts()
    /** share (0-100) of the fights taking the node: of its most used entry */
    const percent = (node: TalentNode) => with_talents
        ? Math.round(100 * Math.max(0, ...node.entries.map(entry => counts[entry.id] || 0)) / with_talents)
        : 0

    const rank = (node: TalentNode) => node_rank(node, talents)

    return (
        <svg className={styles.graph} width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="talent tree">
            {labels.map(({ x, y, label }) => <text key={`${x}-${y}`} x={x} y={y} fontSize={style.card.label_size} textAnchor="middle">{label}</text>)}

            {style.dividers && dividers.map(x => <line key={x} className={styles.divider} x1={x} y1={0} x2={x} y2={height} />)}

            {tree.edges.map(([a, b], i) => {
                const [pa, pb] = [positions[a], positions[b]]
                if (!pa || !pb) { return null }
                return <line key={i} className={styles.edge} x1={pa[0]} y1={pa[1]} x2={pb[0]} y2={pb[1]} />
            })}

            {nodes.map(node => positions[node.id] &&
                <NodeShape key={node.id} node={node} pos={positions[node.id]} rank={rank(node)} percent={percent(node)} radius={radius} style={style} />
            )}
        </svg>
    )
}

export default memo(TalentTreeGraph)
