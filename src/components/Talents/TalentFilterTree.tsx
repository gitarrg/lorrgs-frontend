import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom";
import type TalentTree from "../../types/talent_tree";
import type { TalentEntry } from "../../types/talent_tree";
import type { TalentFilter } from "../../store/ui";
import { ASSETS } from "../../constants";
import { is_drawn, layout, tree_panels } from "./TalentTreeGraph";
import { useTabNames } from "./tab_tree";
import styles from "./TalentFilter.module.scss";
import Spec from "../../types/spec";


const WIDTH = 800
const HEIGHT = 450
const RADIUS = 12
const VIEW_Y = -10  // room for the labels
const VIEW_HEIGHT = HEIGHT - VIEW_Y
const HALF_WIDTH = RADIUS * 1.5  // one half of a choice pill: thinner than a full dot
const PADDING = HALF_WIDTH + 2  // choice nodes are a pill of two halves, which reaches further out


type Props = {
    tree: TalentTree
    spec: Spec
    talent_filter: TalentFilter
    /** shown instead of `talent_filter`, highlighted (eg.: while hovering a Build button) */
    preview?: TalentFilter | null
    /** share (0-1) of the listed fights taking a talent */
    share: (entry_id: number) => number
    on_click: (entry_id: number) => void
    /** right click */
    on_clear: (entry_id: number) => void
}


type Side = "left" | "right"

/** outline of one half of a choice pill: the outer end is round, the inner edge (at `x`, the pill's center) is flat */
function half_path(x: number, y: number, r: number, side: Side): string {
    const [end, sweep] = side == "left" ? [x - HALF_WIDTH + r, 0] : [x + HALF_WIDTH - r, 1]
    return `M${x} ${y - r} H${end} A${r} ${r} 0 0 ${sweep} ${end} ${y + r} H${x} Z`
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


/** The whole tree of a spec (class | hero trees | spec, or its tabs), with one clickable dot (the talent icon) per talent: choice nodes are a pill with one half per option. */
export default function TalentFilterTree({ tree, spec, talent_filter, preview, share, on_click, on_clear }: Props) {

    const [hovered, set_hovered] = useState<TalentEntry | null>(null)

    const nodes = tree.nodes.filter(is_drawn)
    const tab_names = useTabNames(tree)
    const panels = tree_panels(tree, nodes, { class_name: spec.class.name, spec_name: spec.name, tab_names })
    const { positions, labels } = layout(panels, [WIDTH, HEIGHT], PADDING)

    // wowhead only scans for links on load (and on hover for some versions): make sure it knows ours
    useEffect(() => { (window as any).$WowheadPower?.refreshLinks?.() }, [tree])

    // one link per dot, on top of the svg (wowhead's tooltips attach to links)
    const dots: { entry: TalentEntry, cx: number, cy: number, r: number, w: number, locked: boolean, side?: Side }[] = []

    return (
        <div className={styles.tree_wrap}>

            <svg className={styles.tree} viewBox={`0 ${VIEW_Y} ${WIDTH} ${VIEW_HEIGHT}`} role="img" aria-label="talent filter tree">

                <clipPath id="talent-clip" clipPathUnits="objectBoundingBox"><circle cx={0.5} cy={0.5} r={0.5} /></clipPath>

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
                        const side: Side | undefined = multi ? (i ? "right" : "left") : undefined
                        const w = side ? HALF_WIDTH : 2 * r
                        const cx = side ? pos[0] + (side == "right" ? w / 2 : -w / 2) : pos[0]
                        const cy = pos[1]
                        const mode = (preview ?? talent_filter)[entry.id]

                        // not selected: taken by everyone / no one (nothing to filter by), or somewhere in between
                        const percent = Math.round(share(entry.id) * 100)
                        const locked = !mode && (percent == 0 || percent == 100)
                        const state = mode ?? (locked ? "fixed" : "varies")
                        dots.push({ entry, cx, cy, r, w, locked, side })

                        return (
                            <g key={entry.id} className={`${styles.node} ${styles[`node_${state}`]} ${preview && mode ? styles.node_preview : ""}`}>
                                {side
                                    ? <path className={styles.bg} d={half_path(pos[0], cy, r, side)} />
                                    : <circle className={styles.bg} cx={cx} cy={cy} r={r} />}
                                {side && <clipPath id={`talent-clip-${entry.id}`}><path d={half_path(pos[0], cy, r, side)} /></clipPath>}
                                {entry.icon && <image
                                    className={styles.icon_image}
                                    href={`${ASSETS}/images/spells/${entry.icon}`}
                                    x={cx - w / 2} y={cy - r} width={w} height={2 * r}
                                    preserveAspectRatio="xMidYMid slice"
                                    clipPath={side ? `url(#talent-clip-${entry.id})` : "url(#talent-clip)"}
                                />}
                                {side
                                    ? <path className={styles.ring} d={half_path(pos[0], cy, r, side)} />
                                    : <circle className={styles.ring} cx={cx} cy={cy} r={r} />}
                            </g>
                        )
                    })
                })}
            </svg>

            {/* html, not svg text: an svg text scales with the tree */}
            {labels.map(({ x, y, label }) => <span
                key={`${x}-${y}`}
                className={`${styles.label} text-label`}
                style={{ left: `${x / WIDTH * 100}%`, top: `${(y - VIEW_Y) / VIEW_HEIGHT * 100}%` }}
            >{label}</span>)}

            {dots.map(({ entry, cx, cy, r, w, locked, side }) => (
                <a
                    key={entry.id}
                    href=""
                    className={`${styles.hit} ${side ? styles[`hit_${side}`] : ""}`}
                    data-wowhead={`spell=${entry.spell_id}`}
                    style={{
                        left: `${(cx - w / 2) / WIDTH * 100}%`, top: `${(cy - r - VIEW_Y) / VIEW_HEIGHT * 100}%`,
                        width: `${w / WIDTH * 100}%`, height: `${2 * r / VIEW_HEIGHT * 100}%`,
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
