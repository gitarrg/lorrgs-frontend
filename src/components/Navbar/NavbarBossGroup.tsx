import NavbarBossButton from "./NavbarBossButton";
import NavbarGroup from './NavbarGroup';
import { get_boss, get_zones } from '../../store/bosses';
import { useAppSelector } from '../../store/store_hooks';
import type RaidZone from "../../types/raid_zone";


////////////////////////////////////////////////////////////////////////////////


function BossButton({boss_name}: {boss_name : string}) {
    const boss = useAppSelector(state => get_boss(state, boss_name));
    return (
        <NavbarBossButton key={boss.full_name_slug} boss={boss} />
    )
}


function RaidTierGroup({zone} : {zone: RaidZone}) {

    const boss_names = zone.bosses
    return (
        <NavbarGroup>
            {boss_names.map(boss_name =>
                <BossButton key={boss_name} boss_name={boss_name} />
            )}
        </NavbarGroup>
    )
}


export default function NavbarBossGroup() {

    const zones = useAppSelector(state => get_zones(state))
    return (
        <>
        {Object.values(zones).map(zone => 
            <RaidTierGroup key={zone.id} zone={zone} />
        )}
        </>
    )
}
