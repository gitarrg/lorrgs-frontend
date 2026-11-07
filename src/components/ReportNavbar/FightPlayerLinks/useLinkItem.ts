import styles from "./FightPlayerLinks.module.scss"
import { get_hover_enabled, get_link_state, set_hovered, type LinkItem } from "../../../store/report_links"
import { useAppDispatch, useAppSelector } from "../../../store/store_hooks"


/** Hovering needs a device that can hover: touch devices only select. */
const CAN_HOVER = typeof window == "undefined" || !window.matchMedia || window.matchMedia("(hover: hover)").matches

const CLASSES: { [state: string]: string } = {
    "": "",
    "linked": styles.linked,
    "dim": styles.dim,
    "grey": styles.grey,
    "linked grey": `${styles.linked} ${styles.grey}`,
    "dim grey": `${styles.dim} ${styles.grey}`,
}


/**
 * How a pull/player on the selection page shows its links (see `store/report_links`):
 * its class name and the handlers that report it being hovered.
 */
export default function useLinkItem(item?: LinkItem) {

    const dispatch = useAppDispatch()
    const link_state = useAppSelector(state => item ? get_link_state(state, item) : "")
    const hover_enabled = useAppSelector(get_hover_enabled) && CAN_HOVER

    if (!item) { return {} }

    return {
        className: CLASSES[link_state],
        onMouseEnter: hover_enabled ? (event: React.MouseEvent<HTMLElement>) => {
            const { left, right, bottom } = event.currentTarget.getBoundingClientRect()
            dispatch(set_hovered({ ...item, anchor: { left, right, bottom } }))
        } : undefined,
        onMouseLeave: hover_enabled ? () => dispatch(set_hovered(null)) : undefined,
    }
}
