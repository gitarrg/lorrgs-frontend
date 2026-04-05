import { NavLink } from "react-router-dom"
import styles from "./AdminNavbar.module.scss"

export default function AdminNavbar() {

    const linkClass = ({ isActive }: { isActive: boolean }) =>
        `${styles.nav_link}${isActive ? " active" : ""}`

    return (
        <nav className={styles.nav}>
            <NavLink to="/lorgmin/spec_ranking_status" className={linkClass} end>
                Spec rankings
            </NavLink>
            <NavLink to="/lorgmin/spells" className={linkClass}>
                Spells
            </NavLink>
            <NavLink to="/lorgmin/ping" className={linkClass}>
                Ping
            </NavLink>
        </nav>
    )
}
