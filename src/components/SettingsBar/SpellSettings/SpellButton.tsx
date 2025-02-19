import { MouseEvent, useContext, useEffect } from 'react'
import { useDispatch } from 'react-redux'

import styles from "./SpellButton.module.scss"
import type Boss from '../../../types/boss'
import type Class from '../../../types/class'
import type Spec from '../../../types/spec'
import { ButtonGroupContext } from '../shared/ButtonGroup'
import { get_spell, set_spell_visible, get_spell_visible } from '../../../store/spells'
import { useAppSelector } from '../../../store/store_hooks'


const TOOLTIP_DYNAMIC_CD = "The displayed Cooldown for this spell is not exact and only shows an estimate."


function CustomTooltip({tooltip = ""}) {

    if (!tooltip) { return null }

    return (
        <div
            className={styles.info_icon}
            data-tooltip={tooltip}
            data-tooltip-size="small"
        >
            ⚠️
        </div>
    )
}


export default function SpellButton({spec, spell_id, onClick} : { spec: Spec|Boss|Class, spell_id: number, onClick?: Function } ) {

    ////////////////////////////////////////////////////////////////////////////
    // Hooks
    //
    const dispatch = useDispatch()
    const spell = useAppSelector(state => get_spell(state, spell_id))
    const visible = useAppSelector(state => get_spell_visible(state, spell_id))
    const group_context = useContext(ButtonGroupContext)

    ////////////////////////////////////////////////////////////////////////////
    // Vars
    //
    let wow_class = spec.class?.name_slug || spec.name_slug
    const disabled = visible ? "" : "disabled"
    const dynamic_cd = spell.tags?.includes("dynamic_cd")

    ////////////////////////////////////////////////////////////////////////////

    // onClick Callback
    function toggle_spell(event: MouseEvent) {
        const new_value = !visible

        event && event.preventDefault();

        // Toggle the spell itself
        dispatch(set_spell_visible({
            spell_id: spell.spell_id,
            visible: new_value
        }))

        // if the spell became active make sure to also enable the parent group.
        // passing "child" as group_source to differenciate between clicks on the
        // group itself and triggers like these, which should only affect the
        // group itself, but not its children
        if (new_value && group_context.setter) {
            group_context.setter({active: new_value, source: "child"})
        }

        // Invoke any additional onClick Callbacks
        onClick && onClick(new_value)
    }

    // Listen to State Changes of the parent Group
    useEffect(() => {

        // if the state was not changed from the group level,
        // we ignore the event.
        // (eg.: the state was change from another child in the group)
        if (group_context.source !== "group") { return}

        // otherwise (eg.: the entire group was toggled)
        // we match the spells state to the parent state
        dispatch(set_spell_visible({
            spell_id: spell.spell_id,
            visible: group_context.active
        }))

        // Invoke any additional onClick Callbacks
        onClick && onClick(group_context.active)

    }, [group_context.active])

    if (!spell) { return null }
    if (!spec) { return null }

    ////////////////////////////////
    // Render
    return (
        <div className={styles.spell_button}>
            <a href="" data-wowhead={spell.wowhead_data || spell.tooltip_info} onClick={toggle_spell}>
                <img
                    className={`button icon-s rounded wow-border-${wow_class} ${disabled}`}
                    src={spell.icon_path}
                    data-spell_id={spell.spell_id}
                />
            </a>

            {visible && <CustomTooltip tooltip={spell.tooltip} /> }
            {visible && dynamic_cd && <CustomTooltip tooltip={TOOLTIP_DYNAMIC_CD} /> }

        </div>
    )
}
