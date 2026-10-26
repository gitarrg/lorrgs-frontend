import { NavLink, useLocation } from 'react-router-dom';

import type Boss from "../../types/boss"
import { get_mode } from '../../store/ui';
import { get_spec } from "../../store/specs"
import { useAppSelector } from '../../store/store_hooks';
import { get_link } from './NavbarBossButton';
import WebpImg from '../WebpImg';


/* Boss icon + name. Used in the dropdowns of collapsed raids. */
export default function NavbarBossListItem({ boss }: { boss: Boss }) {

    const mode = useAppSelector(get_mode)
    const spec = useAppSelector(state => get_spec(state))
    const { search } = useLocation();  // preserve query string

    return (
        <NavLink to={`${get_link(mode, boss, spec)}${search}`}>
            <WebpImg className="icon-m wow-border-boss rounded" src={boss.icon_path} alt={boss.full_name} />
            <span>{boss.full_name}</span>
        </NavLink>
    )
}
