import { FaClock, FaCompressAlt, FaHourglass, FaImage, FaSkull, FaStopwatch, FaStream } from 'react-icons/fa';
import { IoFlagSharp } from 'react-icons/io5';
import { ReactNode, useContext, useEffect } from 'react'
import { update_settings } from '../../store/ui'
import { useAppDispatch, useAppSelector } from '../../store/store_hooks'
import ButtonGroup, { ButtonGroupContext } from './shared/ButtonGroup'
import MetricSelect from "./MetricSelect"
import styles from "./DisplaySettings.module.scss";
import { get_fights } from '../../store/fights'
import { get_view_settings, set_view_setting } from '../../store/report_links'



function Button({attr_name, children, tooltip=""} : {attr_name: string, children: ReactNode, tooltip?: string}) {

    ////////////////////////
    // Hooks
    //
    const attr_value = useAppSelector(state => state.ui.settings[attr_name])
    const dispatch = useAppDispatch()
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


/** Dungeon runs: how the unselected pulls show, and which timestamps (see `TimeMap`). Saved like the View Settings. */
function DungeonPullSettings() {

    const dispatch = useAppDispatch()
    const settings = useAppSelector(get_view_settings)
    const has_pulls = useAppSelector(state => get_fights(state).some(fight => fight.pulls?.length))
    if (!has_pulls) { return null }

    const hide = settings.hide_unselected_pulls
    const pull_time = settings.timestamps == "pull"

    return (
        <ButtonGroup name="Dungeon Pulls">
            <div
                className={`${styles.button} button icon-s rounded border-white ${hide ? "" : "disabled"}`}
                onClick={() => dispatch(set_view_setting("hide_unselected_pulls", !hide))}
                data-tooltip={hide ? "Unselected pulls: hidden" : "Unselected pulls: dimmed"}
            >
                <FaCompressAlt />
            </div>
            <div
                className={`${styles.button} button icon-s rounded border-white ${pull_time ? "" : "disabled"}`}
                onClick={() => dispatch(set_view_setting("timestamps", pull_time ? "run" : "pull"))}
                data-tooltip={pull_time ? "Timestamps: pull time" : "Timestamps: run time"}
            >
                <FaStopwatch />
            </div>
        </ButtonGroup>
    )
}


export default function DisplaySettings() {

    return (
        <>
        <ButtonGroup name="Timeline">
            <Button attr_name="show_casticon" tooltip="Spell Icons"><FaImage /></Button>
            <Button attr_name="show_casttime" tooltip="Cast Time"><FaClock /></Button>
            <Button attr_name="show_duration" tooltip="Duration"><FaStream /></Button>
            <Button attr_name="show_cooldown" tooltip="Cooldown" ><FaHourglass /></Button>
            <Button attr_name="show_deaths" tooltip="Deaths" ><FaSkull /></Button>
            <Button attr_name="show_phases" tooltip="Phases" ><IoFlagSharp /></Button>

            <MetricSelect />

        </ButtonGroup>
        <DungeonPullSettings />
        </>
    )
}
