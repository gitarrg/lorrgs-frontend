import NavbarBossButton from "./NavbarBossButton";
import NavbarGroup from './NavbarGroup';
import NavbarZoneDropdown from "./NavbarZoneDropdown";
import { get_boss, get_zones } from '../../store/bosses';
import { get_collapse_raids } from '../../store/game_versions';
import { useAppSelector } from '../../store/store_hooks';
import type RaidZone from "../../types/raid_zone";


////////////////////////////////////////////////////////////////////////////////


function BossButton({ boss_name }: { boss_name: string }) {
    const boss = useAppSelector(state => get_boss(state, boss_name));
    return (
        <NavbarBossButton key={boss.full_name_slug} boss={boss} />
    )
}


/** the raid of the selected boss: all bosses inline */
function ExpandedRaid({ zone }: { zone: RaidZone }) {
    return (
        <NavbarGroup>
            {zone.bosses.map(boss_name =>
                <BossButton key={boss_name} boss_name={boss_name} />
            )}
        </NavbarGroup>
    )
}


/** other raids: one icon each, bosses in a dropdown */
function CollapsedRaids({ zones }: { zones: RaidZone[] }) {
    return (
        <NavbarGroup>
            {zones.map(zone =>
                <NavbarZoneDropdown key={zone.id} zone={zone} />
            )}
        </NavbarGroup>
    )
}


/** all raids expanded: one group of boss icons per raid */
function AllExpanded({ zones }: { zones: RaidZone[] }) {
    return (
        <>
            {zones.map(zone =>
                <ExpandedRaid key={zone.id} zone={zone} />
            )}
        </>
    )
}


/**
 * (if the season sets `collapse_raids`)
 * The selected boss's raid is expanded in place; the raids around it collapse into dropdown groups.
 * eg.: [raid_1 raid_2] [r3_boss1 r3_boss2 r3_boss3] [raid_4 raid_5]
 */
function NavbarBossGroupCollapsed() {

    const zones = useAppSelector(state => get_zones(state))
    const boss_slug = useAppSelector(state => state.ui.boss_slug)

    // split the (ordered) zones into: collapsed run, expanded zone, collapsed run
    const active_index = zones.findIndex(zone => zone.bosses.includes(boss_slug))
    if (active_index < 0) {
        return <CollapsedRaids zones={zones} />  // nothing selected: all collapsed
    }

    const before = zones.slice(0, active_index)
    const after = zones.slice(active_index + 1)

    return (
        <>
            {before.length > 0 && <CollapsedRaids zones={before} />}
            <ExpandedRaid zone={zones[active_index]} />
            {after.length > 0 && <CollapsedRaids zones={after} />}
        </>
    )
}


export default function NavbarBossGroup() {
    const zones = useAppSelector(state => get_zones(state))
    const collapse_raids = useAppSelector(get_collapse_raids)
    return collapse_raids ? <NavbarBossGroupCollapsed /> : <AllExpanded zones={zones} />
}
