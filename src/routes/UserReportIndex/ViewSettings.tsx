import styles from "./ViewSettings.module.scss"
import { FaCog } from "react-icons/fa"
import { get_view_settings, set_view_setting, type ViewSettings as ViewSettingsType } from "../../store/report_links"
import { useAppDispatch, useAppSelector } from "../../store/store_hooks"
import { get_user_report_fights } from "../../store/user_reports"
import { useEffect, useRef, useState } from "react"


const OPTIONS: { key: keyof ViewSettingsType, label: string }[] = [
    { key: "hover_fight", label: "Hover a pull to see its players" },
    { key: "hover_player", label: "Hover a player to see their pulls" },
    { key: "grey_out", label: "Grey out what isn't in the selection" },
    { key: "tooltip", label: "Tooltip with players / pulls" },
]


/** Cog with a popover to switch how pulls and players link up on the selection page. */
export default function ViewSettings() {

    const dispatch = useAppDispatch()
    const settings = useAppSelector(get_view_settings)
    const [open, set_open] = useState(false)
    const container = useRef<HTMLDivElement>(null)
    const fights = useAppSelector(get_user_report_fights)

    // close when clicking anywhere else
    useEffect(() => {
        if (!open) { return }
        function on_mouse_down(event: MouseEvent) {
            if (!container.current?.contains(event.target as Node)) { set_open(false) }
        }
        function on_key_down(event: KeyboardEvent) {
            if (event.key == "Escape") { set_open(false) }
        }
        document.addEventListener("mousedown", on_mouse_down)
        document.addEventListener("keydown", on_key_down)
        return () => {
            document.removeEventListener("mousedown", on_mouse_down)
            document.removeEventListener("keydown", on_key_down)
        }
    }, [open])

    // only with a report loaded (like the Load button)
    if (fights.length == 0) { return null }

    return (
        <div ref={container} className={styles.container}>
            <button
                type="button"  // not the form's submit
                className={`${styles.button} ${open ? styles.open : ""} button grow-when-touched`}
                onClick={() => set_open(!open)}
                aria-label="View settings"
                aria-expanded={open}
            >
                <FaCog />
            </button>

            {open && (
                <div className={`${styles.popover} bg-dark border rounded`}>
                    <div className={styles.title}>View Settings</div>
                    {OPTIONS.map(option => (
                        <label key={option.key} className={styles.option}>
                            <input
                                type="checkbox"
                                checked={settings[option.key]}
                                onChange={event => dispatch(set_view_setting(option.key, event.target.checked))}
                            />
                            {option.label}
                        </label>
                    ))}
                </div>
            )}
        </div>
    )
}
