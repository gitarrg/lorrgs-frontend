import { useState } from "react";
import { get_spec } from "../../store/specs";
import { useAppSelector } from '../../store/store_hooks';
import type Role from '../../types/role';
import NavbarSpecsDropdown from './NavbarSpecsDropdown';
import styles from "./Navbar.module.scss"
import WebpImg from "../WebpImg";

/*
    Button for a single role.
    Includes the specs dropdown that should show on hover
*/
export default function NavbarSpecRoleButton({ role } : { role: Role} ) {


    // check if the current spec is inside this role
    const current_spec_slug = useAppSelector(state => get_spec(state)?.full_name_slug);
    const has_active_child = role.specs.includes(current_spec_slug ?? "");

    // only mount the dropdown while hovered: it holds ~10 spec buttons per role,
    // which would otherwise re-render with every navbar update
    const [open, set_open] = useState(false)

    // Render
    return (
        <div
            className={`${styles.dropdown_container}`}
            onMouseEnter={() => set_open(true)}
            onMouseLeave={() => set_open(false)}
        >

            {/* The Button itself */}
            <div className={`${styles.button} ${has_active_child ? "active" : ""}`} >
                <WebpImg
                    className={`icon-spec icon-m border-black rounded wow-border-${role.code}`}
                    src={role.icon_path}
                    alt={role.name}
                />
            </div>

            {/* The Dropdown */}
            {open && <NavbarSpecsDropdown key={role.code} specs={role.specs} />}
        </div>
    );
}
