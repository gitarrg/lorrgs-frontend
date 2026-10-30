import { memo } from "react";
import NavbarBossGroup from "./NavbarBossGroup";
import NavbarSpecGroup from "./NavbarSpecGroup";
import NavbarDifficulty from "./NavbarDifficulty";
import { get_boss } from "../../store/bosses";
import { MODES } from "../../store/ui";
import { useAppSelector } from "../../store/store_hooks";
import styles from "./Navbar.module.scss";

////////////////////////////////////////////////////////////////////////////////

/** memoized: takes no props, so the page's re-renders (loading flags, spell loads) don't reach it */
function Navbar() {
    const mode: string = useAppSelector((state) => state.ui.mode);
    const has_fixed_difficulty = useAppSelector((state) => !!get_boss(state)?.difficulty);

    return (
        <div className="ml-auto">
            <div className={styles.navbar_container}>
                {mode == MODES.SPEC_RANKING && <NavbarSpecGroup />}
                {mode == MODES.SPEC_RANKING && !has_fixed_difficulty && <NavbarDifficulty />}
                <NavbarBossGroup />
            </div>
        </div>
    );
}

export default memo(Navbar)
