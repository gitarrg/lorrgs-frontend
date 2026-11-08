import { useRef, useState } from "react";
import type Fight from "../../types/fight";
import { useAppSelector } from "../../store/store_hooks";
import { get_mode, MODES } from "../../store/ui";
import { get_dungeon } from "../../store/dungeons";
import { WCL_URL } from "../../constants";
import { toMMSS } from "../../utils";
import PullSelect from "./PullSelect";
import DungeonRunInfo, { DungeonRunTitle, get_run_time } from "./DungeonRunInfo";
import WebpImg from "../WebpImg";
import styles from "./DungeonInfo.module.scss"


/**
 * Takes the place of the `FightInfo` for a dungeon run: its icon (links to the run on Warcraft Logs)
 * and the dropdown to pick its pulls (runs stored before pulls were tracked: the dungeon's name and the run's length). Sits next to the run's `PullRow` on the timeline.
 */
export function DungeonInfo({ fight }: { fight: Fight }) {

    const mode = useAppSelector(get_mode)
    const dungeon = useAppSelector(state => get_dungeon(state, fight.dungeon ?? undefined))
    const container = useRef<HTMLDivElement>(null)
    const [card_pos, set_card_pos] = useState<{ x: number, y: number } | null>(null)  // hover card (runs without pulls: else the pull selector opens)
    if (mode != MODES.USER_REPORT) { return null }

    function show_card() {
        const rect = container.current?.getBoundingClientRect()
        rect && set_card_pos({ x: rect.left, y: rect.bottom + 2 })
    }

    const report_url = `${WCL_URL}/reports/${fight.report_id}#fight=${fight.fight_id}`

    return (
        <div ref={container} className={styles.container} onMouseEnter={show_card} onMouseLeave={() => set_card_pos(null)}>
            <a target="_blank" href={report_url} className={styles.icon_link}>
                {dungeon && <WebpImg className={styles.icon} src={dungeon.icon_path} alt={dungeon.name} />}
            </a>
            {fight.pulls?.length
                ? <PullSelect fight={fight} dungeon={dungeon} />
                : <span className={styles.no_pulls}><DungeonRunTitle fight={fight} dungeon={dungeon} short /><span>{toMMSS(get_run_time(fight))}</span></span>
            }

            {/* position: fixed, so the timeline doesn't clip it */}
            {card_pos && !fight.pulls?.length && (
                <div className={`${styles.card} bg-dark border rounded`} style={{ left: card_pos.x, top: card_pos.y }}>
                    <DungeonRunInfo fight={fight} dungeon={dungeon} />
                </div>
            )}
        </div>
    )
}
