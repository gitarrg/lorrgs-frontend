import FightWidget from "./FightWidget"
import Icon from "../shared/Icon"
import type Fight from "../../types/fight"
import { SelectGroup } from './SelectGrid/SelectGroup'
import { get_boss } from "../../store/bosses"
import { get_dungeon } from "../../store/dungeons"
import { get_user_report_fights } from '../../store/user_reports'
import { group_by } from "../../utils"
import { useAppSelector } from '../../store/store_hooks'
import SelectGrid from "./SelectGrid/SelectGrid"


function render_fights(fights: Fight[]) {
    return fights.map((fight, i) => <FightWidget key={fight.fight_id} fight={fight} label={`#${i+1}`} />)
}


function BossGroup({boss_slug, fights} : {boss_slug: string, fights: Fight[]}) {

    const boss = useAppSelector(state => get_boss(state, boss_slug))
    if (!boss) { return null }

    // Render
    const icon = <Icon spec={boss} size="m" className="button grow-when-touched" />
    return <SelectGroup icon={icon} items={render_fights(fights)} />
}


function DungeonGroup({dungeon_slug, fights} : {dungeon_slug: string, fights: Fight[]}) {

    const dungeon = useAppSelector(state => get_dungeon(state, dungeon_slug))
    if (!dungeon) { return null }

    // Render
    const icon = <Icon spec={dungeon} size="m" className="button grow-when-touched" alt={dungeon.name} title={dungeon.name} />
    return <SelectGroup icon={icon} items={render_fights(fights)} />
}


/** key to group a fight by: its boss or its dungeon (prefixed, so the two can't collide) */
function group_key(fight: Fight) {
    if (fight.boss?.boss_slug) { return `boss:${fight.boss.boss_slug}` }
    if (fight.dungeon) { return `dungeon:${fight.dungeon}` }
    return ""
}


export default function FightSelectList() {

    // Hooks
    const fights = useAppSelector(state => get_user_report_fights(state))
    if (fights.length == 0) { return null }

    // group fights by boss / dungeon
    const fight_groups: {[key: string]: Fight[]} = group_by(fights, group_key)

    // render
    return (
        <SelectGrid title="Pulls:">
            {Object.entries(fight_groups).map(([key, group_fights]) => {
                const [type, slug] = key.split(/:(.*)/)
                if (type == "boss") { return <BossGroup key={key} boss_slug={slug} fights={group_fights} /> }
                if (type == "dungeon") { return <DungeonGroup key={key} dungeon_slug={slug} fights={group_fights} /> }
                return null
            })}
        </SelectGrid>
    )
}
