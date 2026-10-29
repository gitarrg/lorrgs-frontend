import { ReactNode, useLayoutEffect, useRef, useState } from "react"
import WowLogo, { version_color } from "./WowLogo"
import styles from "./VersionSwitch.module.scss"
import { useVersionSwitch } from "./useVersionSwitch"


function Tabs() {
    const { versions, current, switch_to } = useVersionSwitch()
    const [hovered, set_hovered] = useState<string | null>(null)
    const [bar, set_bar] = useState({ left: 0, width: 0 })
    const refs = useRef<{ [name: string]: HTMLButtonElement | null }>({})

    // the underline follows the hovered tab, and rests on the current one
    const target = hovered ?? current?.name ?? ""
    useLayoutEffect(() => {
        const el = refs.current[target]
        el && set_bar({ left: el.offsetLeft, width: el.offsetWidth })
    }, [target, versions.length])

    return (
        <div className={styles.tabs} onMouseLeave={() => set_hovered(null)}>
            {versions.map(version =>
                <button
                    key={version.name}
                    ref={el => { refs.current[version.name] = el }}
                    className={`${styles.tab} ${version.name == current?.name ? styles.active : ""}`}
                    onClick={() => switch_to(version)}
                    onMouseEnter={() => set_hovered(version.name)}
                >
                    <WowLogo name={version.name} className={styles.w_tiny} />
                    {version.title}
                </button>
            )}
            <div className={styles.tab_bar} style={{ ...bar, background: version_color(target) }} />
        </div>
    )
}


/** Home page: tabs centered in the same row as the login (which keeps its height). */
export function VersionTabs({ children }: { children: ReactNode }) {
    return (
        <div className={`${styles.home_row} mt-1`}>
            <Tabs />
            <div className="d-flex justify-content-end">{children}</div>
        </div>
    )
}


/** User report: tabs centered over the header row, without affecting its layout (parent must be `position: relative`). */
export function VersionTabsCentered() {
    return (
        <div className={styles.tabs_centered}>
            <Tabs />
        </div>
    )
}


/** Spec rankings: the home tab bar, hidden until hovered (a colored sliver stays visible). Sits in the page layout, so it scrolls with the page. */
export function VersionTabsHidden() {
    const { current } = useVersionSwitch()
    if (!current) { return null }  // Game Versions not loaded yet
    return (
        <div className={styles.hidden_tabs}>
            <div className={styles.hidden_tabs_panel}>
                <Tabs />
            </div>
            <div className={styles.hidden_tabs_hit}>
                <div style={{ background: version_color(current.name) }} />
            </div>
        </div>
    )
}
