import { get_boss } from '../../store/bosses';
import { useAppSelector } from '../../store/store_hooks';
import type RaidZone from "../../types/raid_zone";
import NavbarBossListItem from './NavbarBossListItem';
import styles from "./Navbar.module.scss"
import WebpImg from '../WebpImg';


/*
    A collapsed raid: a single icon, with the bosses in a dropdown on hover.
    Raids have no icon of their own, so we use the one from the first boss.
*/
export default function NavbarZoneDropdown({ zone }: { zone: RaidZone }) {

    const bosses = useAppSelector(state => zone.bosses.map(name => get_boss(state, name)))
    const first_boss = bosses[0]
    if (!first_boss) return null

    return (
        <div className={`${styles.dropdown_container} ${styles.zone_dropdown}`}>

            {/* The Button itself */}
            <div className={styles.button} data-tooltip-dir="down">
                <WebpImg
                    className="icon-m wow-border-boss rounded"
                    src={first_boss.icon_path}
                    alt={zone.name}
                />
            </div>

            {/* The Dropdown */}
            <div className={`${styles.zone_dropdown__dropdown} bg-dark border rounded p-2`}>
                <div className={styles.boss_list}>
                    <div className={styles.zone_title}>{zone.name}</div>
                    {bosses.map(boss => <NavbarBossListItem key={boss.full_name_slug} boss={boss} />)}
                </div>
            </div>
        </div>
    )
}
