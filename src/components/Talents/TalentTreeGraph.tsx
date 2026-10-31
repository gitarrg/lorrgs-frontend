import { memo } from "react";
import type TalentTree from "../../types/talent_tree";
import type { TalentNode, Talents } from "../../types/talent_tree";
import styles from "./TalentCard.module.scss";


const WIDTH = 436
const HEIGHT = 184
const GAP = 10
const LABEL_HEIGHT = 16
const PADDING = 6
const RADIUS = 3


export type Panel = { label: string, width: number, nodes: TalentNode[] }
export type Point = [number, number]


/** Nodes a player can spend points in (no hidden nodes, no hero tree selection). */
export function is_drawn(node: TalentNode) {
    return node.max_ranks > 0 && node.type != "hero_selection"
}


/** The hero tree the player picked: the one their talents are in (or the first one, without talents). */
function player_hero_tree(tree: TalentTree, talents: Talents) {
    const hero_nodes = tree.nodes.filter(node => node.hero_tree)
    const taken = hero_nodes.find(node => node.entries.some(entry => talents[entry.id]))
    return (taken || hero_nodes[0])?.hero_tree || ""
}


/** Fit each panel's nodes into its box, side by side, keeping the aspect ratio of the tree. */
export function layout(panels: Panel[], [total_width, total_height]: Point = [WIDTH, HEIGHT]) {
    const total = panels.reduce((sum, panel) => sum + panel.width, 0)
    const unit = (total_width - GAP * (panels.length - 1)) / total
    const positions: { [node_id: number]: Point } = {}
    const labels: { x: number, label: string }[] = []

    let x0 = 0
    for (const panel of panels) {
        const width = unit * panel.width
        labels.push({ x: x0 + width / 2, label: panel.label })

        if (panel.nodes.length) {
            const xs = panel.nodes.map(node => node.x)
            const ys = panel.nodes.map(node => node.y)
            const [min_x, min_y] = [Math.min(...xs), Math.min(...ys)]
            const [span_x, span_y] = [Math.max(...xs) - min_x, Math.max(...ys) - min_y]
            const inner_w = width - 2 * PADDING
            const inner_h = total_height - LABEL_HEIGHT - 2 * PADDING
            const scale = Math.min(inner_w / Math.max(1, span_x), inner_h / Math.max(1, span_y))
            const offset_x = x0 + PADDING + (inner_w - span_x * scale) / 2
            const offset_y = LABEL_HEIGHT + PADDING
            for (const node of panel.nodes) {
                positions[node.id] = [offset_x + (node.x - min_x) * scale, offset_y + (node.y - min_y) * scale]
            }
        }
        x0 += width + GAP
    }
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


/** The class, hero and spec tree of one player, side by side. Entries unknown to the tree are ignored. */
function TalentTreeGraph({ tree, talents }: { tree: TalentTree, talents: Talents }) {

    const nodes = tree.nodes.filter(is_drawn)
    const hero_tree = player_hero_tree(tree, talents)

    const { positions, labels } = layout([
        { label: "class", width: 1, nodes: nodes.filter(node => node.tree == "class") },
        { label: hero_tree, width: 0.55, nodes: nodes.filter(node => node.hero_tree && node.hero_tree == hero_tree) },
        { label: "spec", width: 1, nodes: nodes.filter(node => node.tree == "spec") },
    ])

    const rank = (node: TalentNode) => Math.max(0, ...node.entries.map(entry => talents[entry.id] || 0))

    return (
        <svg className={styles.graph} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="talent tree">
            {labels.map(({ x, label }) => <text key={x} x={x} y={10} textAnchor="middle">{label}</text>)}

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
