import ButtonGroup, { ButtonGroupContext } from './shared/ButtonGroup'
import MetricSelect from "./MetricSelect"
import styles from "./DisplaySettings.module.scss";
import { FaClock, FaHourglass, FaImage, FaSkull, FaStream } from 'react-icons/fa';
import { ReactNode, useContext, useEffect } from 'react'
import { update_settings } from '../../store/ui'
import { useAppSelector } from '../../store/store_hooks'
import { useDispatch } from 'react-redux'



function Button({attr_name, children, tooltip=""} : {attr_name: string, children: ReactNode, tooltip?: string}) {

    ////////////////////////
    // Hooks
    //
    const attr_value = useAppSelector(state => state.ui.settings[attr_name])
    const dispatch = useDispatch()
    const group_context = useContext(ButtonGroupContext)

    function onClick() {
        const new_value = !attr_value

        dispatch(update_settings({
            [attr_name]: new_value
        }))

        if (new_value && group_context.setter) {
            group_context.setter({active: new_value, source: "child"})
        }
    }

    // see SpellButton,jsx
    useEffect(() => {
        if (group_context.source !== "group") { return}
        dispatch(update_settings({
            [attr_name]: group_context.active
        }))
    }, [group_context.active])

    ////////////////////////
    // Render
    //
    const tt = tooltip ? {"data-tooltip": tooltip} : {}

    return (
        <div
            className={`${styles.button} button icon-s rounded border-white ${attr_value ? "" : "disabled"}`}
            onClick={onClick}
            {...tt}
        >
            {children}
        </div>
    )
}


export default function DisplaySettings() {

    return (
        <ButtonGroup name="Timeline">
            <Button attr_name="show_casticon" tooltip="Spell Icons"><FaImage /></Button>
            <Button attr_name="show_casttime" tooltip="Cast Time"><FaClock /></Button>
            <Button attr_name="show_duration" tooltip="Duration"><FaStream /></Button>
            <Button attr_name="show_cooldown" tooltip="Cooldown" ><FaHourglass /></Button>
            <Button attr_name="show_deaths" tooltip="Deaths" ><FaSkull /></Button>

            <MetricSelect />

        </ButtonGroup>
    )
}
