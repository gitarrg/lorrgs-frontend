import styles from "./FightPlayerLinks.module.scss"
import useUser from "../../../routes/auth/useUser"
import { useFormContext } from "react-hook-form"
import { get_has_player_data, get_hover_enabled, get_link_state, get_linked_ids, set_hovered, type LinkItem } from "../../../store/report_links"
import { useAppDispatch, useAppSelector } from "../../../store/store_hooks"
import type { RootState } from "../../../store/store"


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
 *
 * `select_with_links` selects the item with everything linked to it (a pull with its players / a player with their pulls),
 * replacing the selection or adding to it. Only for users who can select several items (and with the player data to do it).
 */
export default function useLinkItem(item?: LinkItem) {

    const dispatch = useAppDispatch()
    const link_state = useAppSelector(state => item ? get_link_state(state, item) : "")
    const hover_enabled = useAppSelector(get_hover_enabled) && CAN_HOVER
    const can_select_links = useCanSelectLinks()
    const { setValue } = useFormContext()

    if (!item) { return {} }

    function select_with_links(add: boolean) {
        const linked_kind = item!.kind == "fight" ? "player" : "fight"
        const linked_ids = dispatch((_, get_state: () => RootState) => get_linked_ids(get_state(), item!))

        if (!add) {
            setValue(item!.kind, [])
            setValue(linked_kind, [])
        }
        setValue(`${item!.kind}[${item!.id}]`, true)
        linked_ids.forEach(id => setValue(`${linked_kind}[${id}]`, true))
    }

    return {
        className: CLASSES[link_state],
        onMouseEnter: hover_enabled ? (event: React.MouseEvent<HTMLElement>) => {
            const { left, right, bottom } = event.currentTarget.getBoundingClientRect()
            dispatch(set_hovered({ ...item, anchor: { left, right, bottom } }))
        } : undefined,
        onMouseLeave: hover_enabled ? () => dispatch(set_hovered(null)) : undefined,
        select_with_links: can_select_links ? select_with_links : undefined,
    }
}


/** whether Alt+click selects an item with its links (see `useLinkItem`) */
export function useCanSelectLinks() {
    const user = useUser()
    const has_player_data = useAppSelector(get_has_player_data)
    return has_player_data && user.permissions.includes("user_reports")
}
