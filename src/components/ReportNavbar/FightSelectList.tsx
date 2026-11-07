import FightWidget from "./FightWidget"
import DungeonRunWidget from "./DungeonRunWidget"
import Icon from "../shared/Icon"
import type Fight from "../../types/fight"
import { SelectGroup } from './SelectGrid/SelectGroup'
import { get_boss } from "../../store/bosses"
import { get_dungeon } from "../../store/dungeons"
import { get_fight_group, get_fight_numbers, get_shown_fights } from '../../store/report_links'
import { group_by } from "../../utils"
import { useAppSelector } from '../../store/store_hooks'
import SelectGrid from "./SelectGrid/SelectGrid"
import styles from "./DungeonRunWidget.module.scss"


function BossGroup({boss_slug, fights} : {boss_slug: string, fights: Fight[]}) {

    const boss = useAppSelector(state => get_boss(state, boss_slug))
    const numbers = useAppSelector(get_fight_numbers)
    if (!boss) { return null }

    // Render
    const icon = <Icon spec={boss} size="m" className="button grow-when-touched" />
    const items = fights.map(fight => <FightWidget key={fight.fight_id} fight={fight} label={`#${numbers[fight.fight_id]}`} />)
    return <SelectGroup icon={icon} items={items} />
}


/** The runs of one dungeon, under its name. */
function DungeonGrid({dungeon_slug, fights} : {dungeon_slug: string, fights: Fight[]}) {

    const dungeon = useAppSelector(state => get_dungeon(state, dungeon_slug))
    const numbers = useAppSelector(get_fight_numbers)
    if (!dungeon) { return null }

    return (
        <SelectGrid title={dungeon.name}>
            <div className={styles.runs}>
                {fights.map(fight => <DungeonRunWidget key={fight.fight_id} fight={fight} label={`#${numbers[fight.fight_id]}`} />)}
            </div>
        </SelectGrid>
    )
}


/** The pulls of the bosses and dungeons we know (see `get_shown_fights`), numbered as in `get_fight_numbers`. */
export default function FightSelectList() {

    // Hooks
    const fights = useAppSelector(get_shown_fights)
    if (fights.length == 0) { return null }

    // boss pulls, grouped by boss
    const boss_fights = fights.filter(fight => fight.boss?.boss_slug)
    const fights_by_boss: {[key: string]: Fight[]} = group_by(boss_fights, get_fight_group)

    // dungeon runs, grouped by dungeon
    const dungeon_fights = fights.filter(fight => !fight.boss?.boss_slug)
    const fights_by_dungeon: {[key: string]: Fight[]} = group_by(dungeon_fights, get_fight_group)

    // render
    return (
        <div className="flex-grow-1 d-flex flex-column gap-3">
            {boss_fights.length > 0 &&
                <SelectGrid title="Pulls:">
                    {Object.keys(fights_by_boss).map(boss_slug =>
                        <BossGroup key={boss_slug} boss_slug={boss_slug} fights={fights_by_boss[boss_slug]} />
                    )}
                </SelectGrid>
            }

            {Object.keys(fights_by_dungeon).map(dungeon_slug =>
                <DungeonGrid key={dungeon_slug} dungeon_slug={dungeon_slug} fights={fights_by_dungeon[dungeon_slug]} />
            )}
        </div>
    )
}
