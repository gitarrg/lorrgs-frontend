import type Fight from "../../types/fight";
import { useAppSelector } from "../../store/store_hooks";
import { get_mode, MODES } from "../../store/ui";
import { get_dungeon } from "../../store/dungeons";
import { WCL_URL } from "../../constants";
import { toMMSS } from "../../utils";
import PullSelect from "./PullSelect";
import WebpImg from "../WebpImg";
import styles from "./DungeonInfo.module.scss"


/**
 * Takes the place of the `FightInfo` for a dungeon run: its icon (links to the run on Warcraft Logs)
 * and the dropdown to pick its pulls (runs stored before pulls were tracked: the dungeon's name and the run's length). Sits next to the run's `PullRow` on the timeline.
 */
export function DungeonInfo({ fight }: { fight: Fight }) {

    const mode = useAppSelector(get_mode)
    const dungeon = useAppSelector(state => get_dungeon(state, fight.dungeon ?? undefined))
    if (mode != MODES.USER_REPORT) { return null }

    const report_url = `${WCL_URL}/reports/${fight.report_id}#fight=${fight.fight_id}`

    return (
        <div className={styles.container}>
            <a target="_blank" href={report_url} className={styles.icon_link} title={dungeon?.name}>
                {dungeon && <WebpImg className={styles.icon} src={dungeon.icon_path} alt={dungeon.name} />}
            </a>
            {fight.pulls?.length
                ? <PullSelect fight={fight} />
                : <span className={styles.no_pulls}>{dungeon?.name}<span>{toMMSS(fight.duration / 1000)}</span></span>
            }
        </div>
    )
}
