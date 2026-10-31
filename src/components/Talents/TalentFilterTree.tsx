import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom";
import type TalentTree from "../../types/talent_tree";
import type { TalentEntry } from "../../types/talent_tree";
import type { TalentFilter } from "../../store/ui";
import { ASSETS } from "../../constants";
import { HERO_WIDTH, hero_tree_names, is_drawn, layout } from "./TalentTreeGraph";
import styles from "./TalentFilter.module.scss";
import Spec from "../../types/spec";


const WIDTH = 800
const HEIGHT = 450
const RADIUS = 12
const VIEW_Y = -10  // room for the labels
const VIEW_HEIGHT = HEIGHT - VIEW_Y
const PADDING = RADIUS * 1.5 + 2  // choice nodes are split into two dots, which reach further out


type Props = {
    tree: TalentTree
    spec: Spec
    talent_filter: TalentFilter
    /** share (0-1) of the listed fights taking a talent */
    share: (entry_id: number) => number
    on_click: (entry_id: number) => void
    /** right click */
    on_clear: (entry_id: number) => void
}


/** "42% of Fights", attached below the wowhead tooltip (which follows the cursor, so we follow it) */
function ShareTooltip({ spec, share }: { spec: Spec, share: number }) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        let frame = 0
        const follow = () => {
            const el = ref.current
            const wowhead = document.querySelector(".wowhead-tooltip")
            const rect = wowhead?.getBoundingClientRect()
            if (el && rect && rect.width > 0 && getComputedStyle(wowhead!).visibility != "hidden") {
                el.style.display = ""
                el.style.left = `${rect.left}px`
                el.style.top = `${rect.bottom + 2}px`
            } else if (el) {
                el.style.display = "none"
            }
            frame = requestAnimationFrame(follow)
        }
        follow()
        return () => cancelAnimationFrame(frame)
    }, [])

    return createPortal(
        <div
            ref={ref}
            className={`wow-${spec.class.name_slug} ${styles.share}`}
            style={{ display: "none" }}
        >
            <b>{Math.round(share * 100)}%</b> of Players
        </div >,
        document.body,
    )
}


/** The whole tree of a spec (class | hero trees | spec), with one clickable dot (the talent icon) per talent: choice nodes are split. */
export default function TalentFilterTree({ tree, spec, talent_filter, share, on_click, on_clear }: Props) {

    const [hovered, set_hovered] = useState<TalentEntry | null>(null)

    const nodes = tree.nodes.filter(is_drawn)
    const hero_trees = hero_tree_names(nodes)

    const { positions, labels } = layout([
        { label: spec.class.name, width: 1, nodes: nodes.filter(node => node.tree == "class") },
        ...hero_trees.map((hero_tree, row) => ({
            label: hero_tree, width: HERO_WIDTH, column: 1, row, rows: hero_trees.length,
            nodes: nodes.filter(node => node.hero_tree == hero_tree),
        })),
        { label: spec.name, width: 1, nodes: nodes.filter(node => node.tree == "spec") },
    ], [WIDTH, HEIGHT], PADDING)

    // wowhead only scans for links on load (and on hover for some versions): make sure it knows ours
    useEffect(() => { (window as any).$WowheadPower?.refreshLinks?.() }, [tree])

    // one link per dot, on top of the svg (wowhead's tooltips attach to links)
    const dots: { entry: TalentEntry, cx: number, cy: number, r: number, locked: boolean }[] = []

    return (
        <div className={styles.tree_wrap}>

            <svg className={styles.tree} viewBox={`0 ${VIEW_Y} ${WIDTH} ${VIEW_HEIGHT}`} role="img" aria-label="talent filter tree">

                <clipPath id="talent-clip" clipPathUnits="objectBoundingBox"><circle cx={0.5} cy={0.5} r={0.5} /></clipPath>

                {/* Labels */}
                {labels.map(({ x, y, label }) =>
                    <text key={`${x}-${y}`} x={x} y={y} textAnchor="middle">{label}</text>)
                }

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
                    const r = RADIUS
                    return node.entries.map((entry, i) => {
                        const cx = multi ? pos[0] + (i ? r + 0.5 : -r - 0.5) : pos[0]
                        const cy = pos[1]
                        const mode = talent_filter[entry.id]

                        // not selected: taken by everyone / no one (nothing to filter by), or somewhere in between
                        const percent = Math.round(share(entry.id) * 100)
                        const locked = !mode && (percent == 0 || percent == 100)
                        const state = mode ?? (locked ? "fixed" : "varies")
                        dots.push({ entry, cx, cy, r, locked })

                        return (
                            <g key={entry.id} className={`${styles.node} ${styles[`node_${state}`]}`}>
                                <circle className={styles.bg} cx={cx} cy={cy} r={r} />
                                {entry.icon && <image
                                    className={styles.icon_image}
                                    href={`${ASSETS}/images/spells/${entry.icon}`}
                                    x={cx - r} y={cy - r} width={2 * r} height={2 * r}
                                    clipPath="url(#talent-clip)"
                                />}
                                <circle className={styles.ring} cx={cx} cy={cy} r={r} />
                            </g>
                        )
                    })
                })}
            </svg>

            {dots.map(({ entry, cx, cy, r, locked }) => (
                <a
                    key={entry.id}
                    href=""
                    className={`${styles.hit} ${locked ? styles.locked : ""}`}
                    data-wowhead={`spell=${entry.spell_id}`}
                    style={{
                        left: `${(cx - r) / WIDTH * 100}%`, top: `${(cy - r - VIEW_Y) / VIEW_HEIGHT * 100}%`,
                        width: `${2 * r / WIDTH * 100}%`, height: `${2 * r / VIEW_HEIGHT * 100}%`,
                    }}
                    onClick={event => { event.preventDefault(); locked || on_click(entry.id) }}
                    onContextMenu={event => { event.preventDefault(); on_clear(entry.id) }}
                    onPointerEnter={() => set_hovered(entry)}
                    onPointerLeave={() => set_hovered(null)}
                />
            ))}
            {hovered && <ShareTooltip spec={spec} share={share(hovered.id)} />}
        </div>
    )
}
