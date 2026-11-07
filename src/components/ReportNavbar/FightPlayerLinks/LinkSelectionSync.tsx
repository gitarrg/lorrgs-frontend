import { useEffect } from "react"
import { useWatch } from "react-hook-form"
import { set_hovered, set_selection } from "../../../store/report_links"
import { useAppDispatch } from "../../../store/store_hooks"


/** ids of the checked items of a form field (`fight[12] = true` -> 12) */
function checked_ids(values?: boolean[]) {
    const ids: number[] = []
    values?.forEach((checked, id) => { if (checked) { ids.push(id) } })
    return ids
}


/**
 * Mirrors the pulls and players selected in the form into the store,
 * so that only the items whose link state changes re-render (instead of every item watching the whole selection).
 */
export default function LinkSelectionSync() {

    const dispatch = useAppDispatch()
    const fights: boolean[] | undefined = useWatch({ name: "fight" })
    const players: boolean[] | undefined = useWatch({ name: "player" })

    const fight_ids = checked_ids(fights).join(".")
    const player_ids = checked_ids(players).join(".")

    useEffect(() => {
        const to_ids = (text: string) => text ? text.split(".").map(Number) : []
        dispatch(set_selection({ fight_ids: to_ids(fight_ids), player_ids: to_ids(player_ids) }))
    }, [fight_ids, player_ids])

    // nothing stays hovered when leaving the page
    useEffect(() => () => { dispatch(set_hovered(null)) }, [])

    return null
}
