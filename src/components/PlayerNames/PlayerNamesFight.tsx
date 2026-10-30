import { memo } from "react";
import styles from "./PlayerName.module.scss"
import type Actor from "../../types/actor";
import type Fight from "../../types/fight";
import { FightInfo } from "./FightInfo";
import { PlayerName, BossName} from "./PlayerName"


function create_boss(fight: Fight) {
    if (!(fight.boss?.boss_slug)) {return}
    return <BossName key="boss" fight={fight} boss={fight.boss} />
}


function create_player(fight: Fight, player: Actor) {
    return <PlayerName key={`${fight.report_id}_${player.name}`} fight={fight} player={player} />
}


function create_players(fight: Fight) {
    return fight.players.map(player => ( create_player(fight, player)))
}



/** memoized: the list re-renders on every spell toggle, but a fight's names only change with the fight */
function PlayerNamesFight( {fight} : {fight: Fight} ) {

    return (
        <div className={styles.fight}>
            <div>
                <FightInfo fight={fight} />
                {create_boss(fight)}
                {create_players(fight)}
            </div>
        </div>
    )
}

export default memo(PlayerNamesFight)
