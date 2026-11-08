import { useMemo } from "react";
import FILTERS from "../../filter_logic";
import RulerCorner from "./RulerCorner";
import PlayerNamesFight from "./PlayerNamesFight";
import { get_fights } from "../../store/fights";
import { useAppSelector } from "../../store/store_hooks";
import { get_mode, MODES } from "../../store/ui";
import styles from "./PlayerNamesList.module.scss"


export default function PlayerNamesList() {

    // get data
    const fights = useAppSelector(state => get_fights(state))
    const mode = useAppSelector(get_mode)
    const filters = useAppSelector(state => state.ui.filters)
    const spell_display = useAppSelector(state => state.spells.spell_display)
    const specs_by_name = useAppSelector(state => state.specs.specs_by_name)

    ///////////////////
    // apply filters
    // spell_display and specs are read through the store inside is_fight_visible
    const visible_fights = useMemo(
        () => fights.filter(fight => FILTERS.is_fight_visible(fight, filters)),  // TODO: add to fight-slice
        [fights, filters, spell_display, specs_by_name]
    )

    ///////////////////
    // render
    return (
        <div className={styles.player_names_list}>
            {/* reports: the first fight's info is in this space */}
            {mode != MODES.USER_REPORT && <RulerCorner fights={visible_fights} />}
            {visible_fights.map(fight => (
                <PlayerNamesFight
                    key={`${fight.report_id}/${fight.fight_id}/${fight.players[0]?.source_id || 0}`}
                    fight={fight}
                />
            ))}
        </div>
    )
}
