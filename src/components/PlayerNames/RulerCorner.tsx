/*
    The corner left of the ruler, above the names (rankings: the run/fight info takes its place in a report).
    The cog opens a menu with the phase selection and display settings.
    Empty for fights without phases.
*/
import { useEffect, type PointerEvent as ReactPointerEvent, type ReactNode, useMemo, useRef, useState } from "react"
import { FaCheckSquare, FaClock, FaCog, FaHourglass, FaImage, FaRegSquare, FaStream } from "react-icons/fa"
import { IoFlagSharp } from "react-icons/io5"
import styles from "./RulerCorner.module.scss"
import { get_phase_names } from "../../pulls"
import { get_fights } from "../../store/fights"
import { set_phase_selection, update_settings } from "../../store/ui"
import { useAppDispatch, useAppSelector } from "../../store/store_hooks"
import { click_phase } from "../Timeline/phase_selection"
import { get_view_settings, set_view_setting } from "../../store/report_links"
import type Fight from "../../types/fight"


const CLOSE_DELAY = 250  // ms


export default function RulerCorner({ fights }: { fights: Fight[] }) {

    const dispatch = useAppDispatch()
    const all_fights = useAppSelector(get_fights)
    const [open, set_open] = useState(false)
    const container = useRef<HTMLDivElement>(null)
    const close_timer = useRef<number>(undefined)

    // hover opens the menu (mouse only: touch taps the cog), a short delay lets the pointer travel into it
    const cancel_close = () => window.clearTimeout(close_timer.current)
    useEffect(() => cancel_close, [])
    const on_enter = (event: ReactPointerEvent) => {
        if (event.pointerType != "mouse") { return }
        cancel_close()
        set_open(true)
    }
    const on_leave = (event: ReactPointerEvent) => {
        if (event.pointerType != "mouse") { return }
        cancel_close()
        close_timer.current = window.setTimeout(() => set_open(false), CLOSE_DELAY)
    }

    const boss_slug = fights.find(fight => fight.boss?.boss_slug)?.boss?.boss_slug
    const phases = useMemo(() => get_phase_names(all_fights, boss_slug), [all_fights, boss_slug])

    // close on click outside, or Escape
    useEffect(() => {
        if (!open) { return }
        const on_pointer = (event: PointerEvent) => container.current?.contains(event.target as Node) || set_open(false)
        const on_key = (event: KeyboardEvent) => event.key == "Escape" && set_open(false)
        document.addEventListener("pointerdown", on_pointer)
        document.addEventListener("keydown", on_key)
        return () => {
            document.removeEventListener("pointerdown", on_pointer)
            document.removeEventListener("keydown", on_key)
        }
    }, [open])

    if (!phases.length) { return <div className={styles.corner} /> }

    return (
        <div className={styles.corner} ref={container} onPointerEnter={on_enter} onPointerLeave={on_leave}>
            <button
                type="button"
                className={`${styles.cog} ${open ? styles.open : ""}`}
                onClick={event => set_open((event.nativeEvent as PointerEvent).pointerType == "mouse" || !open)}  // mouse: hover already opened it
                aria-label="Phase settings"
            >
                <FaCog />
            </button>

            {open && (
                <div className={`${styles.menu} bg-dark border rounded`}>
                    <PhaseMenu phases={phases} />
                </div>
            )}
        </div>
    )
}


////////////////////////////////////////////////////////////////////////////////
// Menu
//

function Item({ checked, onClick, icon, children }: { checked: boolean, onClick: () => void, icon?: ReactNode, children: ReactNode }) {
    return (
        <button type="button" className={styles.item} onClick={onClick} role="menuitemcheckbox" aria-checked={checked}>
            {checked ? <FaCheckSquare className={styles.check} /> : <FaRegSquare className={styles.check} />}
            {icon && <span className={styles.icon}>{icon}</span>}
            {children}
        </button>
    )
}


/** a context menu of toggle groups: phases, how unselected phases show, display settings, time */
function PhaseMenu({ phases }: { phases: string[] }) {

    const dispatch = useAppDispatch()
    const selection = useAppSelector(state => state.ui.phase_selection)
    const display = useAppSelector(state => state.ui.settings)
    const view = useAppSelector(get_view_settings)

    // nothing selected: all phases show
    const selected = selection.filter(name => phases.includes(name))
    const is_shown = (name: string) => selected.length == 0 || selected.includes(name)

    const toggle = (key: string) => dispatch(update_settings({ [key]: !display[key] }))

    return (
        <div role="menu">
            <div className={styles.group}>Phases</div>
            {phases.map(name => (
                <Item key={name} checked={is_shown(name)} onClick={() => dispatch(set_phase_selection(click_phase(phases, selection, name, { shiftKey: false })))}>
                    {name}
                </Item>
            ))}
            <button type="button" className={styles.clear} disabled={selected.length == 0} onClick={() => dispatch(set_phase_selection([]))}>
                clear
            </button>

            <div className={styles.group}>Unselected Phases</div>
            <Item checked={!view.hide_unselected_pulls} onClick={() => dispatch(set_view_setting("hide_unselected_pulls", false))}>dim</Item>
            <Item checked={view.hide_unselected_pulls} onClick={() => dispatch(set_view_setting("hide_unselected_pulls", true))}>hide</Item>

            <div className={styles.group}>Display</div>
            <Item checked={display.show_casticon} onClick={() => toggle("show_casticon")} icon={<FaImage />}>spell icons</Item>
            <Item checked={display.show_duration} onClick={() => toggle("show_duration")} icon={<FaStream />}>spell duration</Item>
            <Item checked={display.show_cooldown} onClick={() => toggle("show_cooldown")} icon={<FaHourglass />}>spell cooldowns</Item>
            <Item checked={display.show_casttime} onClick={() => toggle("show_casttime")} icon={<FaClock />}>cast time</Item>
            <Item checked={display.show_phases} onClick={() => toggle("show_phases")} icon={<IoFlagSharp />}>phase markers</Item>

            <div className={styles.group}>Time</div>
            <Item checked={view.timestamps == "run"} onClick={() => dispatch(set_view_setting("timestamps", "run"))}>relative to pull</Item>
            <Item checked={view.timestamps == "pull"} onClick={() => dispatch(set_view_setting("timestamps", "pull"))}>relative to phase</Item>
        </div>
    )
}
