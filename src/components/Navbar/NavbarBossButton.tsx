import { NavLink, useLocation } from 'react-router';

import type Boss from "../../types/boss"
import { get_mode, MODES } from '../../store/ui';
import { get_spec } from "../../store/specs"
import { useAppSelector } from '../../store/store_hooks';
import styles from "./Navbar.module.scss"
import WebpImg from '../WebpImg';


export function get_link(mode : string, boss: Boss, spec_slug?: string) {
    // is this the time to rename "mode" ?
    if (mode == MODES.COMP_RANKING) { return `/${mode}/${boss.full_name_slug}` }
    if (mode == MODES.SPEC_RANKING) { return `/${mode}/${spec_slug}/${boss.full_name_slug}` }
    return "/"
}


export default function NavbarBossButton({boss} : {boss: Boss}) {

    const mode = useAppSelector(get_mode)
    const spec_slug = useAppSelector(state => get_spec(state)?.full_name_slug)  // just the slug: the spec object changes when its spells load
    const link = get_link(mode, boss, spec_slug)

    // preserve query string
    const { search } = useLocation();
    const full_link = `${link}${search}`

    // Render
    return (
        <NavLink
            to={full_link}
            className={({ isActive }) => `${styles.button} ${isActive ? "active" : ""}`.trim()}
            data-tooltip={boss.full_name} data-tooltip-dir="down"
        >
            <WebpImg
                className="icon-m wow-border-boss rounded grow-when-touched"
                src={boss.icon_path}
                alt={boss.full_name}
            />
        </NavLink>
    )
}

