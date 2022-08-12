/* Component to select which boss to display */

import FormGroup from './FormGroup';
import WebpImg from "../../components/WebpImg";
import { get_boss, get_zones } from '../../store/bosses';
import { useAppSelector } from '../../store/store_hooks';
import { useFormContext, useWatch } from "react-hook-form";
import type RaidZone from '../../types/raid_zone';



/* Button to select a single boss */
function BossButton({boss_name} : {boss_name: string}) {

    // State Vars
    const form_methods = useFormContext();
    const selected_boss_name_slug = useWatch({name: "boss_name_slug"})

    const boss = useAppSelector(state => get_boss(state, boss_name))
    if (!boss) {
        return null
    }

    // Constants
    const is_selected = (selected_boss_name_slug == boss.full_name_slug ? "active" : "")

    function onClick() {
        form_methods.setValue("boss_name_slug", boss.full_name_slug)
    }

    // Render
    return (
        <div data-tooltip={boss.full_name}>
            <WebpImg
                className={`boss-button icon-spec icon-m border-black rounded ${is_selected}`}
                src={boss.icon_path}
                alt={boss.name}
                onClick={onClick}
            />
        </div>
    )
}


function RaidZoneGroup({zone} : {zone: RaidZone}) {

    return (
        <FormGroup name={zone.name} className="boss-button-container">
            {zone.bosses.map(boss_name =>
                <BossButton key={boss_name} boss_name={boss_name} />
            )}
        </FormGroup>
    )
}

/* Group of Buttons to allow the user to choose a Boss */
export default function BossSelect() {

    const zones = useAppSelector(state => get_zones(state))

    return (
        <>
        {Object.values(zones).map(zone => 
            <RaidZoneGroup key={zone.id} zone={zone} />
        )}
        </>
    )
}
