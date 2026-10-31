/*
    Card with the Talents of one player, shown next to their name.

    Rendered into the body (the names list clips its overflow) at a fixed position,
    below the name or above it when there is no room, and always inside the viewport.
*/
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { get_metric } from "../../store/ui";
import { get_spec } from "../../store/specs";
import { get_talent_tree, load_talent_tree } from "../../store/talent_trees";
import { kFormatter } from "../../utils";
import { useAppDispatch, useAppSelector } from "../../store/store_hooks";
import styles from "./TalentCard.module.scss";
import TalentTreeGraph from "./TalentTreeGraph";
import type Actor from "../../types/actor";


const MARGIN = 16  // to the edges of the viewport
const OFFSET = 6   // to the name


function TalentCardBody({ player }: { player: Actor }) {

    const dispatch = useAppDispatch()
    const tree = useAppSelector(state => get_talent_tree(state, player.spec_slug))
    const has_talents = !!player.talents && Object.keys(player.talents).length > 0

    useEffect(() => {
        has_talents && dispatch(load_talent_tree(player.spec_slug))
    }, [has_talents, player.spec_slug])

    if (!has_talents) {
        return <div className={styles.note}>No talent data for this fight yet</div>
    }
    if (tree === undefined) {
        return <div className={styles.note}>Loading talents...</div>
    }
    if (tree === null) {
        return <div className={styles.note}>No talent tree for this spec</div>
    }
    return <TalentTreeGraph tree={tree} talents={player.talents!} />
}


export default function TalentCard({ player, anchor }: { player: Actor, anchor: DOMRect }) {

    const metric = useAppSelector(get_metric)
    const spec = useAppSelector(state => get_spec(state, player.spec_slug))
    const ref = useRef<HTMLDivElement>(null)
    const [position, set_position] = useState<{ left: number, top: number } | null>(null)

    // place it once its size is known (and again whenever that changes, eg.: once the tree is loaded)
    useLayoutEffect(() => {
        const card = ref.current
        if (!card) { return }

        const place = () => {
            const { width, height } = card.getBoundingClientRect()
            let top = anchor.bottom + OFFSET
            if (top + height > window.innerHeight - MARGIN) {
                top = Math.max(MARGIN, anchor.top - height - OFFSET)
            }
            const left = Math.max(MARGIN, Math.min(anchor.left, window.innerWidth - width - MARGIN))
            set_position({ left, top })
        }
        place()

        const observer = new ResizeObserver(place)
        observer.observe(card)
        return () => observer.disconnect()
    }, [anchor])

    return createPortal(
        <div
            ref={ref}
            className={`${styles.card} wow-${spec?.class.name_slug}`}
            style={position ? position : { visibility: "hidden" }}
        >
            <header className={styles.header}>
                <span className={styles.name}>{player.name}</span>
                {!!player.total && <span className={styles.total}>{kFormatter(player.total)} {metric.toUpperCase()}</span>}
            </header>
            <TalentCardBody player={player} />
        </div>,
        document.body,
    )
}
