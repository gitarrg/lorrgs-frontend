import { memo } from "react";
import type TalentTree from "../../types/talent_tree";
import type { TalentNode, Talents } from "../../types/talent_tree";
import styles from "./TalentCard.module.scss";


const WIDTH = 436
const HEIGHT = 184
const GAP = 4
const LABEL_HEIGHT = 24
const PADDING = 6
const RADIUS = 4
export const HERO_WIDTH = 0.55


export type Panel = {
    label?: string,
    width: number,
    nodes: TalentNode[]
    /** Panels sharing a column are stacked on top of each other, each taking `1 / rows` of the height (default: own column, full height). */
    column?: number
    row?: number
    rows?: number
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


/** Fit each panel's nodes into its box, side by side (or stacked, within a column), keeping the aspect ratio of the tree. */
export function layout(panels: Panel[], [total_width, total_height]: Point = [WIDTH, HEIGHT], padding = PADDING) {
    const column_of = (panel: Panel, i: number) => panel.column ?? -i - 1
    const columns = new Map<number, number>()  // column -> width
    panels.forEach((panel, i) => {
        const column = column_of(panel, i)
        columns.set(column, Math.max(columns.get(column) || 0, panel.width))
    })

    const total = [...columns.values()].reduce((sum, width) => sum + width, 0)
    const unit = (total_width - GAP * (columns.size - 1)) / total
    const positions: { [node_id: number]: Point } = {}
    const labels: { x: number, y: number, label: string }[] = []

    const x0s = new Map<number, number>()
    let x = 0
    for (const [column, width] of columns) {
        x0s.set(column, x)
        x += unit * width + GAP
    }

    panels.forEach((panel, i) => {
        const column = column_of(panel, i)
        const x0 = x0s.get(column)!
        const width = unit * columns.get(column)!

        const rows = panel.rows || 1
        const row_height = (total_height - GAP * (rows - 1)) / rows
        const y0 = (panel.row || 0) * (row_height + GAP)

        if (panel.label) {
            labels.push({ x: x0 + width / 2, y: y0 + 10, label: panel.label })
        }
        if (!panel.nodes.length) { return }

        const xs = panel.nodes.map(node => node.x)
        const ys = panel.nodes.map(node => node.y)
        const [min_x, min_y] = [Math.min(...xs), Math.min(...ys)]
        const [span_x, span_y] = [Math.max(...xs) - min_x, Math.max(...ys) - min_y]
        const inner_w = width - 2 * padding
        const inner_h = row_height - LABEL_HEIGHT - 2 * padding
        const scale = Math.min(inner_w / Math.max(1, span_x), inner_h / Math.max(1, span_y))
        const offset_x = x0 + padding + (inner_w - span_x * scale) / 2
        const offset_y = y0 + LABEL_HEIGHT + padding
        for (const node of panel.nodes) {
            positions[node.id] = [offset_x + (node.x - min_x) * scale, offset_y + (node.y - min_y) * scale]
        }
    })
    return { positions, labels }
}


function NodeShape({ node, pos, rank }: { node: TalentNode, pos: Point, rank: number }) {
    const className = rank ? (rank < node.max_ranks ? styles.partial : styles.taken) : styles.untaken
    const [x, y] = pos

    if (node.type == "choice") {
        return <rect
            className={className}
            x={x - RADIUS} y={y - RADIUS}
            width={2 * RADIUS} height={2 * RADIUS}
            transform={`rotate(45 ${x} ${y})`}
        />
    }
    return <circle className={className} cx={x} cy={y} r={RADIUS} />
}


/** The class, hero and spec tree of one player, side by side (the hero trees stacked). Entries unknown to the tree are ignored. */
function TalentTreeGraph({ tree, talents, class_name, spec_name }: { tree: TalentTree, talents: Talents, class_name: string, spec_name: string }) {

    const nodes = tree.nodes.filter(is_drawn)
    // all hero trees, in the same slots as in the filter: the greyed out ones help the eye to orient itself
    const hero_trees = hero_tree_names(nodes)

    const { positions, labels } = layout([
        { label: class_name, width: 1, nodes: nodes.filter(node => node.tree == "class") },
        ...hero_trees.map((hero_tree, row) => ({
            label: hero_tree, width: HERO_WIDTH, column: 1, row, rows: hero_trees.length,
            nodes: nodes.filter(node => node.hero_tree == hero_tree),
        })),
        { label: spec_name, width: 1, nodes: nodes.filter(node => node.tree == "spec") },
    ])

    const rank = (node: TalentNode) => Math.max(0, ...node.entries.map(entry => talents[entry.id] || 0))

    return (
        <svg className={styles.graph} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="talent tree">
            {labels.map(({ x, y, label }) => <text key={`${x}-${y}`} x={x} y={y} textAnchor="middle">{label}</text>)}

            {tree.edges.map(([a, b], i) => {
                const [pa, pb] = [positions[a], positions[b]]
                if (!pa || !pb) { return null }
                return <line key={i} className={styles.edge} x1={pa[0]} y1={pa[1]} x2={pb[0]} y2={pb[1]} />
            })}

            {nodes.map(node => positions[node.id] &&
                <NodeShape key={node.id} node={node} pos={positions[node.id]} rank={rank(node)} />
            )}
        </svg>
    )
}

export default memo(TalentTreeGraph)
