/* SettingsBar for Comp Reports*/
import { memo } from "react";
import { Link } from 'react-router';
import DisplaySettings from '../../components/SettingsBar/DisplaySettings'
import SettingsBar from '../../components/SettingsBar/SettingsBar'
import styles from "./CompSettingsBar.module.scss"
import SpellSettings from '../../components/SettingsBar/SpellSettings/SpellSettings';


/** memoized: takes no props, so the page's re-renders (loading flags, spell loads) don't reach it */
function CompSettingsBar() {

    // Render
    return (
        <SettingsBar>
            <DisplaySettings />
            <SpellSettings />

            <div className="flex-grow-1"/>
            <Link
                to="/comp_ranking/search"
                className={`${styles.search_button} btn btn-primary shadow`}
            >
                Search
            </Link>

        </SettingsBar>
    )
}

export default memo(CompSettingsBar)
