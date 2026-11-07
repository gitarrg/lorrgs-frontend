import styles from "./SelectGrid.module.scss"
import { useFormContext, useWatch } from 'react-hook-form'
import { type JSX, useContext, useEffect } from "react";
import { SelectGroupContext } from "./SelectGroup";
import { SelectGridContext } from "./SelectGrid";
import useUser from "../../../routes/auth/useUser";
import useLinkItem from "../FightPlayerLinks/useLinkItem";
import type { LinkItem } from "../../../store/report_links";


type SelectGridItemProps = {
    /** the pull/player this item is: checked as `fight[12]` / `player[34]`, and shows who was in which pull */
    link: LinkItem
    className?: string
    children: JSX.Element | JSX.Element[]
}



export default function SelectGridItem({link, className="", children}: SelectGridItemProps) {

    const field_name = `${link.kind}[${link.id}]`

    ////////////////////////////////
    // Hooks
    const selected = useWatch({ name: field_name });
    const { setValue } = useFormContext();
    const grid_selected = useContext(SelectGridContext)
    const group_selected = useContext(SelectGroupContext)

    const user = useUser()
    const user_can_multiselect = user.permissions.includes("user_reports")
    const link_props = useLinkItem(link)

    ////////////////////////////////
    // Callbacks
    function onClick(event: React.MouseEvent) {

        // Alt+click: with its linked pulls/players (Shift: added to the selection)
        if (event.altKey && user_can_multiselect && link_props.select_with_links(event.shiftKey)) {
            return
        }

        // force deseletion for free users
        if (!user_can_multiselect) {
            setValue(link.kind, [])
        }

        setValue(field_name, !selected)
    }

    // pass value when the entire grid gets selected
    useEffect(() => {
        setValue(field_name, grid_selected)
    }, [grid_selected])

    // pass values when the group itself gets selected
    useEffect(() => {
        setValue(field_name, group_selected)
    }, [group_selected])

    ////////////////////////////////
    // Render
    return (
        <div
            className={`${styles.item__container} ${className} bg-dark border rounded ${selected ? "selected" : ""} ${link_props.className}`}
            onClick={onClick}
            onMouseEnter={link_props.onMouseEnter}
            onMouseLeave={link_props.onMouseLeave}
        >
            {children}
        </div>
    )
}
