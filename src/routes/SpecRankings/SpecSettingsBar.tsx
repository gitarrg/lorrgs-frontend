import { memo } from "react";
import DisplaySettings from '../../components/SettingsBar/DisplaySettings'
import FilterSettings from '../../components/SettingsBar/FilterSettings/FilterSettings'
import SettingsBar from '../../components/SettingsBar/SettingsBar'
import SpellSettings from '../../components/SettingsBar/SpellSettings/SpellSettings'
import TalentFilter from '../../components/Talents/TalentFilter'
import { get_has_talents } from '../../store/game_versions'
import { useAppSelector } from '../../store/store_hooks'


/** memoized: takes no props, so the page's re-renders (loading flags, spell loads) don't reach it */
function SpecSettingsBar() {

    const has_talents = useAppSelector(get_has_talents)

    // Render
    return (
        <SettingsBar>
            <DisplaySettings />
            <SpellSettings />
            {/* spacer to push filter settings to the right side */}
            <div className="ml-auto"></div>

            <FilterSettings>
                {has_talents && <TalentFilter />}{/*   only for spec rankings */}
            </FilterSettings>
        </SettingsBar>
    )
}

export default memo(SpecSettingsBar)
