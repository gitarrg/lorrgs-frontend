/* SettingsBar for Reports */
import { memo } from "react";
import DisplaySettings from '../../components/SettingsBar/DisplaySettings'
import FilterSettings from '../../components/SettingsBar/FilterSettings/FilterSettings'
import SettingsBar from '../../components/SettingsBar/SettingsBar'
import SpecSettings from '../../components/SettingsBar/SpecSettings'
import SpellSettings from '../../components/SettingsBar/SpellSettings/SpellSettings'
import { Tab, TabGroup, TabMenu } from "../../components/TabMenu"


/** memoized: takes no props, so the page's re-renders (loading flags, spell loads) don't reach it */
function ReportSettingsBar() {

    return (
        <SettingsBar>

            <TabMenu>
                <TabGroup initial_tab={2}>
                    <Tab title="Settings">
                        <DisplaySettings />
                    </Tab>

                    <Tab title="Specs">
                        <SpecSettings />
                    </Tab>

                    <Tab title="Spells">
                        <SpellSettings />
                    </Tab>

                    <Tab title="Filters">
                        <FilterSettings />
                    </Tab>

                </TabGroup>
            </TabMenu>
        </SettingsBar>
    )
}

export default memo(ReportSettingsBar)
