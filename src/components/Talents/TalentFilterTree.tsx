import type TalentTree from "../../types/talent_tree";
import type { TalentFilter } from "../../store/ui";
import { is_drawn, layout } from "./TalentTreeGraph";
import styles from "./TalentFilter.module.scss";


const WIDTH = 640
const HEIGHT = 300
const RADIUS = 5


type Props = {
    tree: TalentTree
    talent_filter: TalentFilter
    /** share (0-1) of the listed fights taking a talent */
    share: (entry_id: number) => number
    on_click: (entry_id: number) => void
    on_hover: (entry_id: number | null) => void
}


/** The whole tree of a spec (class | hero trees | spec), with one clickable dot per talent: choice nodes are split. */
export default function TalentFilterTree({ tree, talent_filter, share, on_click, on_hover }: Props) {

    const nodes = tree.nodes.filter(is_drawn)
    const hero_trees = [...new Set(nodes.map(node => node.hero_tree).filter(Boolean))] as string[]

    const { positions, labels } = layout([
        { label: "class", width: 1, nodes: nodes.filter(node => node.tree == "class") },
        ...hero_trees.map(hero_tree => ({ label: hero_tree, width: 0.5, nodes: nodes.filter(node => node.hero_tree == hero_tree) })),
        { label: "spec", width: 1, nodes: nodes.filter(node => node.tree == "spec") },
    ], [WIDTH, HEIGHT])

    return (
        <svg className={styles.tree} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="talent filter tree">
            {labels.map(({ x, label }) => <text key={x} x={x} y={10} textAnchor="middle">{label}</text>)}

            {/* Lines */}
            {tree.edges.map(([a, b], i) => {
                const [pa, pb] = [positions[a], positions[b]]
                if (!pa || !pb) { return null }
                return <line
                    key={i}
                    className={styles.edge}
                    x1={pa[0]} y1={pa[1]}
                    x2={pb[0]} y2={pb[1]}
                />
            })}

            {nodes.map(node => {
                const pos = positions[node.id]
                if (!pos) { return null }

                const multi = node.entries.length > 1
                const r = multi ? RADIUS * 0.7 : RADIUS
                return node.entries.map((entry, i) => {
                    const cx = multi ? pos[0] + (i ? r + 0.5 : -r - 0.5) : pos[0]
                    const cy = pos[1]
                    const mode = talent_filter[entry.id]

                    const alpha = (0.3 + 0.7 * share(entry.id)) * 100

                    const fill = mode == "with" ? "var(--talent-with)"
                        : mode == "without" ? "var(--talent-without)"
                            : `hsl(0, 0%, ${alpha.toFixed(0)}%)`

                    return (
                        <g key={entry.id}>
                            <circle
                                className={styles.dot}
                                cx={cx} cy={cy} r={r}
                                fill={fill}
                                onClick={() => on_click(entry.id)}
                                onPointerEnter={() => on_hover(entry.id)}
                                onPointerLeave={() => on_hover(null)}
                            />
                            {mode == "without" && <path
                                className={styles.cross}
                                d={`M${cx - r * 0.6} ${cy - r * 0.6}L${cx + r * 0.6} ${cy + r * 0.6}M${cx + r * 0.6} ${cy - r * 0.6}L${cx - r * 0.6} ${cy + r * 0.6}`}
                            />}
                        </g>
                    )
                })
            })}
        </svg>
    )
}
