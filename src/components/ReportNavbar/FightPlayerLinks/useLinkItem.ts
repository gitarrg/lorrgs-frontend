import styles from "./FightPlayerLinks.module.scss"
import useUser from "../../../routes/auth/useUser"
import { useEffect } from "react"
import { useFormContext } from "react-hook-form"
import { useStore } from "react-redux"
import {
    get_has_player_data,
    get_hover_enabled,
    get_hovered,
    get_link_state,
    get_linked_ids,
    get_linked_kind,
    set_hovered,
    type LinkItem,
} from "../../../store/report_links"
import { useAppDispatch, useAppSelector } from "../../../store/store_hooks"
import type { RootState } from "../../../store/store"


/** Hovering needs a device that can hover: touch devices only select. */
const CAN_HOVER = typeof window == "undefined" || !window.matchMedia || window.matchMedia("(hover: hover)").matches


function is_hovered(state: RootState, item: LinkItem) {
    const hovered = get_hovered(state)
    return hovered?.kind == item.kind && hovered.id == item.id
}


/**
 * How a pull/player on the selection page shows its links (see `store/report_links`):
 * its class name and the handlers that report it being hovered.
 *
 * Only the link state is subscribed to: the settings are read when an event happens,
 * so a long list of items doesn't re-run several selectors per item on every hover.
 *
 * `select_with_links(add)` selects the item with everything linked to it (a pull with its players / a player with their pulls),
 * replacing the selection or adding to it. It does nothing without the player data to do it;
 * whether the user may select several items is up to the caller.
 */
export default function useLinkItem(item: LinkItem) {

    const dispatch = useAppDispatch()
    const store = useStore<RootState>()
    const link_state = useAppSelector(state => get_link_state(state, item))
    const { setValue } = useFormContext()

    // An item can go away under the cursor (eg. a new report loads), without a mouseleave: don't leave it hovered.
    useEffect(() => {
        return () => {
            if (is_hovered(store.getState(), item)) { dispatch(set_hovered(null)) }
        }
    }, [item.kind, item.id])

    function select_with_links(add: boolean) {
        const state = store.getState()
        if (!get_has_player_data(state)) { return false }

        const linked_kind = get_linked_kind(item.kind)
        if (!add) {
            setValue(item.kind, [])
            setValue(linked_kind, [])
        }
        setValue(`${item.kind}[${item.id}]`, true)
        get_linked_ids(state, item).forEach(id => setValue(`${linked_kind}[${id}]`, true))
        return true
    }

    function onMouseEnter(event: React.MouseEvent<HTMLElement>) {
        if (!CAN_HOVER || !get_hover_enabled(store.getState())) { return }
        const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect()
        dispatch(set_hovered({ ...item, anchor: { left, right, top, bottom } }))
    }

    function onMouseLeave() {
        if (is_hovered(store.getState(), item)) { dispatch(set_hovered(null)) }
    }

    return {
        className: link_state.split(" ").filter(Boolean).map(part => styles[part]).join(" "),
        onMouseEnter,
        onMouseLeave,
        select_with_links,
    }
}


/** whether Alt+click selects an item with its links (see `useLinkItem`) */
export function useCanSelectLinks() {
    const user = useUser()
    const has_player_data = useAppSelector(get_has_player_data)
    return has_player_data && user.permissions.includes("user_reports")
}
