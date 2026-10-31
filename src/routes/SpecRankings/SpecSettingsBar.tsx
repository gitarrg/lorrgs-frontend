import { memo } from "react";
import DisplaySettings from '../../components/SettingsBar/DisplaySettings'
import FilterSettings from '../../components/SettingsBar/FilterSettings/FilterSettings'
import SettingsBar from '../../components/SettingsBar/SettingsBar'
import SpellSettings from '../../components/SettingsBar/SpellSettings/SpellSettings'


/** memoized: takes no props, so the page's re-renders (loading flags, spell loads) don't reach it */
function SpecSettingsBar() {

    // Render
    return (
        <SettingsBar>
            <DisplaySettings />
            <SpellSettings />
            {/* spacer to push filter settings to the right side */}
            <div className="ml-auto"></div>

            <FilterSettings />
        </SettingsBar>
    )
}

export default memo(SpecSettingsBar)
