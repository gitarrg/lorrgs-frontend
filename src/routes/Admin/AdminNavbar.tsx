
import { NavLink } from 'react-router-dom';
import styles from  "./AdminNavbar.module.scss"

export default function AdminNavbar() {

    return (
        <nav className={styles.nav}>
            <NavLink to="status" className={styles.nav_link} activeClassName="active">Status</NavLink>
            <NavLink to="spells" className={styles.nav_link} activeClassName="active">Spells</NavLink>
        </nav>
    )
}
