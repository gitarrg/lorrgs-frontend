import DropdownMenu from "../DropdownMenu";
import NavbarGroup from './NavbarGroup';
import styles from "./NavbarDifficulty.scss"
import { NavLink } from 'react-router-dom';
import { applyStatics, MenuItem } from '@szhsin/react-menu';
import { get_difficulty, get_mode } from '../../store/ui';
import { useAppSelector } from '../../store/store_hooks';


const DIFFICULTY_COLOR = {
    mythic: "wow-astounding",
    heroic: "wow-artifact",
}


function DifficultyIcon({difficulty} : {difficulty : string}) {

    const class_name = DIFFICULTY_COLOR[difficulty] || ""

    const label = difficulty[0].toUpperCase()
    return (
        <span className={`${styles.icon} ${class_name} icon-m shadow`}>
            <div className={styles.icon_label}>{label}</div>
        </span>
    )
}


function NavbarDifficultyOption({ difficulty, ...props } : { difficulty: string }) {

    const mode = useAppSelector(get_mode);
    const boss_slug : string = useAppSelector(state => state.ui.boss_slug);
    const spec_slug = useAppSelector(state => state.ui.spec_slug);

    difficulty = difficulty.toLowerCase()
    const link = `/${mode}/${spec_slug}/${boss_slug}/${difficulty}`;
    const class_name = DIFFICULTY_COLOR[difficulty] || ""

    return (
        <NavLink to={link} className={`${class_name} ${styles.option}`} activeClassName="active">
            <MenuItem {...props}>
                <DifficultyIcon difficulty={difficulty}/>
                <span className={`${styles.label} ${class_name} ml-1`}>{difficulty}</span>
            </MenuItem>
        </NavLink>
    )
}
applyStatics(MenuItem)(NavbarDifficultyOption)


export default function NavbarDifficulty() {

    const difficulty = useAppSelector(get_difficulty)

    // Render
    const button = <DifficultyIcon difficulty={difficulty} />
    return (
        <NavbarGroup>
            <DropdownMenu button={button}>
                <NavbarDifficultyOption difficulty="mythic" />
                <NavbarDifficultyOption difficulty="heroic" />
            </DropdownMenu>
        </NavbarGroup>
    )
}
