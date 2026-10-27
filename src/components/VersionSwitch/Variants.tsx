import { ReactNode } from "react"
import { useLocation } from "react-router-dom"
import WowLogo, { version_color } from "./WowLogo"
import styles from "./VersionSwitch.module.scss"
import { useVersionSwitch } from "./useVersionSwitch"


function Tabs() {
    const { versions, current, switch_to } = useVersionSwitch()
    return (
        <div className={styles.tabs}>
            {versions.map(version =>
                <button
                    key={version.name}
                    className={`${styles.tab} ${version.name == current.name ? styles.active : ""}`}
                    onClick={() => switch_to(version)}
                >
                    <WowLogo name={version.name} className={styles.w_tiny} />
                    {version.title}
                </button>
            )}
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


/** Spec rankings: a sliver in the version's color on the left edge, expands on hover. */
export function VersionPeekbar() {
    const { pathname } = useLocation()
    const { versions, current, switch_to } = useVersionSwitch()
    if (!pathname.startsWith("/spec_ranking")) { return null }
    return (
        <div className={styles.peek}>
            <div className={styles.peek_sliver} style={{ background: version_color(current.name) }} />
            <div className={`${styles.peek_panel} bg-dark border rounded`}>
                {versions.map(version =>
                    <div
                        key={version.name}
                        className={`${styles.peek_item} ${version.name == current.name ? styles.active : ""}`}
                        onClick={() => switch_to(version)}
                    >
                        <WowLogo name={version.name} className={styles.w_tiny} />
                        {version.title}
                    </div>
                )}
            </div>
        </div>
    )
}
