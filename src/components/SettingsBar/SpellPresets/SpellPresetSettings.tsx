import { FaShield } from "react-icons/fa6";
import { FaRunning, FaStarOfLife } from 'react-icons/fa';
import { GiHealthNormal, GiTank  } from 'react-icons/gi';
import { ReactNode, useContext, useEffect, useState } from 'react'
import { RiSwordFill } from 'react-icons/ri';
import { set_spell_tag_visible, set_spell_visible } from '../../../store/spells';
import { useAppDispatch } from '../../../store/store_hooks'
import ButtonGroup, { ButtonGroupContext } from './../shared/ButtonGroup'
import React from 'react'

import style from "./SpellPresetSettings.scss"



interface SpellSelection {
    name: string;
    icon: ReactNode;
    tags?: string[];
    spell_ids?: number[];
}


const DEFAULT_SELECTIONS : SpellSelection[] = [

    {
        name: "Everything",
        icon: <FaStarOfLife />,
        tags: [
            "*"
        ],
    },
    {
        name: "Damage",
        icon: <RiSwordFill />,
        tags: [
            "dps"
        ],
    },
    {
        name: "Defensive",
        icon: <FaShield  />,
        tags: [
            "defensive",
        ],
    },
    {
        name: "Tank",
        icon: <GiTank />,
        tags: [
            "tank"
        ],
    },
    {
        name: "Healing",
        icon: <GiHealthNormal />,
        tags: [
            "raid_cd"
        ],
    },
    {
        name: "Movement",
        icon: <FaRunning />,
        tags: [
            "move"
        ],
    },
]




function Button({selection} : {selection: SpellSelection}) {

    ////////////////////////
    // Hooks
    //
    const [selected, setSelected] = useState(true)
    const dispatch = useAppDispatch()
    const group_context = useContext(ButtonGroupContext)


    // Handle Simple Click
    function onClick() {
        setSelected(!selected)
    }

    // Handle Group Header Click
    useEffect(() => {
        if (group_context.source !== "group") { return}
        setSelected(group_context.active)
    }, [group_context.active])

    // Handle "selection"-state --> spell disply
    useEffect(() => {

        // tags
        selection.tags?.forEach(tag => {
            dispatch(set_spell_tag_visible({
                tag: tag,
                visible: selected
            }))
        });

        // spell ids
        selection.spell_ids?.forEach(spell_id => {
            dispatch(set_spell_visible({
                spell_id: spell_id,
                visible: selected
            }))
        });

    }, [selected])

    ////////////////////////
    // Render
    //
    return (
        <div
            className={`${style.button} button icon-s rounded border-white ${selected ? "" : "disabled"}`}
            onClick={onClick}
            data-tooltip={selection.name}
        >
            {selection.icon}
        </div>
    )
}


export function SpellPresetSettings() {

    return (
        <ButtonGroup name="Spell Selections">
            {DEFAULT_SELECTIONS.map(selection => 
                <Button key={selection.name} selection={selection} />
            )}
        </ButtonGroup>
    )
}
